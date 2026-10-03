# AlertRAG — SRE Incident Monitoring Agent
> **Version:** 3.0.0 | **Stack:** FastAPI · OpenTelemetry · Prometheus · Ollama (gemma3:4b) · Docker

---

## 🧠 What is AlertRAG?

AlertRAG is an **AI-powered SRE (Site Reliability Engineering) monitoring system** that:
- Simulates a real payment microservice with latency and failure metrics
- Collects telemetry (traces + metrics) via **OpenTelemetry**
- Stores and queries metrics via **Prometheus**
- **Automatically detects incidents** by polling Prometheus on thresholds
- **Explains incidents** using a local LLM (Ollama / gemma3:4b) with RAG context
- Provides an **SRE Chat interface** so engineers can ask questions about the system in real time

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Your Browser                         │
│                  Frontend (Vite/React — :5173)              │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API
┌────────────────────────▼────────────────────────────────────┐
│              AlertRAG Server (FastAPI — :9000)               │
│   main.py → incident_engine.py → ai_explainer.py            │
│                      context_builder.py                      │
└──────────┬────────────────────────────┬─────────────────────┘
           │ PromQL queries             │ /recent-traces
┌──────────▼──────────┐    ┌───────────▼──────────────────────┐
│  Prometheus (:9090) │    │  Payment Service (FastAPI — :8000)│
│  scrapes metrics    │    │  /pay  /recent-traces  /          │
│  from OTel          │    └───────────┬──────────────────────┘
└──────────▲──────────┘               │ OTLP (traces + metrics)
           │                ┌──────────▼──────────────────────┐
           │ :9464          │  OTel Collector (:4318/:9464)    │
           └────────────────│  receivers → batch → exporters  │
                            └─────────────────────────────────┘

           Ollama (host machine — :11434)
           Model: gemma3:4b  [GPU: RTX 4050 via CUDA]
```

---

## 📦 Services (Docker Compose)

| Service | Image / Build | Port | Role |
|---|---|---|---|
| `otel-collector` | `otel/opentelemetry-collector-contrib:0.127.0` | `4318`, `9464` | Receives OTLP data, exports to Prometheus |
| `prometheus` | `prom/prometheus:latest` | `9090` | Metrics storage & PromQL queries |
| `payment-service` | `./observability/payment-service` | `8000` | Simulated payment microservice with OTel |
| `server` | `./server` | `9000` | AlertRAG backend — incident engine + AI |
| `ollama` | Host machine (not in Docker) | `11434` | LLM inference (gemma3:4b) |
| `frontend` | `./client` (Vite dev server) | `5173` | React dashboard UI |

---

## 🔌 API Endpoints

### AlertRAG Server — `http://localhost:9000`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service health check. Returns version + model info |
| `POST` | `/detect` | Run one incident detection cycle. Returns new incidents found |
| `GET` | `/incidents` | List all incidents (newest first). Query param: `?limit=20` |
| `GET` | `/incidents/{incident_id}` | Get a single incident by ID (e.g. `INC-0001`) |
| `GET` | `/metrics-snapshot` | Live metric values from Prometheus for the dashboard |
| `POST` | `/chat` | SRE chat with RAG context. Body: `{message, history[]}` |

#### `/health` Response
```json
{
  "status": "AlertRAG SRE Agent running",
  "version": "3.0.0",
  "model": "gemma3:4b"
}
```

#### `/detect` Response
```json
{
  "new_incidents": [ { ...incident object... } ],
  "total_incidents": 5
}
```

#### `/incidents` Response (array of)
```json
{
  "id": "INC-0001",
  "service": "payment-service",
  "type": "High Latency",
  "severity": "critical",
  "detected_at": "2026-10-03T14:00:00.000000",
  "latency_p95": 4.1,
  "errors": 2.0,
  "slow_traces": [ { "trace_id": "...", "latency": 4.0, "endpoint": "/pay", "ts": 1234567890 } ],
  "trace_status": "ok",
  "context": "## Active Incident Report ...",
  "ai_explanation": "Root Cause: ..."
}
```

