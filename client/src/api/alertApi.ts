const BASE = "http://localhost:9000";

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`${res.status} — ${path}`);
  return res.json();
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SlowTrace {
  trace_id: string;
  latency: number;
  endpoint: string;
  ts: number;
}

export interface Incident {
  id: string;
  service: string;
  type: string;
  severity: "critical" | "warning" | "info";
  detected_at: string;
  latency_p95: number;
  errors: number;
  slow_traces: SlowTrace[];
  trace_status: string;
  ai_explanation?: string;
  context?: string;
}

export interface DetectResponse {
  new_incidents: Incident[];
  total_incidents: number;
}

export interface MetricsSnapshot {
  latency_p95_seconds: number;
  latency_avg_seconds: number;
  failures_5m: number;
  total_requests_5m: number;
  success_rate_pct: number;
  latency_threshold: number;
  active_incidents: number;
  prometheus_url: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  reply: string;
  context_used: string;
  active_incidents: number;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const api = {
  health:          () => req<{ status: string; version: string; model: string }>("/health"),
  detect:          () => req<DetectResponse>("/detect", { method: "POST" }),
  listIncidents:   (limit = 20) => req<Incident[]>(`/incidents?limit=${limit}`),
  getIncident:     (id: string) => req<Incident>(`/incidents/${id}`),
  metricsSnapshot: () => req<MetricsSnapshot>("/metrics-snapshot"),
  chat: (message: string, history: ChatMessage[]) =>
    req<ChatResponse>("/chat", {
      method: "POST",
      body: JSON.stringify({ message, history }),
    }),
};

export const API_BASE = BASE;
