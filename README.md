# JINJI - A Friendly Feline Chatbot and Assistant

Hi! I am  **JINJI**: your helpful cat companion and friendly feline AI assistant!  
I’m designed as a locally hosted interface that connects to local LLMs, so you can use me without needing an internet connection.

---

## Features

- Fun browsing experience: A browser-based interactive session.
- Offline playtime! You can have all the cool toys and gizmos without needing any power supply; everything runs locally!
- Play with different LLM models that are installed on your machine. Choose a model you'd prefer to use for whatever task you need.

---

## Requirements

- Ollama https://ollama.com/ (because who needs to fetch when you can download models?)
- Python 3.x+ – Make sure it's up-to-date so we don't accidentally step on any toes.
- All my favorite toys and tools listed in requirements.txt.

---

## Installation

1. Clone this kitty's play area:

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

> I work great with phi4-mini:3.8b

---

## Usage

You can run me using the provided Python launcher:
```bash
python3 run.py
```

I'll take care of all the setup so you don't have to worry about me stepping on your toes (figuratively speaking):

- Start Ollama if it is not already running.
- Launch the FastAPI backend (uvicorn) serving the frontend.
- Cleanly terminate Ollama if it was started by the script on shutdown.

After the server is running, open your browser at:

http://localhost:8000

---

## Licensing

This project was built for self-learning purposes: it's not meant to be used commercially, just as I wouldn't want strangers chasing me around! Remember that this feline isn't an official mascot of any company; if someone is looking for a real cat from my family who loves Python and Ollama more than treats... well, I'm probably too busy coding right now.

---
