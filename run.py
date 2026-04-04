import subprocess
import signal
import sys
import threading
import atexit
import os
import requests
import time
from backend.logs import process_log_line, setup_logging, log
import uvicorn

OLLAMA_URL = "http://localhost:11434"
ollama_process = None
OLLAMA_PIPE = None
started_ollama = False
uvicorn_server = None
stop_event = threading.Event()
_cleanup_done = False

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

    if os.name == "nt":  # Windows
        creation_flags = subprocess.CREATE_NEW_PROCESS_GROUP
        process = subprocess.Popen(
            ["ollama", "serve"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            creationflags=creation_flags,
        )
    else:  # Unix / macOS
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
    global ollama_process, started_ollama, uvicorn_server, _cleanup_done

    if _cleanup_done:
        return
    _cleanup_done = True

    log("Shutting down...", "SERVER", "APP")

    # Stop FastAPI
    if uvicorn_server and uvicorn_server.started:
        log("Stopping FastAPI...", "SERVER", "APP")
        uvicorn_server.should_exit = True

    # Stop Ollama if we started it
    if started_ollama and ollama_process:
        log("Stopping Ollama (owned by this process)...", "SERVER", "APP")
        try:
            if os.name == "nt":  # Windows
                ollama_process.send_signal(signal.CTRL_BREAK_EVENT)
            else:
                # Unix / macOS: kill process group
                os.killpg(os.getpgid(ollama_process.pid), signal.SIGTERM)

            ollama_process.wait(timeout=10)
            log("Ollama stopped.", "SERVER", "APP")
        except subprocess.TimeoutExpired:
            log("Ollama did not stop in time, killing...", "ERROR", "APP")
            ollama_process.kill()
    else:
        log("Ollama was not started by this script, leaving it running.", "INFO", "APP")

# -------------------------
# Signal handling
# -------------------------
def signal_handler(sig, frame):
    log(f"Received signal {sig}, shutting down...", "SERVER", "APP")
    stop_event.set()

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

atexit.register(cleanup)

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
