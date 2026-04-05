/* -------------------------
   Chat Logic
------------------------- */

import {
    appendContextAndTokenInfo,
    estimateTokens,
    enableSendButton
} from './utils.js';

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
import { logChatDebug } from "./logs.js";

/* -------------------------
   Messages
------------------------- */
export function appendMessage(role, text) {
    const box = document.getElementById("chat-box");

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

        return content;
    } else {
        div.textContent = text;
        box.appendChild(div);

        return div;
    }
}

/* -------------------------
   Send Message
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

    let Context = "";
    let contextFiles = [];
    const contextToggle = document.getElementById("context-toggle");

    if (contextToggle.checked) {
        try {
            Context = await getContext();
            contextFiles = Context.split('\n')
                .filter(line => line.startsWith('Path:'))
                .map(line => line.replace('Path: ', '').trim());
        } catch (err) {
            console.error("Failed to fetch context:", err);
        }

        let tokenInfo = {
            systemTokens: estimateTokens(DEFAULT_SYSTEM_PROMPT),
            contextTokens: estimateTokens(Context),
            userTokens: estimateTokens(text),
            totalTokens: 0,
        };
        tokenInfo.totalTokens = tokenInfo.systemTokens + tokenInfo.contextTokens + tokenInfo.userTokens;

        logChatDebug({
            context: Context,
            userInput: text,
        });
        appendContextAndTokenInfo(contextFiles, tokenInfo);
    }

    const botDiv = appendMessage("bot", `<em class="thinking">JINJI is thinking...</em>`);

    const effectiveHistory = [...history];
    if (Context) {
        effectiveHistory.unshift({
            role: "system",
            content: `Here is the code context:\n\n${Context}`,
        });
    }

    let fullReply = "";
    const controller = new AbortController();
    setController(controller);
    setGeneratingState(true);

    try {
        const res = await fetch("http://localhost:8000/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text, history: effectiveHistory, model }),
            signal: controller.signal,
        });

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let firstChunk = true;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            fullReply += chunk;

            if (firstChunk) {
                firstChunk = false;
            }

            botDiv.innerHTML = renderMarkdown(fullReply);
        }

        if (fullReply.trim()) {
            botDiv.innerHTML = renderMarkdown(fullReply);
            history.push({ role: "user", content: text });
            history.push({ role: "assistant", content: fullReply });
        }
    } catch (err) {
        if (err.name === "AbortError") {
            botDiv.innerHTML += "<p><em>⛔ Generation stopped.</em></p>";
        } else {
            botDiv.innerHTML += "<p><em>⚠️ Error occurred.</em></p>";
        }
    } finally {
        setGeneratingState(false);
        setController(null);
        inputField.focus();
        enableSendButton();
    }
}

/* -------------------------
   Stop Button
------------------------- */
export function stopGeneration() {
    if (currentController) currentController.abort();
    enableSendButton();
}
