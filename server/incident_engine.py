"""
incident_engine.py
Polls Prometheus for payment service metrics and detects incidents.
Detects:
  - High Latency: p95 > 2s in last 1 minute
  - Payment Failure Spike: any failures in last 1 minute
"""

import os
import math
import requests
from datetime import datetime
from context_builder import build_incident_context
from ai_explainer import explain_incident
from dotenv import load_dotenv

load_dotenv()

PROM_URL = os.getenv("PROMETHEUS_URL", "http://localhost:9090")

# In-memory store — last 50 incidents
INCIDENTS: list[dict] = []
_incident_counter = 0


def _safe_float(value: str, fallback: float = 0.0) -> float:
    """Convert a Prometheus value string to float, replacing Inf/NaN with fallback."""
    try:
        result = float(value)
        return fallback if not math.isfinite(result) else result
    except (ValueError, TypeError):
        return fallback


def _prom_query(query: str) -> list:
    """Query Prometheus instant query API. Returns result list or empty."""
    try:
        resp = requests.get(
            f"{PROM_URL}/api/v1/query",
            params={"query": query},
            timeout=5,
        )
        resp.raise_for_status()
        data = resp.json()
        return data.get("data", {}).get("result", [])
    except Exception as e:
        print(f"[incident_engine] Prometheus query failed: {e}")
        return []


def _fetch_recent_traces() -> list:
    """Fetch recent trace data from the payment service."""
    try:
        resp = requests.get("http://payment-service:8000/recent-traces", timeout=2)
        return resp.json()
    except Exception:
        return []


def detect_incidents() -> list[dict]:
    """
    Run detection queries against Prometheus.
    Creates incidents for any threshold breaches.
    Returns list of NEW incidents detected in this run.
    """
    global _incident_counter

    new_incidents = []

    # Query 1: p95 latency over last 1 minute
    latency_result = _prom_query(
        "histogram_quantile(0.95, sum(increase(payment_latency_seconds_bucket[1m])) by (le))"
    )

    # Query 2: payment failures over last 1 minute
    failure_result = _prom_query(
        "sum(increase(payment_failures_total[1m]))"
    )

    latency_p95 = _safe_float(latency_result[0]["value"][1]) if latency_result else 0.0
    failure_count = _safe_float(failure_result[0]["value"][1]) if failure_result else 0.0
    recent_traces = _fetch_recent_traces()
    slow_traces = [t for t in recent_traces if t.get("latency", 0) > 2]

    # Detect: High Latency
    if latency_p95 > 2.0:
        _incident_counter += 1
        incident = {
            "id": f"INC-{_incident_counter:04d}",
            "service": "payment-service",
            "type": "High Latency",
            "severity": "critical" if latency_p95 > 4.0 else "warning",
            "detected_at": datetime.utcnow().isoformat(),
            "latency_p95": latency_p95,
            "errors": failure_count,
            "slow_traces": slow_traces,
            "trace_status": "ok" if recent_traces else "unavailable",
        }
        context = build_incident_context(incident)
        incident["context"] = context
        incident["ai_explanation"] = explain_incident(context)

        INCIDENTS.append(incident)
        new_incidents.append(incident)
        print(f"[incident_engine] Detected: {incident['id']} — High Latency p95={latency_p95:.2f}s")

    # Detect: Payment Failure Spike (separate incident if no latency incident)
    if failure_count > 0 and latency_p95 <= 2.0:
        _incident_counter += 1
        incident = {
            "id": f"INC-{_incident_counter:04d}",
            "service": "payment-service",
            "type": "Payment Failure Spike",
            "severity": "warning",
            "detected_at": datetime.utcnow().isoformat(),
            "latency_p95": latency_p95,
            "errors": failure_count,
            "slow_traces": slow_traces,
            "trace_status": "ok" if recent_traces else "unavailable",
        }
        context = build_incident_context(incident)
        incident["context"] = context
        incident["ai_explanation"] = explain_incident(context)

        INCIDENTS.append(incident)
        new_incidents.append(incident)
        print(f"[incident_engine] Detected: {incident['id']} — Failure Spike count={failure_count:.0f}")

    # Keep only last 50
    if len(INCIDENTS) > 50:
        INCIDENTS[:] = INCIDENTS[-50:]

    return new_incidents


def get_metrics_snapshot() -> dict:
    """Return current raw metric values for the dashboard metrics panel."""
    latency_result = _prom_query(
        "histogram_quantile(0.95, sum(increase(payment_latency_seconds_bucket[5m])) by (le))"
    )
    latency_avg_result = _prom_query(
        "sum(rate(payment_latency_seconds_sum[5m])) / sum(rate(payment_latency_seconds_count[5m]))"
    )
    failure_result = _prom_query("sum(increase(payment_failures_total[5m]))")
    total_result   = _prom_query("sum(increase(payment_latency_seconds_count[5m]))")

    latency_p95  = _safe_float(latency_result[0]["value"][1])     if latency_result     else 0.0
    latency_avg  = _safe_float(latency_avg_result[0]["value"][1]) if latency_avg_result else 0.0
    failures     = _safe_float(failure_result[0]["value"][1])     if failure_result     else 0.0
    total        = _safe_float(total_result[0]["value"][1])       if total_result       else 0.0
    success_rate = ((total - failures) / total * 100) if total > 0 else 100.0

    return {
        "latency_p95_seconds": round(latency_p95, 3),
        "latency_avg_seconds": round(latency_avg, 3),
        "failures_5m": round(failures, 0),
        "total_requests_5m": round(total, 0),
        "success_rate_pct": round(success_rate, 1),
        "latency_threshold": 2.0,
        "active_incidents": len([i for i in INCIDENTS if True]),  # all are active in this demo
        "prometheus_url": PROM_URL,
    }