#### `/metrics-snapshot` Response
```json
{
  "latency_p95_seconds": 3.512,
  "latency_avg_seconds": 1.873,
  "failures_5m": 4.0,
  "total_requests_5m": 10.0,
  "success_rate_pct": 60.0,
  "latency_threshold": 2.0,
  "active_incidents": 3,
  "prometheus_url": "http://prometheus:9090"
}
```

#### `/chat` Request / Response
```json
// Request
{
  "message": "Why is the payment service slow?",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}

// Response
{
  "reply": "Based on current metrics, p95 latency is 4.1s ...",
  "context_used": "incidents + payment service knowledge",
  "active_incidents": 3
}
```

---

### Payment Service — `http://localhost:8000`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check → `{"service": "running good"}` |
| `GET` | `/pay` | Simulate a payment (random delay: 0.5s, 0.7s, 3.0s, 4.0s) |
| `GET` | `/recent-traces` | Last 5 trace records (trace_id, latency, endpoint, ts) |

#### `/pay` Response
```json
{
  "status": "payment successful",
  "latency": 3.002,
  "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736"
}
```

> **Failure logic:** Any request with `latency > 3s` is counted as a failure → increments `payment_failures_total`

---

### Prometheus — `http://localhost:9090`

| Metric | Type | Description |
|---|---|---|
| `payment_latency_seconds` | Histogram | Processing time of each `/pay` request |
| `payment_failures_total` | Counter | Count of payments where latency > 3s |

#### Useful PromQL Queries
```promql
# p95 latency over last 5 minutes
histogram_quantile(0.95, sum(increase(payment_latency_seconds_bucket[5m])) by (le))

# Average latency over last 5 minutes
sum(rate(payment_latency_seconds_sum[5m])) / sum(rate(payment_latency_seconds_count[5m]))

# Failures in last 5 minutes
sum(increase(payment_failures_total[5m]))

# Total requests in last 5 minutes
sum(increase(payment_latency_seconds_count[5m]))
```

---

## 🚨 Incident Detection Logic

Incidents are triggered in `incident_engine.py` by polling Prometheus every 10 seconds (via frontend calling `POST /detect`):

| Incident Type | Trigger Condition | Severity |
|---|---|---|
| **High Latency** | p95 latency > 2.0s in last 1 minute | `warning` (>2s) / `critical` (>4s) |
| **Payment Failure Spike** | failures > 0 in last 1 minute AND p95 ≤ 2.0s | `warning` |

> Incidents are stored **in-memory** (last 50). Each incident gets an **AI explanation** generated via Ollama immediately on detection.

---

## 🤖 AI / LLM Integration

- **Model:** `gemma3:4b` via Ollama (runs on host machine)
- **Ollama URL:** `http://host.docker.internal:11434` (Docker → Host bridge)
- **Context window:** 2048 tokens, temperature: 0.2

### Two AI functions:

| Function | Purpose |
|---|---|
| `explain_incident(context)` | One-shot: generates Root Cause, Impact, Immediate Actions, Monitoring for a new incident |
| `chat_with_context(message, context, history)` | Multi-turn: SRE chat using RAG context (service knowledge + recent incidents) |

### Fallback behavior:
If Ollama returns HTTP 500 (e.g., GPU OOM), it **automatically retries with `num_gpu=0`** (CPU fallback).

---

## 🔭 OpenTelemetry Pipeline

```
payment-service
    │
    │ OTLP/HTTP (traces + metrics)
    ▼
otel-collector :4318
    │
    ├── Traces  → debug exporter (logged to stdout)
    └── Metrics → prometheus exporter :9464
                        │
                        ▼
                  Prometheus :9090
                  (scraped every 5s)
```

Metrics export interval from payment-service: **every 10 seconds**

