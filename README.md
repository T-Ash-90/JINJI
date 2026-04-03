# JINJI - A Friendly Feline Chatbot and Assistant

JINJI is a locally hosted chatbot interface designed to work with local LLMs. It provides a simple, interactive browser-based experience without requiring an internet connection.

---

## Features

- Browser-based chat interface with a clean and interactive UI
- Fully local execution with no external API calls
- Support for multiple locally installed LLMs with Ollama: https://ollama.com/
- Easy model switching depending on the task

---

## UI Preview

<p align="center">
  <img src="frontend/assets/images/ui.png" alt="JINJI UI" width="800"/>
</p>

---

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Python (FastAPI, Uvicorn)
- **LLM Runtime:** Ollama
- **Architecture:** Local-first, offline AI system

---

## Architecture Overview

The application runs entirely on the local machine:

- The frontend provides a browser-based chat interface
- The FastAPI backend handles requests and model communication
- Ollama serves locally installed LLMs
- No external APIs or internet connection required

This design ensures:
- Full privacy
- Low latency
- Offline usability

---

## Requirements

- Ollama https://ollama.com/
- Python 3
- Dependencies listed in requirements.txt

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

> JINJI works great with phi4-mini:3.8b

---

## Usage

Run the application using the provided launcher:
```bash
python3 run.py
```

The launcher will:

- Start Ollama if it is not already running
- Launch the FastAPI backend (uvicorn)
- Serve the frontend interface
- Shut down Ollama if it was started by the script

After the server is running, open your browser at:

http://localhost:8000

---

## Licensing

**JINJI** is released under the [MIT License](./LICENSE). You are free to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of this project under the terms of that license.

### Third-Party Attributions

- **DOMPurify** (v3.3.3) — © Cure53 and other contributors, released under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0) and [Mozilla Public License 2.0](https://www.mozilla.org/en-US/MPL/2.0/). Used for safe sanitization of HTML/Markdown.  
- **marked** (v15.0.12) — © 2011–2025 Christopher Jeffrey, MIT Licensed. [GitHub repo](https://github.com/markedjs/marked). Used for parsing Markdown.  
- **Highlight.js** (v11.9.0) — © Igor Sysoev and other contributors, BSD-3-Clause Licensed. [GitHub repo](https://github.com/highlightjs/highlight.js). Used for syntax highlighting in code blocks.  
- **Atom One Dark Theme** (for Highlight.js) — © Alexander Gugel, BSD-3-Clause Licensed. [GitHub repo](https://github.com/highlightjs/highlight.js/tree/main/src/styles). Used as the code block styling theme.

> ⚠️ Note: This project is intended for learning and personal use. It is not associated with any official company or product.

---
