"""
context_builder.py
Builds rich, structured context strings from incident data.
Used both for AI explanation generation and as RAG context for the chat endpoint.
"""


# Static knowledge about the payment service — used to answer general questions
# even when there are no active incidents.
PAYMENT_SERVICE_KNOWLEDGE = """
## Payment Service Overview
The payment-service is a FastAPI application that processes payment transactions.

### Endpoints
- GET /         — health check, returns {"service": "running good"}
- GET /pay      — processes a payment transaction
- GET /recent-traces — returns the last 5 payment trace records

### What /pay does
1. Starts an OpenTelemetry trace span named "process_payment"
2. Simulates processing time by sleeping for a random delay: [0.5s, 0.7s, 3.0s, 4.0s]
3. Records payment_latency_seconds metric (histogram)
4. If duration > 3s, increments payment_failures_total counter
5. Appends trace data (trace_id, latency, endpoint, timestamp) to RECENT_TRACES
6. Returns: {"status": "payment successful", "latency": <float>, "trace_id": <string>}

### Metrics Emitted (via OpenTelemetry → Prometheus)
- payment_latency_seconds — histogram of payment processing duration
- payment_failures_total  — counter incremented when latency > 3 seconds

### Telemetry Pipeline
payment-service → OpenTelemetry Collector (port 4318) → Prometheus (port 9090)

### Thresholds (AlertRAG incident triggers)
- High Latency incident: p95 latency > 2.0 seconds in the last 1 minute
- Payment Failure Spike: > 0 failures in the last 1 minute
"""


def build_incident_context(incident: dict) -> str:
    """Build a rich context string for a single incident."""
    service = incident.get("service", "unknown")
    incident_type = incident.get("type", "unknown")
    detected_at = incident.get("detected_at", "unknown")
    latency_p95 = float(incident.get("latency_p95", 0))
    error_count = float(incident.get("errors", 0))

    slow_traces = incident.get("slow_traces", [])
    slow_count = len(slow_traces)
    endpoints = set(t["endpoint"] for t in slow_traces) if slow_traces else set()
    max_latency = max(t["latency"] for t in slow_traces) if slow_traces else 0

    context = f"""
## Active Incident Report
- Incident ID: {incident.get("id", "N/A")}
- Service: {service}
- Type: {incident_type}
- Detected At: {detected_at}

## Observed Metrics
- p95 latency: {latency_p95:.2f}s (threshold: 2.00s)
- Payment failures in window: {error_count:.0f}
- Slow requests detected: {slow_count}
- Affected endpoints: {", ".join(endpoints) if endpoints else "unknown"}
- Slowest request: {max_latency:.2f}s
"""

    if slow_traces:
        context += "\n## Slow Trace Samples\n"
        for t in slow_traces[:5]:
            context += (
                f"- trace_id={t['trace_id']} "
                f"endpoint={t['endpoint']} "
                f"latency={t['latency']:.2f}s\n"
            )

    context += f"""
## Possible Root Causes
- Random delay of 3.0s or 4.0s was selected by the payment-service simulator
- p95 latency breach indicates >5% of requests in the last minute exceeded 2s
- This triggers the payment_failures_total counter (latency > 3s = failure)

## Recommended Remediation Steps
1. Check payment-service logs for the ratio of slow requests vs fast ones
2. Inspect recent traces at GET /recent-traces to confirm which trace_ids are slow
3. If persistent: scale up payment-service replicas to reduce individual request load
4. Set up alerting on payment_latency_seconds p95 > 1.5s as an early warning
5. Consider adding a timeout circuit breaker on downstream payment processor calls
"""
    return context.strip()


def build_general_context() -> str:
    """Context for when there are no active incidents — used for general chat."""
    return PAYMENT_SERVICE_KNOWLEDGE.strip()


def build_chat_context(incidents: list) -> str:
    """
    Build combined context for the chat endpoint.
    Includes service knowledge + all active incidents (if any).
    """
    ctx = PAYMENT_SERVICE_KNOWLEDGE

    if incidents:
        ctx += "\n\n---\n## Current Active Incidents\n"
        for inc in incidents[-5:]:  # last 5
            ctx += f"\n### {inc.get('id')} — {inc.get('type')} ({inc.get('detected_at', '')[:19]})\n"
            ctx += f"- p95 latency: {float(inc.get('latency_p95', 0)):.2f}s\n"
            ctx += f"- Failures: {inc.get('errors', 0)}\n"
            ctx += f"- Slow traces: {len(inc.get('slow_traces', []))}\n"
            if inc.get("ai_explanation"):
                ctx += f"- AI analysis: {inc['ai_explanation'][:300]}...\n"
    else:
        ctx += "\n\n---\n## Current System Status\nNo active incidents detected. System appears healthy.\n"

    return ctx.strip()
