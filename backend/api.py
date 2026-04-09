from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
import subprocess
import httpx
import json
import math
from logs import log

router = APIRouter()

OLLAMA_URL = "http://localhost:11434/api/chat"
OLLAMA_CMD = "ollama"

# -------------------------
# Chat request schema
# -------------------------
class ChatRequest(BaseModel):
    message: str
    history: list = []
    model: str
    options: dict = None

# -------------------------
# Token estimation
# -------------------------
def estimate_tokens(text: str) -> int:
    if not text:
        return 0
    word_count = len(text.split())
    char_count = len(text)
    word_based_tokens = math.ceil(word_count * 1.33)
    char_based_tokens = math.ceil(char_count / 3.5)
    hybrid_estimate = math.ceil((word_based_tokens + char_based_tokens) / 2)
    return hybrid_estimate

# -------------------------
# Async Ollama Stream
# -------------------------
async def stream_ollama(request: Request, messages, model, options=None):
    payload = {
        "model": model,
        "messages": messages,
        "stream": True
    }
    if options:
        payload["options"] = options

    try:
        async with httpx.AsyncClient(timeout=None) as client:
            async with client.stream("POST", OLLAMA_URL, json=payload) as response:
                async for line in response.aiter_lines():
                    if await request.is_disconnected():
                        log("Client disconnected — stopping Ollama stream", "INFO", "CHAT")
                        break
                    if line:
                        try:
                            data = json.loads(line)
                            if "message" in data and "content" in data["message"]:
                                yield data["message"]["content"]
                        except json.JSONDecodeError:
                            continue
    except httpx.RequestError as e:
        log(f"HTTPX error: {e}", "ERROR", "CHAT")

# -------------------------
# Chat endpoint
# -------------------------
@router.post("/chat")
async def chat(req: ChatRequest, request: Request):
    if not req.model:
        return JSONResponse(
            status_code=400,
            content={"error": "No model selected"}
        )

    messages = (req.history or []) + [{"role": "user", "content": req.message}]
    options = getattr(req, "options", None)
    max_tokens = options.get("num_ctx") if options else None

    total_tokens = 0
    role_tokens = {"system": 0, "user": 0, "assistant": 0}

    for m in messages:
        role = m.get("role", "unknown")
        content = m.get("content", "")
        est_tokens = estimate_tokens(content)

        total_tokens += est_tokens
        if role in role_tokens:
            role_tokens[role] += est_tokens
        else:
            role_tokens[role] = est_tokens

    has_context = any(
        m.get("role") == "system" and "code context" in m.get("content", "").lower()
        for m in messages
    )

    log(
        f"model={req.model} num_ctx={max_tokens} messages={len(messages)} total_tokens≈{total_tokens}",
        "INFO",
        "CHAT"
    )

    log(
        f"tokens → system={role_tokens.get('system',0)} | user={role_tokens.get('user',0)} | assistant={role_tokens.get('assistant',0)}",
        "INFO",
        "CHAT"
    )

    log(
        f"context → {'included' if has_context else 'none'}",
        "INFO",
        "CHAT"
    )

    if max_tokens and total_tokens > max_tokens:
        log(
            f"⚠️ exceeds context window: {total_tokens} > {max_tokens}",
            "INFO",
            "CHAT"
        )

    return StreamingResponse(
        stream_ollama(request, messages, req.model, options),
        media_type="text/plain"
    )

# -------------------------
# Models Endpoint
# -------------------------
@router.get("/models")
def list_models():
    try:
        result = subprocess.run(
            [OLLAMA_CMD, "list"],
            capture_output=True,
            text=True,
            check=True
        )

        lines = result.stdout.strip().splitlines()
        model_names = [line.split()[0] for line in lines[1:] if line.strip()]
        model_names.sort()

        if model_names:
            return {"models": model_names, "status": "ok"}
        else:
            return {"models": [], "status": "no models found"}

    except subprocess.CalledProcessError as e:
        return {"models": [], "status": "error", "error": e.stderr.strip()}
    except Exception as e:
        return {"models": [], "status": "error", "error": str(e)}

# -------------------------
# Model Info Endpoint
# -------------------------
@router.get("/models/{model_name}")
async def show_model(model_name: str):
    try:
        result = subprocess.run(
            [OLLAMA_CMD, "show", model_name],
            capture_output=True,
            text=True,
            check=True
        )
        return JSONResponse(content={"model_info": result.stdout.strip()})
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=400, detail=f"Error fetching model info: {e.stderr.strip()}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
