let history = [];
let currentController = null;
let inputField;
let sendButton;
let stopButton;
let modelSelector;
let DEFAULT_SYSTEM_PROMPT = "";
let isSticky = true;

marked.setOptions({
    breaks: true,
    gfm: true
});

/* -------------------------
   Markdown Plugin System
------------------------- */
const markdownPlugins = [];

function registerMarkdownPlugin(pluginFn) {
    markdownPlugins.push(pluginFn);
}

function applyMarkdownPlugins(container) {
    markdownPlugins.forEach(plugin => {
        try {
            plugin(container);
        } catch (e) {
            console.warn("Plugin error:", e);
        }
    });
}

/* -------------------------
   Markdown Renderer
------------------------- */
function renderMarkdown(text) {
    const rawHtml = marked.parse(text);
    const cleanHtml = DOMPurify.sanitize(rawHtml);

    const container = document.createElement("div");
    container.innerHTML = cleanHtml;

    applyMarkdownPlugins(container);

    return container.innerHTML;
}

/* -------------------------
   Markdown Plug-In
------------------------- */
registerMarkdownPlugin(container => {
    container.querySelectorAll("pre code").forEach(block => {
        if (block.parentElement.classList.contains("code-wrapper")) return;

        const pre = block.parentElement;

        const wrapper = document.createElement("div");
        wrapper.className = "code-wrapper";

        const header = document.createElement("div");
        header.className = "code-header";

        let langMatch = block.className.match(/language-(\w+)/);
        let lang = langMatch ? langMatch[1] : "text";

        const langLabel = document.createElement("span");
        langLabel.textContent = lang;

        const copyBtn = document.createElement("button");
        copyBtn.textContent = "Copy";
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(block.innerText);
            copyBtn.textContent = "Copied!";
            setTimeout(() => copyBtn.textContent = "Copy", 1000);
        };

        header.appendChild(langLabel);
        header.appendChild(copyBtn);

        pre.parentNode.replaceChild(wrapper, pre);
        wrapper.appendChild(header);
        wrapper.appendChild(pre);

        block.classList.add("hljs");
        hljs.highlightElement(block);
    });
});

registerMarkdownPlugin(container => {
    container.querySelectorAll("a").forEach(a => {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
    });
});

/* -------------------------
   Load default prompt
------------------------- */
async function loadDefaultPrompt() {
    try {
        const res = await fetch("/assets/prompt.txt");
        if (!res.ok) throw new Error();

        DEFAULT_SYSTEM_PROMPT = (await res.text()).trim();
        console.log("✅ Loaded system prompt");

    } catch {
        console.warn("⚠️ Using fallback prompt");
        DEFAULT_SYSTEM_PROMPT =
            "You are Jinji, a helpful female feline assistant that happens to also be a cat.";
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

    } catch {
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
        `<em class="thinking">JINJI is thinking...</em>`
    );

    let dots = 0;
    const thinkingInterval = setInterval(() => {
        dots = (dots + 1) % 4;
        botDiv.innerHTML =
            `<em class='thinking'>JINJI is thinking${'.'.repeat(dots)}</em>`;
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

            if (wasSticky) scrollToBottom(true);
        }

        if (fullReply.trim()) {
            botDiv.innerHTML = renderMarkdown(fullReply);

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
