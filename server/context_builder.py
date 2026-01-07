


def build_incident_context(incident: dict) -> str:
    service = incident["service"]
    incident_type = incident["type"]
    detected_at = incident["detected_at"]
    latency_p95 = float(incident["latency_p95"])
    error_rate = float(incident.get("errors", 0))

    slow_traces = incident.get("slow_traces", [])
    slow_count = len(slow_traces)

    endpoints = set(t["endpoint"] for t in slow_traces)
    max_latency = max(t["latency"] for t in slow_traces) if slow_traces else 0

    context = f"""
    Incident Summary
    ----------------
    Service: {service}
    Incident Type: {incident_type}
    Detected At: {detected_at}

    Observations
    ------------
    - p95 latency increased to {latency_p95:.2f} seconds
    - {slow_count} slow requests detected in the last observation window
    - Affected endpoints: {", ".join(endpoints)}
    - Slowest request duration: {max_latency:.2f} seconds
    """

    if error_rate > 0:
        context += f"- Error rate observed: {error_rate:.2f} errors/sec\n"

    context += "\nSlow Trace Samples\n------------------\n"

    for t in slow_traces[:3]:
        context += (
            f"- trace_id={t['trace_id']} "
            f"endpoint={t['endpoint']} "
            f"latency={t['latency']:.2f}s\n"
        )

    return context.strip()

