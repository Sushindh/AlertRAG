"""
ai_explainer.py
LLM interface using Ollama gemma3:4b.
Provides:
  - explain_incident(context) → one-shot incident explanation for SRE
  - chat_with_context(history, context) → multi-turn SRE chat with RAG context
"""

import os
import requests
from dotenv import load_dotenv

load_dotenv()

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL    = os.getenv("OLLAMA_MODEL", "gemma3:4b")


def _call_ollama(prompt: str, system: str = "") -> str:
    """Call Ollama generate endpoint. Returns response text or error string."""
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "num_ctx": 2048,
            "temperature": 0.2,
        },
    }
    if system:
        payload["system"] = system

    try:
        resp = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json=payload,
            timeout=120,
        )
        if resp.status_code != 200:
            err_msg = ""
            try:
                err_msg = resp.json().get("error", resp.text)
            except Exception:
                err_msg = resp.text

            # If GPU OOM or server error, automatically retry with CPU fallback
            if resp.status_code == 500:
                print(f"[ai_explainer] Ollama returned 500 ({err_msg}). Retrying with CPU offload...")
                fallback_payload = dict(payload)
                fallback_payload["options"] = dict(payload["options"])
                fallback_payload["options"]["num_gpu"] = 0
                resp_fallback = requests.post(
                    f"{OLLAMA_BASE_URL}/api/generate",
                    json=fallback_payload,
                    timeout=180,
                )
                if resp_fallback.status_code == 200:
                    return resp_fallback.json().get("response", "").strip()
                try:
                    err_msg = resp_fallback.json().get("error", resp_fallback.text)
                except Exception:
                    err_msg = resp_fallback.text

            return f"⚠️ Ollama error ({resp.status_code}): {err_msg}"

        return resp.json().get("response", "").strip()
    except requests.exceptions.ConnectionError:
        return f"⚠️ Ollama is not reachable at {OLLAMA_BASE_URL}. Make sure `ollama serve` is running."
    except requests.exceptions.Timeout:
        return "⚠️ LLM request timed out. The model may be loading — try again in a moment."
    except Exception as e:
        return f"⚠️ LLM error: {str(e)}"


def explain_incident(context: str) -> str:
    """
    Generate a structured SRE incident explanation.
    Returns a concise analysis with root cause and immediate actions.
    """
    system = (
        "You are an expert Site Reliability Engineer assistant. "
        "You analyze payment service incidents based on observability data. "
        "Be concise, technical, and actionable. "
        "Format your response with: Root Cause, Impact, and Immediate Actions."
    )

    prompt = f"""Analyze this payment service incident and provide a structured explanation:

{context}

Provide:
1. **Root Cause** — what is most likely causing this
2. **Impact** — what the SRE team and end users are experiencing  
3. **Immediate Actions** — the 3 most important steps to take right now
4. **Monitoring** — what metrics to watch while resolving this

Keep each section to 2-3 sentences maximum."""

    return _call_ollama(prompt, system=system)


def chat_with_context(message: str, context: str, history: list[dict]) -> str:
    """
    Answer an SRE's question using the payment service context + incident data as RAG.
    history: list of {"role": "user"|"assistant", "content": str}
    """
    system = (
        "You are AlertRAG, an AI assistant for SRE engineers monitoring a payment service. "
        "You have access to real-time observability data including metrics, traces, and incident reports. "
        "Answer questions accurately based on the provided context. "
        "If information isn't in the context, say so clearly rather than guessing. "
        "Be concise and technical. Format answers clearly."
    )

    # Build conversation history as text
    history_text = ""
    for turn in history[-6:]:  # last 3 exchanges = 6 messages
        role = "SRE Engineer" if turn["role"] == "user" else "AlertRAG"
        history_text += f"\n{role}: {turn['content']}\n"

    prompt = f"""## Payment Service Context
{context}

## Conversation History
{history_text}

## Current Question
SRE Engineer: {message}

AlertRAG:"""

    return _call_ollama(prompt, system=system)
