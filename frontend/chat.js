let history = [];
let currentController = null;
let inputField;
let sendButton;
let stopButton;
let modelSelector;

/* -------------------------
   UI State Helpers
------------------------- */
function isModelSelected() {
    const model = modelSelector.value;
    return model && model.trim() !== "";
}

function updateSendButtonState() {
    sendButton.disabled = !isModelSelected() || currentController !== null;
}

function setGeneratingState(isGenerating) {
    stopButton.disabled = !isGenerating;

    if (isGenerating) {
        sendButton.disabled = true;
    } else {
        updateSendButtonState();
    }
}

/* -------------------------
   Load Models
------------------------- */
async function loadModels() {
    try {
        const res = await fetch("http://localhost:8000/models");
        const data = await res.json();

        modelSelector.innerHTML = "";

        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "-- Select a model --";
        defaultOption.disabled = true;
        defaultOption.selected = true;
        modelSelector.appendChild(defaultOption);

        let savedModel = localStorage.getItem("selectedModel");

        if (data.status === "ok" && data.models.length > 0) {
            data.models.forEach(model => {
                const option = document.createElement("option");
                option.value = model;
                option.textContent = model;

                if (savedModel === model) {
                    option.selected = true;
                }

                modelSelector.appendChild(option);
            });
        } else {
            const option = document.createElement("option");
            option.textContent = "No models available";
            modelSelector.appendChild(option);
        }

    } catch (err) {
        console.error("Failed to load models:", err);
        modelSelector.innerHTML = "<option>Failed to load models</option>";
    }

    updateSendButtonState();
}

/* -------------------------
   Send Message
------------------------- */
async function sendMessage() {
    const text = inputField.value.trim();
    if (!text || currentController) return;

    const model = modelSelector.value;

    if (!model) {
        alert("Please select a model first.");
        return;
    }

    appendMessage("user", text);
    inputField.value = "";

    const botDiv = appendMessage("bot", "");

    currentController = new AbortController();
    setGeneratingState(true);

    let fullReply = "";

    try {
        const response = await fetch("http://localhost:8000/chat", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                message: text,
                history: history,
                model: model
            }),
            signal: currentController.signal
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            fullReply += chunk;

            botDiv.innerHTML = marked.parse(fullReply);

            botDiv.querySelectorAll("pre code").forEach(block => {
                hljs.highlightBlock(block);
                addCopyButton(block);
            });
        }

        if (fullReply.trim()) {
            history.push({ role: "user", content: text });
            history.push({ role: "assistant", content: fullReply });
        }

    } catch (err) {
        if (err.name === "AbortError") {
            botDiv.innerHTML += "<br><em>⛔ Generation stopped.</em>";
        } else {
            console.error("Fetch error:", err);
            botDiv.innerHTML += "<br><em>⚠️ Error occurred.</em>";
        }
    } finally {
        currentController = null;
        setGeneratingState(false);
    }
}

/* -------------------------
   Stop Generation
------------------------- */
function stopGeneration() {
    if (currentController) {
        currentController.abort();
    }
}

/* -------------------------
   Message Rendering
------------------------- */
function appendMessage(role, text) {
    const chatBox = document.getElementById("chat-box");
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", role);

    if (role === "bot") {
        const avatarDiv = document.createElement("div");
        avatarDiv.classList.add("avatar");

        const avatarImg = document.createElement("img");
        avatarImg.src = "assets/images/jinji.png";
        avatarImg.alt = "Bot Avatar";
        avatarImg.classList.add("avatar-img");

        avatarDiv.appendChild(avatarImg);
        msgDiv.appendChild(avatarDiv);

        if (text) msgDiv.innerHTML += marked.parse(text);
    } else {
        const pre = document.createElement("pre");
        pre.textContent = text;
        msgDiv.appendChild(pre);
    }

    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    return msgDiv;
}

/* -------------------------
   Code Copy
------------------------- */
function addCopyButton(codeBlock) {
    if (codeBlock.parentElement.querySelector(".copy-code-btn")) return;

    const button = document.createElement("button");
    button.textContent = "Copy Code";
    button.classList.add("copy-code-btn");

    button.addEventListener("click", () => {
        copyCodeToClipboard(codeBlock, button);
    });

    codeBlock.parentElement.style.position = "relative";
    codeBlock.parentElement.appendChild(button);
}

function copyCodeToClipboard(codeBlock, button) {
    const range = document.createRange();
    range.selectNodeContents(codeBlock);

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    if (document.execCommand("copy")) {
        button.textContent = "Copied!";
        setTimeout(() => (button.textContent = "Copy Code"), 1000);
    }

    selection.removeAllRanges();
}

/* -------------------------
   Init
------------------------- */
window.addEventListener("DOMContentLoaded", () => {
    inputField = document.getElementById("input");
    sendButton = document.getElementById("send-button");
    stopButton = document.getElementById("stop-button");
    modelSelector = document.getElementById("model-selector");

    const savedModel = localStorage.getItem("selectedModel");
    if (savedModel) {
        modelSelector.value = savedModel;
    }

    modelSelector.addEventListener("change", () => {
        updateSendButtonState();
        localStorage.setItem("selectedModel", modelSelector.value);
    });

    inputField.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });

    sendButton.addEventListener("click", sendMessage);
    stopButton.addEventListener("click", stopGeneration);

    setGeneratingState(false);

    loadModels();
});
