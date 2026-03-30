let history = [];
let currentController = null;
let inputField;
let sendButton;
let stopButton;
let modelSelector;
let DEFAULT_SYSTEM_PROMPT = "";
let isSticky = true;

/* -------------------------
   Load default prompt
------------------------- */
async function loadDefaultPrompt() {
    try {
        const res = await fetch("/assets/prompt.txt");
        DEFAULT_SYSTEM_PROMPT = await res.text();
    } catch (err) {
        console.error("Failed to load default prompt:", err);
        DEFAULT_SYSTEM_PROMPT = "You are Jinji, a helpful assistant that happens to also be a cat.";
    }
}

/* -------------------------
   UI Helpers
------------------------- */
function isModelSelected() {
    return modelSelector.value && modelSelector.value.trim() !== "";
}

function hasInputText() {
    return inputField.value.trim().length > 0;
}

function updateSendButtonState() {
    const hasModel = isModelSelected();
    const hasText = hasInputText();
    const isBusy = currentController !== null;
    sendButton.disabled = !(hasModel && hasText) || isBusy;
}

function setGeneratingState(isGenerating) {
    stopButton.disabled = !isGenerating;
    inputField.disabled = isGenerating;
    updateSendButtonState();
}

/* -------------------------
   Load Models
------------------------- */
async function loadModels() {
    try {
        const res = await fetch("http://localhost:8000/models");
        const data = await res.json();

        modelSelector.innerHTML = "";

        const def = document.createElement("option");
        def.textContent = "-- Select a model --";
        def.value = "";
        def.disabled = true;
        def.selected = true;
        modelSelector.appendChild(def);

        if (data.status === "ok") {
            data.models.forEach(model => {
                const opt = document.createElement("option");
                opt.value = model;
                opt.textContent = model;
                modelSelector.appendChild(opt);
            });
        }

    } catch (e) {
        modelSelector.innerHTML = "<option>Error loading models</option>";
    }

    updateSendButtonState();
}

/* -------------------------
   Scroll Logic
------------------------- */
function scrollToBottom(force = false) {
    const box = document.getElementById("chat-box");

    if (isSticky || force) {
        box.scrollTop = box.scrollHeight;
    }
}

function setupScrollTracking() {
    const box = document.getElementById("chat-box");

    box.addEventListener("scroll", () => {
        const threshold = 5;

        const atBottom =
            box.scrollTop + box.clientHeight >= box.scrollHeight - threshold;

        isSticky = atBottom;
    });
}

/* -------------------------
   Send Message
------------------------- */
async function sendMessage() {
    if (!history.length || history[0].role !== "system") {
        history.unshift({ role: "system", content: DEFAULT_SYSTEM_PROMPT });
    }

    const text = inputField.value.trim();
    if (!text || currentController) return;

    const model = modelSelector.value;
    if (!model) return;

    appendMessage("user", text);
    inputField.value = "";

    const botDiv = appendMessage(
        "bot",
        `<em class="thinking">JINJI is thinking<span class="dots">...</span></em>`
    );

    let dots = 0;
    const thinkingInterval = setInterval(() => {
        dots = (dots + 1) % 4;
        botDiv.innerHTML = `<em class='thinking'>JINJI is thinking${'.'.repeat(dots)}</em>`;
        if (isSticky) scrollToBottom(true);
    }, 500);

    currentController = new AbortController();
    setGeneratingState(true);

    let fullReply = "";

    try {
        const res = await fetch("http://localhost:8000/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text, history, model }),
            signal: currentController.signal
        });

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        let firstChunk = true;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const wasSticky = isSticky;

            const chunk = decoder.decode(value);
            fullReply += chunk;

            if (firstChunk) {
                clearInterval(thinkingInterval);
                firstChunk = false;
            }

            botDiv.innerHTML = renderMarkdown(fullReply);
            botDiv.querySelectorAll("pre code").forEach(addCopyButton);

            if (wasSticky) scrollToBottom(true);
        }

        if (fullReply.trim()) {
            history.push({ role: "user", content: text });
            history.push({ role: "assistant", content: fullReply });
        }

    } catch (err) {
        clearInterval(thinkingInterval);

        if (err.name === "AbortError") {
            botDiv.innerHTML += "<p><em>⛔ Generation stopped.</em></p>";
        } else {
            botDiv.innerHTML += "<p><em>⚠️ Error occurred.</em></p>";
        }
    } finally {
        clearInterval(thinkingInterval);
        currentController = null;
        setGeneratingState(false);
        inputField.focus();
    }
}

