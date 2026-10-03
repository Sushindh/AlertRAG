"""
AlertRAG — SRE Incident Monitoring Agent
FastAPI server exposing incident detection, metrics, and AI chat endpoints.
"""

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from incident_engine import detect_incidents, get_metrics_snapshot, INCIDENTS
from ai_explainer import chat_with_context
from context_builder import build_chat_context

load_dotenv()

app = FastAPI(
    title="AlertRAG — SRE Incident Monitoring Agent",
    version="3.0.0",
    description="AI-powered incident detection and SRE chat assistant for payment services.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://localhost:3000"
    ).split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request / Response models ────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str    # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []


# ─── Health ───────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "AlertRAG SRE Agent running",
        "version": "3.0.0",
        "model": os.getenv("OLLAMA_MODEL", "gemma3:4b"),
    }


# ─── Incident Detection ───────────────────────────────────────────────────────

@app.post("/detect")
def run_detection():
    """
    Run one detection cycle against Prometheus.
    Returns any NEW incidents detected in this cycle.
    Called by the frontend every 10 seconds.
    """
    new_incidents = detect_incidents()
    return {
        "new_incidents": new_incidents,
        "total_incidents": len(INCIDENTS),
    }


@app.get("/incidents")
def list_incidents(limit: int = 20):
    """Return the most recent incidents (newest first)."""
    return list(reversed(INCIDENTS[-limit:]))


@app.get("/incidents/{incident_id}")
def get_incident(incident_id: str):
    """Return a single incident by ID with full context."""
    for inc in INCIDENTS:
        if inc["id"] == incident_id:
            return inc
    raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")


# ─── Metrics Snapshot ─────────────────────────────────────────────────────────

@app.get("/metrics-snapshot")
def metrics_snapshot():
    """
    Return current metric values scraped from Prometheus.
    Used by the live Metrics Panel on the frontend.
    """
    return get_metrics_snapshot()


# ─── SRE Chat ─────────────────────────────────────────────────────────────────

@app.post("/chat")
def sre_chat(req: ChatRequest):
    """
    Context-aware AI chat for SRE engineers.
    Answers both:
      - General questions about the payment service
      - Specific questions about active incidents
    Uses gemma3:4b via Ollama with full RAG context.
    """
    # Build context: service knowledge + all recent incidents
    context = build_chat_context(INCIDENTS)

    # Convert pydantic models to plain dicts for the LLM function
    history = [{"role": m.role, "content": m.content} for m in req.history]

    reply = chat_with_context(
        message=req.message,
        context=context,
        history=history,
    )

    return {
        "reply": reply,
        "context_used": "incidents + payment service knowledge",
        "active_incidents": len(INCIDENTS),
    }


# ─── Entry point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=9000, reload=True)
