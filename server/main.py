from fastapi import FastAPI
from incident_engine import detect_incidents

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "AlertRAG running"}

@app.post("/detect")
def run_detection():
    incidents = detect_incidents()
    return {"incidents": incidents}
