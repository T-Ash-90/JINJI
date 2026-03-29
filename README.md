# JINJI

**JINJI** is a local web-based frontend for interacting with large language models (LLMs) hosted via Ollama. This project is intended for learning purposes and provides a simple chat interface to converse with locally hosted models.

---

## Features

- Browser-based chat interface with dynamic message streaming.
- Syntax highlighting for code snippets using Highlight.js.
- Markdown rendering via Marked.js.
- Fully local: frontend assets and LLM models can be hosted entirely offline.
- Supports multiple Ollama models, selected dynamically from the frontend.

---

## Requirements

- Ollama installed and models downloaded locally.
- Python 3.11+  
- All Python dependencies listed in requirements.txt.

---

## Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd <repo-directory>
```

2. Install Python dependencies:

```bash
pip install -r requirements.txt
```

3. Ensure Ollama is installed and models are downloaded:

```bash
ollama pull <model-name>
```

> Example models: phi4-mini:3.8b, qwen3.5:9b, ministral-3:3b

---

## Usage

You can run the project using the provided Python launcher:
```bash
python3 run.py
```

The launcher will:

- Start Ollama if it is not already running.
- Launch the FastAPI backend (uvicorn) serving the frontend.
- Cleanly terminate Ollama if it was started by the script on shutdown.

After the server is running, open your browser at:

http://localhost:8000

---

### Frontend Notes

- Chat messages are displayed in the chat box.
- Markdown is rendered with marked.js.
- Code blocks are highlighted with highlight.js (GitHub theme).
- Code blocks have a "Copy Code" button for convenience.

---

## Licensing

- marked.js: MIT License
- highlight.js: BSD-3-Clause License
- Use of Ollama models is subject to Ollama's licensing terms.

This project was built as a self-learning excercise and is not intended for commercial use.

---

## Acknowledgments

- Ollama
- Marked.js
- Highlight.js
