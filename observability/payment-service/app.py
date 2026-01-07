import time
import random
from fastapi import FastAPI, HTTPException

from opentelemetry import trace
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.trace import get_current_span
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

from opentelemetry import metrics
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.exporter.otlp.proto.http.metric_exporter import OTLPMetricExporter

# ---- OpenTelemetry Setup ----

resource = Resource.create({
    "service.name": "payment-service",
    "deployment.environment": "demo"
})

#TRACES
trace.set_tracer_provider(TracerProvider(resource=resource))
tracer = trace.get_tracer(__name__)

otlp_exporter = OTLPSpanExporter(
    endpoint="http://otel-collector:4318/v1/traces"
)

trace.get_tracer_provider().add_span_processor(
    BatchSpanProcessor(otlp_exporter)
)

# METRICS
metric_exporter = OTLPMetricExporter(
    endpoint="http://otel-collector:4318/v1/metrics"
)

reader = PeriodicExportingMetricReader(
    metric_exporter,
    export_interval_millis=10000  # 10 seconds
)

# default it sends batch for every 60 secs, 
# customize it by export_interval_millis=10000  # every 10 seconds

metrics.set_meter_provider(
    MeterProvider(
        resource=resource,
        metric_readers=[reader]
    )
)

meter = metrics.get_meter(__name__)

payment_latency = meter.create_histogram(
    name="payment_latency_seconds",
    description="Latency of payment processing",
    unit="s",
)

payment_failures = meter.create_counter(
    name="payment_failures_total",
    description="Number of failed payments",
)


# ---- FastAPI App ----

app = FastAPI()
FastAPIInstrumentor.instrument_app(app)

RECENT_TRACES = []


@app.get("/")
def health():
    return {"service":"running good"}

@app.get("/recent-traces")
def recent_traces():
    return RECENT_TRACES[-5:]


@app.get("/pay")
def process_payment():
    start_time = time.time()

    with tracer.start_as_current_span("process_payment"):
        delay = random.choice([0.5, 0.7, 3.0, 4.0])
        time.sleep(delay)

        trace_id = format(
            get_current_span().get_span_context().trace_id,
            "032x"
        )

    duration = time.time() - start_time

    if duration>3:
        payment_failures.add(1)

    payment_latency.record(duration)

    RECENT_TRACES.append({
    "trace_id": trace_id,
    "latency": duration,
    "endpoint": "/pay",
    "ts":time.time() 
    })


    return {
        "status": "payment successful",
        "latency": duration,
        "trace_id": trace_id
    }

