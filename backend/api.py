from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import subprocess
import requests
import json

router = APIRouter()

OLLAMA_URL = "http://localhost:11434/api/chat"
OLLAMA_CMD = "ollama"

class ChatRequest(BaseModel):
    message: str
    history: list = []
    model: str = "phi4-mini:latest"  # default if not provided

def stream_ollama(messages, model):
    with requests.post(
        OLLAMA_URL,
        json={
            "model": model,
            "messages": messages,
            "stream": True
        },
        stream=True
    ) as r:
        for line in r.iter_lines():
            if line:
                data = json.loads(line.decode("utf-8"))
                if "message" in data and "content" in data["message"]:
                    yield data["message"]["content"]

@router.post("/chat")
def chat(req: ChatRequest):
    messages = req.history + [{"role": "user", "content": req.message}]
    model = req.model
    return StreamingResponse(
        stream_ollama(messages, model),
        media_type="text/plain"
    )

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