---

## 🗂️ Project Structure

```
AlertRAG/
├── docker-compose.yaml              # All services defined here
├── otel-collector.yaml              # OTel collector pipeline config
├── prometheus.yml                   # Prometheus scrape config (5s interval)
│
├── server/                          # AlertRAG Backend
│   ├── main.py                      # FastAPI app + all endpoint handlers
│   ├── incident_engine.py           # Prometheus polling + incident detection logic
│   ├── ai_explainer.py              # Ollama LLM calls (explain + chat)
│   ├── context_builder.py           # RAG context builder (incident + service knowledge)
│   ├── requirements.txt             # fastapi, uvicorn, requests, python-dotenv
│   ├── Dockerfile
│   └── .env                         # Local env vars (LLM_PROVIDER, OLLAMA_*, PROMETHEUS_URL)
│
├── observability/
│   └── payment-service/             # Simulated payment microservice
│       ├── app.py                   # FastAPI + OpenTelemetry instrumented app
│       ├── requirements.txt         # fastapi, uvicorn, opentelemetry-*
│       └── Dockerfile
│
└── client/                          # Frontend (Vite + React)
    ├── src/
    ├── package.json
    └── vite.config.ts
```

---

## ⚙️ Environment Variables (Server)

| Variable | Default | Description |
|---|---|---|
| `LLM_PROVIDER` | `ollama` | LLM backend provider |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_MODEL` | `gemma3:4b` | Model to use |
| `PROMETHEUS_URL` | `http://localhost:9090` | Prometheus instance URL |
| `CORS_ORIGINS` | `http://localhost:5173,...` | Allowed frontend origins |

---

## 🚀 Quick Start

```powershell
# 1. Start Ollama on host (uses RTX 4050 GPU automatically via CUDA)
ollama serve
ollama pull gemma3:4b

# 2. Start all Docker services
docker compose up --build

# 3. Start frontend dev server
cd client
npm install
npm run dev
```

**Access points:**
- Frontend Dashboard: http://localhost:5173
- AlertRAG API: http://localhost:9000
- Prometheus: http://localhost:9090
- Payment Service: http://localhost:8000

### Generate test traffic (trigger incidents):
```powershell
# Hit payment endpoint repeatedly — 50% chance of slow response (>3s = failure)
1..20 | ForEach-Object { curl http://localhost:8000/pay }
```

---

## 🐛 Bug Fixes Made

### `ValueError: Out of range float values are not JSON compliant`
- **Endpoint:** `GET /metrics-snapshot`
- **Cause:** Prometheus `histogram_quantile()` returns `+Inf` or `NaN` when data is sparse. Python's `float("+Inf")` works but `json.dumps(inf)` is invalid JSON.
- **Fix:** Added `_safe_float()` helper in `incident_engine.py` using `math.isfinite()` to replace `Inf`/`NaN` with `0.0` before serialization.

```python
def _safe_float(value: str, fallback: float = 0.0) -> float:
    try:
        result = float(value)
        return fallback if not math.isfinite(result) else result
    except (ValueError, TypeError):
        return fallback
```

---

## 📌 Key Design Decisions

| Decision | Reason |
|---|---|
| Ollama runs on **host**, not in Docker | Allows direct GPU (RTX 4050) access without NVIDIA Container Toolkit complexity |
| Incidents stored **in-memory** | Simple demo setup; last 50 incidents kept to prevent unbounded growth |
| Frontend calls `/detect` every **10s** | Polling-based; simpler than WebSockets for a demo |
| `_safe_float()` wraps all Prometheus values | Prometheus can return `+Inf`/`NaN` in edge cases — JSON-safe handling is critical |
| Context window: **2048 tokens** | Balances quality vs speed on a 4GB VRAM budget (RTX 4050 Laptop) |
| AI chat uses last **3 exchanges** (6 messages) of history | Prevents context overflow while maintaining conversation continuity |
