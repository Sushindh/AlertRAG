import requests
from datetime import datetime
from context_builder import build_incident_context
from ai_explainer import explain_incident


PROM_URL = "http://prometheus:9090"

INCIDENTS = []  # in-memory store

def query_prometheus(query: str):
    resp = requests.get(
        f"{PROM_URL}/api/v1/query",
        params={"query": query}
    )
    return resp.json()["data"]["result"]

def detect_incidents():
    latency_query = """
    histogram_quantile(
      0.95,
      sum(increase(payment_latency_seconds_bucket[1m])) by (le)
    )
    """

    error_query = """
    sum(increase(payment_failures_total[1m]))
    """

    latency = query_prometheus(latency_query)
    errors = query_prometheus(error_query)

    incidents = []

    if latency and float(latency[0]["value"][1]) > 2:

        #Since this is time series data, if the last indiex has high latency and existing also got high latency then no need to store them
        # if INCIDENTS and INCIDENTS[-1]["type"] == "High Latency":
        #     pass

        incident = {                                    ### THIS IS A DICTIONARY
            "id": f"INC-{len(INCIDENTS)+1}",
            "service": "payment-service",
            "type": "High Latency",
            "detected_at": datetime.utcnow().isoformat(),
            "latency_p95": latency[0]["value"][1],
            "errors": errors[0]["value"][1] if errors else 0
        }
        try:
            recent = requests.get(
                "http://payment-service:8000/recent-traces",
                timeout=2
            ).json()
        except Exception:
            incident["trace_status"] = "Trace data unavailable"


        incident["slow_traces"] = [
            t for t in recent if t["latency"] > 2
        ]

        INCIDENTS.append(incident)
        incidents.append(incident)
    
        context = build_incident_context(incident)
        print(context)
        incident["ai_explanation"] = explain_incident(context)

    return incidents