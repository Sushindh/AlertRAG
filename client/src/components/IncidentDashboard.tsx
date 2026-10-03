import { useEffect, useState, useRef } from "react";
import { api, Incident } from "../api/alertApi";
import { AlertTriangle, ChevronDown, ChevronRight, RefreshCw, Zap, Clock, Activity } from "lucide-react";

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export function IncidentDashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "polling" | "error">("idle");
  const [lastPoll, setLastPoll] = useState<string>("");
  const [newCount, setNewCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = async () => {
    setStatus("polling");
    try {
      // Fetch the full incident list (most recent first)
      const all = await api.listIncidents(50);
      setIncidents(all);
      setLastPoll(new Date().toLocaleTimeString());
      setStatus("idle");
    } catch (e) {
      setStatus("error");
    }
  };

  // Also fire /detect every 10s to trigger detection on the backend
  const detect = async () => {
    try {
      const res = await api.detect();
      if (res.new_incidents.length > 0) {
        setNewCount(c => c + res.new_incidents.length);
        poll(); // refresh the list immediately
      }
    } catch (_) {}
  };

  useEffect(() => {
    poll();
    detect();
    intervalRef.current = setInterval(() => {
      detect();
    }, 10000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const toggle = (id: string) => setExpanded(prev => prev === id ? null : id);

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Incident Dashboard</h1>
          <p className="page-subtitle">
            Auto-detecting payment service incidents every 10s
            {lastPoll && <span className="text-muted"> · Last check: {lastPoll}</span>}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {status === "polling" && <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />}
          {status === "error" && <span className="badge badge-critical">Prometheus unreachable</span>}
          <button className="btn btn-secondary btn-sm" onClick={poll}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="metric-grid metric-grid-3" style={{ marginBottom: 24 }}>
        <div className="metric-card red">
          <div className="metric-icon red"><AlertTriangle size={16} /></div>
          <div className="metric-label">Total Incidents</div>
          <div className="metric-value red">{incidents.length}</div>
          <div className="metric-sub">{incidents.filter(i => i.severity === "critical").length} critical</div>
        </div>
        <div className="metric-card amber">
          <div className="metric-icon amber"><Activity size={16} /></div>
          <div className="metric-label">Failure Spikes</div>
          <div className="metric-value amber">{incidents.filter(i => i.type === "Payment Failure Spike").length}</div>
          <div className="metric-sub">payment failure events</div>
        </div>
        <div className="metric-card blue">
          <div className="metric-icon blue"><Zap size={16} /></div>
          <div className="metric-label">High Latency</div>
          <div className="metric-value blue">{incidents.filter(i => i.type === "High Latency").length}</div>
          <div className="metric-sub">p95 &gt; 2s breaches</div>
        </div>
      </div>

      {incidents.length === 0 ? (
        <div className="empty-state card">
          <div style={{ fontSize: 40 }}>✅</div>
          <h3>No Incidents Detected</h3>
          <p>Prometheus is being polled every 10 seconds. All payment service metrics are within thresholds.</p>
        </div>
      ) : (
        <div>
          {incidents.map(inc => (
            <div key={inc.id} className={`incident-card ${inc.severity}`}>
              {/* Header row — always visible */}
              <div className="incident-header" onClick={() => toggle(inc.id)}>
                <div className="flex items-center gap-3">
                  {expanded === inc.id
                    ? <ChevronDown size={16} color="var(--text-muted)" />
                    : <ChevronRight size={16} color="var(--text-muted)" />
                  }
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm" style={{ color: "var(--text-primary)", fontWeight: 600 }}>{inc.id}</span>
                      <span className={`badge badge-${inc.severity === "critical" ? "critical" : "warning"}`}>
                        {inc.type}
                      </span>
                      <span className="badge badge-blue">{inc.service}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                      <span className="flex items-center gap-1"><Clock size={11} /> {timeAgo(inc.detected_at)}</span>
                      <span>p95: <strong style={{ color: inc.latency_p95 > 4 ? "var(--red-400)" : "var(--amber-400)" }}>{Number(inc.latency_p95).toFixed(2)}s</strong></span>
                      <span>failures: <strong style={{ color: "var(--red-400)" }}>{Number(inc.errors).toFixed(0)}</strong></span>
                      <span>slow traces: <strong>{inc.slow_traces?.length ?? 0}</strong></span>
                    </div>
                  </div>
                </div>
                <AlertTriangle size={18} color={inc.severity === "critical" ? "var(--red-400)" : "var(--amber-400)"} />
              </div>

              {/* Expanded body */}
              {expanded === inc.id && (
                <div className="incident-body" style={{ paddingTop: 16 }}>
                  <div className="grid-2">
                    {/* Slow traces */}
                    <div>
                      <div className="card-title mb-2">Slow Traces ({inc.slow_traces?.length ?? 0})</div>
                      {inc.slow_traces && inc.slow_traces.length > 0 ? (
                        <table className="trace-table">
                          <thead>
                            <tr>
                              <th>Trace ID</th>
                              <th>Endpoint</th>
                              <th>Latency</th>
                            </tr>
                          </thead>
                          <tbody>
                            {inc.slow_traces.slice(0, 5).map(t => (
                              <tr key={t.trace_id}>
                                <td className="truncate" style={{ maxWidth: 140 }}>{t.trace_id}</td>
                                <td>{t.endpoint}</td>
                                <td className={t.latency > 3 ? "slow" : ""}>{t.latency.toFixed(2)}s</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="text-muted text-sm">No trace data available</p>
                      )}
                    </div>

                    {/* Metric summary */}
                    <div>
                      <div className="card-title mb-2">Metrics at Detection Time</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div>
                          <div className="text-xs text-muted mb-1">p95 Latency</div>
                          <div className="font-mono" style={{ fontSize: 20, fontWeight: 700, color: "var(--red-400)" }}>
                            {Number(inc.latency_p95).toFixed(2)}s
                          </div>
                          <div className="progress-bar mt-2">
                            <div className="progress-fill red" style={{ width: `${Math.min((inc.latency_p95 / 5) * 100, 100)}%` }} />
                          </div>
                          <div className="text-xs text-muted mt-1">Threshold: 2.00s</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted mb-1">Payment Failures</div>
                          <div className="font-mono" style={{ fontSize: 20, fontWeight: 700, color: "var(--amber-400)" }}>
                            {Number(inc.errors).toFixed(0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Explanation */}
                  <div className="ai-box">
                    <div className="ai-box-header">
                      <Zap size={14} color="var(--violet-400)" />
                      <span className="ai-label">AI Root Cause Analysis — gemma3:4b</span>
                    </div>
                    {inc.ai_explanation ? (
                      <div className="ai-text">{inc.ai_explanation}</div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted text-sm">
                        <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                        Generating AI explanation…
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
