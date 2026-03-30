import subprocess
import time
import requests
import uvicorn
import signal
import sys
import threading
from backend.logs import process_log_line, setup_logging, log

OLLAMA_URL = "http://localhost:11434"

ollama_process = None
OLLAMA_PIPE = None
started_ollama = False

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
        if not raw_line:
            continue
        process_log_line(raw_line, source="OLLAMA")

# -------------------------
# Shutdown handling
# -------------------------
def cleanup():
    global ollama_process, started_ollama
    log("Shutting down...", "SERVER", "APP")
    if started_ollama and ollama_process:
        log("Stopping Ollama (owned by this process)...", "SERVER", "APP")
        ollama_process.terminate()
        try:
            ollama_process.wait(timeout=5)
            log("Ollama stopped.", "SERVER", "APP")
        except subprocess.TimeoutExpired:
            log("Ollama did not stop in time, killing...", "ERROR", "APP")
            ollama_process.kill()
    else:
        log("Ollama was not started by this script, leaving it running.", "INFO", "APP")

def signal_handler(sig, frame):
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

            threading.Thread(
                target=stream_ollama_output,
                daemon=True
            ).start()

            if not wait_for_ollama():
                raise RuntimeError("Ollama failed to start")
        else:
            log("Ollama already running.", "SERVER", "APP")

        log("Dynamic models will be selected by the frontend. Skipping model pull/warmup.", "MODEL", "APP")
        log("Starting FastAPI server...", "SERVER", "APP")

        uvicorn.run(
            "backend.server:app",
            host="127.0.0.1",
            port=8000,
            reload=False,
        )

    finally:
        cleanup()
