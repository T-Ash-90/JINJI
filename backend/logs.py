from datetime import datetime
import logging
import re

# -------------------------
# Log levels and styles
# -------------------------
LEVEL_STYLES = {
    "ERROR": ("❌", "\033[91m"),
    "SUCCESS": ("✅", "\033[92m"),
    "SERVER": ("🚀", "\033[96m"),
    "MODEL": ("📦", "\033[95m"),
    "SYSTEM": ("⚙️", "\033[93m"),
    "API": ("🔄", "\033[94m"),
    "INFO": ("ℹ️", "\033[97m"),
}

RESET_COLOR = "\033[0m"

# -------------------------
# Core log function
# -------------------------
def log(message: str, level: str = "INFO", source: str = "APP"):
    ts = datetime.now().strftime("%H:%M:%S")
    icon, color = LEVEL_STYLES.get(level, ("ℹ️", "\033[97m"))
    print(f"[{ts}] {color}{icon} [{level:<6}] [{source:<6}]{RESET_COLOR} {message}")

# -------------------------
# Normalize Ollama logs
# -------------------------
def normalize_ollama_line(line: str):
    msg_match = re.search(r'msg="([^"]+)"', line)
    message = msg_match.group(1) if msg_match else line.strip()

    l = message.lower()
    if "error" in l or "failed" in l:
        level = "ERROR"
    elif "runner" in l or "server" in l:
        level = "SERVER"
    elif "model" in l or "load" in l:
        level = "MODEL"
    elif "gpu" in l or "cpu" in l:
        level = "SYSTEM"
    elif "post" in l or "get" in l or "request" in l:
        level = "API"
    else:
        level = "INFO"

    return message, level

# -------------------------
# Normalize FastAPI / Uvicorn logs
# -------------------------
def normalize_fastapi_line(line: str):
    line = line.strip()
    if not line:
        return "", "INFO"
    if " - " in line and ("POST" in line or "GET" in line):
        return line, "API"
    if line.startswith("INFO:") or line.startswith("WARNING:") or line.startswith("ERROR:"):
        parts = line.split(" - ", 1)
        if len(parts) == 2:
            return parts[1].strip(), "API"
    return line, "INFO"

# -------------------------
# Generic log processor
# -------------------------
def process_log_line(line: str, source: str = "APP"):
    if not line or not line.strip():
        return

    line = line.strip()
    if "msg=" in line or "load_tensors" in line or "llama" in line:
        message, level = normalize_ollama_line(line)
        source = "OLLAMA"
    elif "HTTP/" in line or "[GIN]" in line or "INFO:" in line:
        message, level = normalize_fastapi_line(line)
        source = "APP"
    else:
        message, level = line, "INFO"

    log(message, level, source)

# -------------------------
# Intercept Uvicorn / FastAPI logs
# -------------------------
class InterceptHandler(logging.Handler):
    def emit(self, record):
        try:
            message = self.format(record)
        except Exception:
            message = record.getMessage()
        process_log_line(message, source="APP")

def setup_logging():
    handler = InterceptHandler()
    logging.basicConfig(handlers=[handler], level=logging.INFO, force=True)

    for name in ["uvicorn", "uvicorn.error", "uvicorn.access"]:
        logger = logging.getLogger(name)
        logger.handlers = [handler]
        logger.propagate = False
