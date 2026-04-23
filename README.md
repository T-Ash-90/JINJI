# JINJI - An Frontend App for Ollama.

JINJI is an intuitive chat interface designed to seamlessly interact with both cloud-based and locally installed LLMs powered by [Ollama](https://ollama.com/).

---

## Features

- Chat interface with a clean and interactive UI
- Fully local execution with no external API calls
- Support for both locally installed and cloud-based LLMs with [Ollama](https://ollama.com/)
- Easy model switching depending on the task
- Optional context injection from a user-specified API endpoint
- Token context control
- Electron desktop app

---

## UI Preview

<p align="center">
  <img src="frontend/assets/images/ui.png" alt="JINJI UI" width="1000"/>
</p>

---

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Python (FastAPI, Uvicorn)
- **LLM Runtime:** Ollama
- **Architecture:** Local-first, offline AI system
- **Desktop Application:** Electron

---

## Requirements

- [Ollama](https://ollama.com/) & downloaded LLMs or cloud models *([phi4-mini:3.8b](https://ollama.com/library/phi4-mini) recommended)*
- Python 3
- Node.js and npm (for Electron app)
- Dependencies listed in requirements.txt

---

## Installation

1. Clone the repository:

```bash
git clone
cd <repo-directory>
```
2. Create a virtual Python environment named .venv in the root directory: (required)

```bash
python3 -m venv .venv
```

3. Install Python dependencies:

```bash
pip install -r requirements.txt
```

4. Ensure Ollama is installed and models are downloaded:

```bash
ollama pull <model-name>
```

> *JINJI works great with phi4-mini:3.8b*

5. Set up the Electron App in the root directory:

```bash
npm install
```

---

## Usage

1. To run the application as a standalone Electron desktop app:

```bash
npm start
```

The launcher will:

- Start Ollama if it is not already running
- Launch the FastAPI backend (uvicorn)
- Open the Electron desktop window pointing to the local server (http://localhost:8000).
- Automatically handle backend startup, waiting for readiness, and shutdown when the window is closed.

2. Add context and system prompt

- Simply update frontend/js/config.js with your preferred system prompt and context API endpoint.
- Once set up, the "Context" toggle above the chat window allows enabling or disabling fetching context from your API endpoint.

---

## Licensing

**JINJI** © [Thomas Edward Ash](https://github.com/T-Ash-90). This software is released under the [MIT License](./LICENSE).

### Included Third-Party Content

- **marked** (v15.0.12) — © 2011–2025 Christopher Jeffrey, MIT Licensed. [GitHub repo](https://github.com/markedjs/marked). Used for parsing Markdown.
- **DOMPurify** (v3.3.3) — © Cure53 and other contributors, released under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0) and [Mozilla Public License 2.0](https://www.mozilla.org/en-US/MPL/2.0/). Used for safe sanitization of HTML/Markdown.   
- **Highlight.js** (v11.9.0) — © Igor Sysoev and other contributors, BSD-3-Clause Licensed. [GitHub repo](https://github.com/highlightjs/highlight.js). Used for syntax highlighting in code blocks.  
- **Atom One Dark Theme** (for Highlight.js) — © Alexander Gugel, BSD-3-Clause Licensed. [GitHub repo](https://github.com/highlightjs/highlight.js/tree/main/src/styles). Used as the code block styling theme.

> ⚠️ Note: This project is intended for learning and personal use. It is not associated with any company or product.

---