/* -------------------------
   Stop Generation
------------------------- */
function stopGeneration() {
    if (currentController) currentController.abort();
}

/* -------------------------
   Message Rendering
------------------------- */
function appendMessage(role, text) {
    const box = document.getElementById("chat-box");
    const wasSticky = isSticky;

    const div = document.createElement("div");
    div.classList.add("message", role);

    if (role === "bot") {
        const avatar = document.createElement("div");
        avatar.classList.add("avatar");

        const img = document.createElement("img");
        img.src = "assets/images/jinji.png";
        img.classList.add("avatar-img");

        avatar.appendChild(img);

        const content = document.createElement("div");
        content.classList.add("bot-content");
        content.innerHTML = text;

        div.appendChild(avatar);
        div.appendChild(content);
        box.appendChild(div);

        if (wasSticky) scrollToBottom(true);
        return content;
    } else {
        div.textContent = text;
        box.appendChild(div);

        if (wasSticky) scrollToBottom(true);
        return div;
    }
}

/* -------------------------
   Copy Code
------------------------- */
function addCopyButton(codeBlock) {
    if (codeBlock.parentElement.querySelector(".copy-code-btn")) return;

    const btn = document.createElement("button");
    btn.textContent = "Copy";
    btn.classList.add("copy-code-btn");

    btn.onclick = () => {
        navigator.clipboard.writeText(codeBlock.innerText);
        btn.textContent = "Copied!";
        setTimeout(() => btn.textContent = "Copy", 1000);
    };

    codeBlock.parentElement.style.position = "relative";
    codeBlock.parentElement.appendChild(btn);
}

/* -------------------------
   Markdown Parser
------------------------- */
function renderMarkdown(text) {
    const escapeHtml = (str) =>
        str.replace(/&/g, "&amp;")
           .replace(/</g, "&lt;")
           .replace(/>/g, "&gt;");

    const lines = text.split("\n");
    let html = "";
    let inCodeBlock = false;
    let inList = false;

    for (let line of lines) {
        if (line.startsWith("```")) {
            if (!inCodeBlock) {
                inCodeBlock = true;
                html += "<pre><code>";
            } else {
                inCodeBlock = false;
                html += "</code></pre>";
            }
            continue;
        }

        if (inCodeBlock) {
            html += escapeHtml(line) + "\n";
            continue;
        }

        if (line.startsWith("### ")) { html += `<h3>${escapeInline(line.slice(4))}</h3>`; continue; }
        if (line.startsWith("## ")) { html += `<h2>${escapeInline(line.slice(3))}</h2>`; continue; }
        if (line.startsWith("# ")) { html += `<h1>${escapeInline(line.slice(2))}</h1>`; continue; }

        if (line.startsWith("- ")) {
            if (!inList) { inList = true; html += "<ul>"; }
            html += `<li>${escapeInline(line.slice(2))}</li>`;
            continue;
        } else if (inList) {
            html += "</ul>";
            inList = false;
        }

        if (line.trim() !== "") {
            html += `<p>${escapeInline(line)}</p>`;
        }
    }

    if (inList) html += "</ul";

    return html;

    function escapeInline(str) {
        let s = escapeHtml(str);
        s = s.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        s = s.replace(/\*(.*?)\*/g, "<em>$1</em>");
        s = s.replace(/`(.*?)`/g, "<code>$1</code>");
        return s;
    }
}

/* -------------------------
   Init
------------------------- */
window.onload = async () => {
    inputField = document.getElementById("input");
    sendButton = document.getElementById("send-button");
    stopButton = document.getElementById("stop-button");
    modelSelector = document.getElementById("model-selector");

    setupScrollTracking();

    await loadDefaultPrompt();
    loadModels();

    sendButton.onclick = sendMessage;
    stopButton.onclick = stopGeneration;

    inputField.addEventListener("input", updateSendButtonState);
    inputField.addEventListener("keydown", e => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    modelSelector.addEventListener("change", () => {
        updateSendButtonState();

        const previousMessages = history.filter(m => m.role !== "system");

        history = [
            { role: "system", content: DEFAULT_SYSTEM_PROMPT },
            ...previousMessages
        ];
    });

    updateSendButtonState();
};
