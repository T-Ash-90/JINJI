import subprocess
import time
import requests
import uvicorn
import signal
import sys

OLLAMA_URL = "http://localhost:11434"
MODEL = "phi4-mini:latest"

ollama_process = None
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
    print("Starting Ollama...")
    return subprocess.Popen(
        ["ollama", "serve"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def wait_for_ollama(timeout=20):
    print("Waiting for Ollama to be ready...")
    for _ in range(timeout):
        if is_ollama_running():
            print("Ollama is up.")
            return True
        time.sleep(1)
    return False


def is_model_available():
    try:
        r = requests.get(f"{OLLAMA_URL}/api/tags", timeout=5)
        models = r.json().get("models", [])
        return any(m["name"] == MODEL for m in models)
    except Exception:
        return False


def pull_model():
    print(f"Pulling model {MODEL}...")
    subprocess.run(["ollama", "pull", MODEL], check=True)


def warmup_model():
    print(f"Warming up model {MODEL}...")
    try:
        requests.post(
            f"{OLLAMA_URL}/api/chat",
            json={
                "model": MODEL,
                "messages": [{"role": "user", "content": "Hello"}],
                "stream": False,
            },
            timeout=60,
        )
        print("Model is warm.")
    except Exception as e:
        print(f"Warmup failed (continuing anyway): {e}")


# -------------------------
# Shutdown handling
# -------------------------
def cleanup():
    global ollama_process, started_ollama

    print("\nShutting down...")

    if started_ollama and ollama_process:
        print("Stopping Ollama (owned by this process)...")
        ollama_process.terminate()

        try:
            ollama_process.wait(timeout=5)
            print("Ollama stopped.")
        except subprocess.TimeoutExpired:
            print("Ollama did not stop in time, killing...")
            ollama_process.kill()

    else:
        print("Ollama was not started by this script, leaving it running.")


def signal_handler(sig, frame):
    cleanup()
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)


# -------------------------
# Main
# -------------------------
if __name__ == "__main__":
    try:
        # Step 1: Start Ollama
        if not is_ollama_running():
            ollama_process = start_ollama()
            started_ollama = True

            if not wait_for_ollama():
                raise RuntimeError("Ollama failed to start")
        else:
            print("Ollama already running.")

        # Step 2: Ensure model exists
        if not is_model_available():
            pull_model()
        else:
            print(f"Model {MODEL} already available.")

        # Step 3: Warmup
        warmup_model()

        # Step 4: Start FastAPI
        print("Starting FastAPI server...")
        uvicorn.run(
            "backend.server:app",
            host="0.0.0.0",
            port=8000,
            reload=False,
        )

    finally:
        cleanup()
