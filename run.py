import subprocess
import time
import requests
import uvicorn
import signal
import sys
import threading
import atexit
import os
from backend.logs import process_log_line, setup_logging, log

OLLAMA_URL = "http://localhost:11434"

ollama_process = None
OLLAMA_PIPE = None
started_ollama = False
uvicorn_server = None
stop_event = threading.Event()

# -------------------------
# Ollama helpers
# -------------------------
def is_ollama_running():
    try:
        requests.get(OLLAMA_URL, timeout=1)
        return True
    except requests.exceptions.RequestException:
        return False

def start_ollama():
    global OLLAMA_PIPE
    log("Starting Ollama...", "SERVER", "APP")
    process = subprocess.Popen(
        ["ollama", "serve"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        start_new_session=True,
    )
    OLLAMA_PIPE = process.stdout
    return process

def wait_for_ollama(timeout=20):
    log("Waiting for Ollama to be ready...", "SERVER", "APP")
    for _ in range(timeout):
        if is_ollama_running():
            log("Ollama is up.", "SERVER", "APP")
            return True
        time.sleep(1)
    log("Ollama failed to start within timeout.", "ERROR", "APP")
    return False

def stream_ollama_output():
    if not OLLAMA_PIPE:
        return
    for raw_line in OLLAMA_PIPE:
        if raw_line:
            process_log_line(raw_line, source="OLLAMA")

# -------------------------
# FastAPI helpers
# -------------------------
def start_fastapi():
    global uvicorn_server
    log("Starting FastAPI server...", "SERVER", "APP")
    config = uvicorn.Config(
        "backend.server:app",
        host="127.0.0.1",
        port=8000,
        reload=False,
    )
    uvicorn_server = uvicorn.Server(config)
    threading.Thread(target=uvicorn_server.run, daemon=True).start()

# -------------------------
# Cleanup
# -------------------------
def cleanup():
    global ollama_process, started_ollama, uvicorn_server
    log("Shutting down...", "SERVER", "APP")

    if uvicorn_server and uvicorn_server.started:
        log("Stopping FastAPI...", "SERVER", "APP")
        uvicorn_server.should_exit = True

    if started_ollama and ollama_process:
        log("Stopping Ollama (owned by this process)...", "SERVER", "APP")
        try:
            os.killpg(os.getpgid(ollama_process.pid), signal.SIGTERM)
            ollama_process.wait(timeout=5)
            log("Ollama stopped.", "SERVER", "APP")
        except subprocess.TimeoutExpired:
            log("Ollama did not stop in time, killing...", "ERROR", "APP")
            ollama_process.kill()
    else:
        log("Ollama was not started by this script, leaving it running.", "INFO", "APP")

atexit.register(cleanup)

# -------------------------
# Signal handling
# -------------------------
def signal_handler(sig, frame):
    stop_event.set()
    cleanup()
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

# -------------------------
# Main
# -------------------------
if __name__ == "__main__":
    setup_logging()
    try:
        if not is_ollama_running():
            ollama_process = start_ollama()
            started_ollama = True
            threading.Thread(target=stream_ollama_output, daemon=True).start()

            if not wait_for_ollama():
                raise RuntimeError("Ollama failed to start")
        else:
            log("Ollama already running.", "SERVER", "APP")

        start_fastapi()

        while not stop_event.is_set():
            stop_event.wait(timeout=1)

    finally:
        cleanup()
