from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import requests
import json

router = APIRouter()

OLLAMA_URL = "http://localhost:11434/api/chat"

class ChatRequest(BaseModel):
    message: str
    history: list = []

def stream_ollama(messages):
    with requests.post(
        OLLAMA_URL,
        json={
            "model": "phi4-mini:latest",
            "messages": messages,
            "stream": True
        },
        stream=True
    ) as r:
        for line in r.iter_lines():
            if line:
                data = json.loads(line.decode("utf-8"))

                if "message" in data and "content" in data["message"]:
                    token = data["message"]["content"]
                    yield token

@router.post("/chat")
def chat(req: ChatRequest):
    messages = req.history + [
        {"role": "user", "content": req.message}
    ]

    return StreamingResponse(
        stream_ollama(messages),
        media_type="text/plain"
    )
