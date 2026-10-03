import { useEffect, useState, useRef } from "react";
import { api, MetricsSnapshot } from "../api/alertApi";
import { Activity, RefreshCw, Zap, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";

type DataPoint = { time: string; p95: number; avg: number; failures: number };

export function MetricsPanel() {
  const [snap, setSnap] = useState<MetricsSnapshot | null>(null);
  const [history, setHistory] = useState<DataPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = async () => {
    try {
      const s = await api.metricsSnapshot();
      setSnap(s);
      setError(null);
      setHistory(prev => {
        const pt: DataPoint = {
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          p95: s.latency_p95_seconds,
          avg: s.latency_avg_seconds,
          failures: s.failures_5m,
        };
        return [...prev.slice(-29), pt]; // keep last 30 points
      });
    } catch (e: any) {
      setError(e.message);
    }
  };

  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, 5000); // refresh every 5s
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const latencyColor = !snap ? "blue"
    : snap.latency_p95_seconds > 4 ? "red"
    : snap.latency_p95_seconds > 2 ? "amber"
    : "green";

  const successColor = !snap ? "green"
    : snap.success_rate_pct < 70 ? "red"
    : snap.success_rate_pct < 90 ? "amber"
    : "green";

  // Simple sparkline using SVG
  const Sparkline = ({ data, color }: { data: number[]; color: string }) => {
    if (data.length < 2) return null;
    const max = Math.max(...data, 0.1);
    const w = 240, h = 50;
    const pts = data.map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - (v / max) * h;
      return `${x},${y}`;
    }).join(" ");

    const colorMap: Record<string, string> = {
      red: "#ef4444", amber: "#f59e0b", green: "#10b981", blue: "#3b82f6"
    };
    const stroke = colorMap[color] ?? "#3b82f6";

    return (
      <svg width={w} height={h} style={{ display: "block", marginTop: 12 }}>
        <defs>
          <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.3" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Fill area */}
        <polygon
          points={`0,${h} ${pts} ${w},${h}`}
          fill={`url(#grad-${color})`}
        />
        <polyline points={pts} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
        {/* Threshold line for latency */}
        {color !== "green" && max > 0 && (
          <line
            x1="0" y1={h - (2 / max) * h}
            x2={w} y2={h - (2 / max) * h}
            stroke="#f43f5e" strokeWidth="1" strokeDasharray="4,3" opacity="0.5"
          />
        )}
      </svg>
    );
  };

  if (error) return (
    <div>
      <div className="page-header"><h1 className="page-title">Live Metrics</h1></div>
      <div className="empty-state card">
        <AlertTriangle size={28} color="var(--red-400)" />
        <h3>Cannot reach Prometheus</h3>
        <p style={{ fontSize: 12 }}>{error}</p>
        <button className="btn btn-secondary mt-4" onClick={load}>Retry</button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Live Metrics</h1>
          <p className="page-subtitle">
            Payment service telemetry from Prometheus · refreshes every 5s
            {snap && <span className="text-muted"> · {snap.prometheus_url}</span>}
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={load}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {!snap ? (
        <div className="loading"><div className="spinner" /><span>Fetching metrics…</span></div>
      ) : (
        <>
          {/* Primary metric cards */}
          <div className="metric-grid metric-grid-4" style={{ marginBottom: 24 }}>
            <div className={`metric-card ${latencyColor}`}>
              <div className={`metric-icon ${latencyColor}`}><Activity size={16} /></div>
              <div className="metric-label">p95 Latency</div>
              <div className={`metric-value ${latencyColor}`}>{snap.latency_p95_seconds.toFixed(2)}s</div>
              <div className="metric-sub">threshold: 2.00s</div>
              <div className="progress-bar mt-2">
                <div className={`progress-fill ${latencyColor}`} style={{ width: `${Math.min((snap.latency_p95_seconds / 5) * 100, 100)}%` }} />
              </div>
            </div>

            <div className="metric-card blue">
              <div className="metric-icon blue"><TrendingUp size={16} /></div>
              <div className="metric-label">Avg Latency</div>
              <div className="metric-value blue">{snap.latency_avg_seconds.toFixed(2)}s</div>
              <div className="metric-sub">mean over 5m</div>
            </div>

            <div className={`metric-card ${snap.failures_5m > 0 ? "red" : "green"}`}>
              <div className={`metric-icon ${snap.failures_5m > 0 ? "red" : "green"}`}>
                {snap.failures_5m > 0 ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
              </div>
              <div className="metric-label">Failures (5m)</div>
              <div className={`metric-value ${snap.failures_5m > 0 ? "red" : "green"}`}>{snap.failures_5m.toFixed(0)}</div>
              <div className="metric-sub">latency &gt; 3s = failure</div>
            </div>

            <div className={`metric-card ${successColor}`}>
              <div className={`metric-icon ${successColor}`}><Zap size={16} /></div>
              <div className="metric-label">Success Rate</div>
              <div className={`metric-value ${successColor}`}>{snap.success_rate_pct.toFixed(1)}%</div>
              <div className="metric-sub">{snap.total_requests_5m.toFixed(0)} requests in 5m</div>
            </div>
          </div>

          {/* Sparkline charts */}
          <div className="grid-2" style={{ marginBottom: 24 }}>
            <div className="card">
              <div className="card-header">
                <span className="card-title">p95 Latency — last 30 observations</span>
                <span className={`badge badge-${latencyColor === "green" ? "green" : latencyColor === "amber" ? "warning" : "critical"}`}>
                  {snap.latency_p95_seconds.toFixed(2)}s
                </span>
              </div>
              <Sparkline data={history.map(h => h.p95)} color={latencyColor} />
              <div className="text-xs text-muted mt-2 flex justify-between">
                <span>{history[0]?.time ?? ""}</span>
                <span>— — — 2s threshold</span>
                <span>{history[history.length - 1]?.time ?? ""}</span>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <span className="card-title">Payment Failures — last 30 observations</span>
                <span className={`badge badge-${snap.failures_5m > 0 ? "critical" : "green"}`}>
                  {snap.failures_5m.toFixed(0)} failures
                </span>
              </div>
              <Sparkline data={history.map(h => h.failures)} color={snap.failures_5m > 0 ? "red" : "green"} />
              <div className="text-xs text-muted mt-2 flex justify-between">
                <span>{history[0]?.time ?? ""}</span>
                <span></span>
                <span>{history[history.length - 1]?.time ?? ""}</span>
              </div>
            </div>
          </div>

          {/* System status */}
          <div className="card">
            <div className="card-header"><span className="card-title">System Status</span></div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green-500)" }} />
                <span className="text-sm text-secondary">payment-service</span>
              </div>
              <div className="flex items-center gap-2">
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green-500)" }} />
                <span className="text-sm text-secondary">otel-collector</span>
              </div>
              <div className="flex items-center gap-2">
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green-500)" }} />
                <span className="text-sm text-secondary">prometheus</span>
              </div>
              <div className="flex items-center gap-2">
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: snap.active_incidents > 0 ? "var(--red-500)" : "var(--green-500)" }} />
                <span className="text-sm text-secondary">{snap.active_incidents > 0 ? `${snap.active_incidents} active incidents` : "No active incidents"}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
