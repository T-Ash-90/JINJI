/* -------------------------
   Chat Logic with Context
------------------------- */

import {
    history,
    currentController,
    DEFAULT_SYSTEM_PROMPT,
    inputField,
    modelSelector,
    setController
} from "./state.js";

import { renderMarkdown } from "./markdown.js";
import { setGeneratingState } from "./ui.js";
import { getContext } from "./context.js";

/* -------------------------
   Scroll Helpers
------------------------- */

function shouldAutoScroll(box, threshold = 5) {
    return box.scrollTop + box.clientHeight >= box.scrollHeight - threshold;
}

export function scrollToBottom() {
    const box = document.getElementById("chat-box");
    box.scrollTop = box.scrollHeight;
}

/* -------------------------
   Messages
------------------------- */

export function appendMessage(role, text) {
    const box = document.getElementById("chat-box");
    const wasAtBottom = shouldAutoScroll(box);

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

        if (wasAtBottom) scrollToBottom();
        return content;
    } else {
        div.textContent = text;
        box.appendChild(div);

        if (wasAtBottom) scrollToBottom();
        return div;
    }
}

/* -------------------------
   Send / Stop
------------------------- */

export async function sendMessage() {
    if (!history.length || history[0].role !== "system") {
        history.unshift({ role: "system", content: DEFAULT_SYSTEM_PROMPT });
    }

    const text = inputField.value.trim();
    if (!text || currentController) return;

    const model = modelSelector.value;
    if (!model) return;

    appendMessage("user", text);
    inputField.value = "";

    const botDiv = appendMessage("bot", `<em class="thinking">JINJI is thinking...</em>`);

    // -------------------------
    // Fetch context
    // -------------------------
    let Context = "";
    try {
        Context = await getContext();
    } catch (err) {
        console.error("Failed to fetch context:", err);
    }

    const effectiveHistory = [...history];
    if (Context) {
        effectiveHistory.unshift({
            role: "system",
            content: `You are a helpful coding assistant named JINJI. Here is the code context:\n\n${Context}`
        });
    }

    // -------------------------
    // Animated thinking indicator
    // -------------------------
    let dots = 0;
    const thinkingInterval = setInterval(() => {
        const box = document.getElementById("chat-box");
        dots = (dots + 1) % 4;
        botDiv.innerHTML = `<em class='thinking'>JINJI is thinking${'.'.repeat(dots)}</em>`;
        if (shouldAutoScroll(box)) scrollToBottom();
    }, 500);

    const controller = new AbortController();
    setController(controller);
    setGeneratingState(true);

    let fullReply = "";

    try {
        const res = await fetch("http://localhost:8000/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text, history: effectiveHistory, model }),
            signal: controller.signal
        });

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        let firstChunk = true;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const box = document.getElementById("chat-box");
            const wasAtBottom = shouldAutoScroll(box);

            const chunk = decoder.decode(value);
            fullReply += chunk;

            if (firstChunk) {
                clearInterval(thinkingInterval);
                firstChunk = false;
            }

            botDiv.innerHTML = renderMarkdown(fullReply);
            if (wasAtBottom) scrollToBottom();
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
        setController(null);
        setGeneratingState(false);
        inputField.focus();
    }
}

export function stopGeneration() {
    if (currentController) currentController.abort();
}
