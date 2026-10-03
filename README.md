# 🚨 AlertRAG – LLM-assisted Incident Analysis for Cloud-Native Services

AlertRAG is an **end‑to‑end observability + incident intelligence platform** that detects production issues using **metrics and traces**, correlates them automatically, and generates **human‑readable AI explanations** for incidents.

This project demonstrates how modern SRE / DevOps systems can move beyond dashboards and alerts into **actionable incident understanding** using:

* OpenTelemetry
* Prometheus
* Distributed tracing
* Incident correlation
* LLM‑based Root Cause Analysis (RAG‑style)

---

## ✨ What Problem Does AlertRAG Solve?

Traditional monitoring answers:

> *“Is something broken?”*

AlertRAG answers:

> *“What broke, why it broke, which requests were affected, and what should we do next?”*

It automatically:

* Detects abnormal latency & errors
* Correlates slow traces with metrics
* Groups evidence into incidents
* Explains incidents in plain English using AI

---

## 🧠 High‑Level Architecture

```
[ payment-service ]
       │
       │ OpenTelemetry (metrics + traces)
       ▼
[ OpenTelemetry Collector ]
       │
       ├──► Prometheus (metrics)
       └──► Trace Store (OTLP)

[ Incident Engine ]
       │
       ├── PromQL (latency / error detection)
       ├── Trace correlation
       └── Incident generation

[ AI Explanation Engine ]
       │
       └── Human‑readable RCA & mitigation steps
```

---

## 🔧 Tech Stack

### Observability

* **FastAPI** – Demo microservice
* **OpenTelemetry SDK** – Metrics & traces
* **OpenTelemetry Collector** – Telemetry pipeline
* **Prometheus** – Metrics backend

### Incident Intelligence

* **PromQL** – SLO / anomaly detection
* **Trace correlation** – Identify slow requests
* **Python Incident Engine** – Detection logic
* **LLM (Azure OpenAI / OpenAI)** – AI explanations

### Infrastructure

* **Docker & Docker Compose** – Local orchestration

---

## 📁 Repository Structure

```
AlertRAG/
├── client/ (Not Integrated)
│  
├── server/
│   ├── incident_engine.py     # Metrics + trace correlation
│   ├── ai_explainer.py        # LLM-based RCA generator
│   ├── main.py                # /detect API
│   └── Dockerfile
│
├── observability/
|   payment-service/
│      ├── app.py              # Instrumented FastAPI service
│      └── Dockerfile
│   ├── docker-compose.yml
│   ├── otel-collector.yaml
│   └── prometheus.yml
│
└── README.md
```

---

## 🚀 How It Works (End‑to‑End Flow)

### 1️⃣ Telemetry Generation

The `payment-service` emits:

* **Histograms** → request latency
* **Counters** → failures
* **Traces** → per-request execution

Each `/pay` request randomly sleeps (0.5s – 4s) to simulate latency spikes.

---

### 2️⃣ Metrics Collection

OpenTelemetry Collector exports metrics to Prometheus.

Key metrics:

* `payment_latency_seconds_bucket`
* `http_server_request_count`

---

### 3️⃣ Incident Detection

The Incident Engine periodically runs **PromQL queries**:

* **Latency (p95)**

```promql
histogram_quantile(
  0.95,
  sum(rate(payment_latency_seconds_bucket[1m])) by (le)
)
```

* **Errors**

```promql
sum(rate(http_server_request_count{http_status_code=~"5.."}[1m]))
```

If thresholds are breached → an incident is created.

---

### 4️⃣ Trace Correlation

Once an incident is detected:

* Slow traces are fetched
* Each trace includes:

  * `trace_id`
  * latency
  * endpoint
  * timestamp

This links **"numbers on dashboards"** to **real user requests**.

---

### 5️⃣ AI‑Powered Explanation

The incident data is passed to an LLM which generates:

* What happened
* Likely root cause
* Immediate mitigation steps
* Long‑term preventive actions

Example output:

```json
{
  "type": "High Latency",
  "latency_p95": "4.75",
  "slow_traces": [...],
  "ai_explanation": "The payment-service experienced..."
}
```

---

## 📡 API Endpoints

### Detect Incidents

```
POST /detect
```

Response:

```json
{
  "incidents": [
    {
      "id": "INC-1",
      "service": "payment-service",
      "type": "High Latency",
      "latency_p95": "4.75",
      "errors": "4.35",
      "slow_traces": [...],
      "ai_explanation": "..."
    }
  ]
}
```

---

## ▶️ Running Locally

### Prerequisites

* Docker
* Docker Compose

### /server/env
You can use Azure, Ollama, or Hugging Face.

Azure:
```
AZURE_OPENAI_ENDPOINT=GET IT FROM AZURE
AZURE_OPENAI_KEY=GET IT FROM AZURE
AZURE_OPENAI_DEPLOYMENT=GET IT FROM AZURE
AZURE_OPENAI_API_VERSION=GET IT FROM AZURE
```

Local / free options:
```
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

Or Hugging Face Inference API:
```
LLM_PROVIDER=huggingface
HUGGINGFACE_MODEL=microsoft/Phi-3-mini-4k-instruct
HUGGINGFACE_API_KEY=your_token_if_needed
```

### Start Everything

```
docker-compose up --build
```

### Generate Load

```
for i in {1..30}; do curl http://localhost:8000/pay; done
```

### Detect Incidents

```
curl -X POST http://localhost:9000/detect
```

---

## 🧪 Demo Scenario

* Latency spikes above 3–4 seconds
* p95 latency crosses threshold
* Incident is created
* Slow traces identified
* AI explains the outage

This mimics **real production incidents**.

---

## 🌟 Why This Project Is Interesting

* Combines **metrics + traces + AI** (rare in demos)
* Shows real SRE workflows
* Not just alerting — **incident understanding**
* Clean separation of observability & intelligence

---

## 🛣️ Future Works:

* **Client–Server Integration**: Complete integration between the frontend client and backend incident engine for real-time incident visualization.
* **Vector Database–Backed Incident Memory**: Store historical incidents and AI-generated explanations in an **Azure Vector Database**, enabling retrieval-augmented generation (RAG) with **Azure OpenAI** to improve accuracy, consistency, and contextual understanding over time.
* **AlertRAG as a Managed Service**: Deploy AlertRAG as a scalable platform/service so that any application can onboard by simply sending OpenTelemetry data and consume AI-powered incident intelligence.

---

## 👤 Author

**Sushindh Anandan**
B.Tech CSE at VIT, Chennai

##
