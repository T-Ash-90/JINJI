from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
import subprocess
import httpx
import json

router = APIRouter()

OLLAMA_URL = "http://localhost:11434/api/chat"
OLLAMA_CMD = "ollama"


class ChatRequest(BaseModel):
    message: str
    history: list = []
    model: str
    options: dict = None


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
                        print("⚠️ Client disconnected — stopping Ollama stream")
                        break

                    if line:
                        try:
                            data = json.loads(line)
                            if "message" in data and "content" in data["message"]:
                                yield data["message"]["content"]
                        except json.JSONDecodeError:
                            continue

    except httpx.RequestError as e:
        print("HTTPX error:", str(e))


# -------------------------
# Chat Endpoint
# -------------------------
@router.post("/chat")
async def chat(req: ChatRequest, request: Request):
    if not req.model:
        return JSONResponse(
            status_code=400,
            content={"error": "No model selected"}
        )

    messages = req.history + [{"role": "user", "content": req.message}]

    options = getattr(req, "options", None)

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
        model_names = []

        for line in lines[1:]:
            if line.strip():
                model_name = line.split()[0]
                model_names.append(model_name)

        model_names.sort()

        if model_names:
            return {"models": model_names, "status": "ok"}
        else:
            return {"models": [], "status": "no models found"}

    except subprocess.CalledProcessError as e:
        return {"models": [], "status": "error", "error": e.stderr.strip()}

    except Exception as e:
        return {"models": [], "status": "error", "error": str(e)}

import subprocess
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse


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
