/* -------------------------
   Init
------------------------- */

import {
    setElements,
    history,
    setDefaultPrompt,
    modelSelector
} from "./state.js";

import { updateSendButtonState } from "./ui.js";
import { sendMessage, stopGeneration } from "./chat.js";
import { copyToClipboard } from "./utils.js";

/* -------------------------
   Loaders
------------------------- */

async function loadDefaultPrompt() {
    try {
        const res = await fetch("/assets/prompt.txt");
        if (!res.ok) throw new Error();

        const text = (await res.text()).trim();
        setDefaultPrompt(text);
    } catch {
        setDefaultPrompt(
            "You are Jinji, a helpful assistant that happens to also be a cat."
        );
    }
}

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
   Boot
------------------------- */

window.onload = async () => {
    const elements = {
        inputField: document.getElementById("input"),
        sendButton: document.getElementById("send-button"),
        stopButton: document.getElementById("stop-button"),
        modelSelector: document.getElementById("model-selector")
    };

    setElements(elements);

    await loadDefaultPrompt();
    loadModels();

    elements.sendButton.onclick = sendMessage;
    elements.stopButton.onclick = stopGeneration;

    elements.inputField.addEventListener("input", updateSendButtonState);

    elements.inputField.addEventListener("keydown", e => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    elements.modelSelector.addEventListener("change", () => {
        updateSendButtonState();

        const previousMessages = history.filter(m => m.role !== "system");

        history.length = 0;
        history.push(...previousMessages);
    });

    updateSendButtonState();
};

/* -------------------------
   Copy Handler
------------------------- */

document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".copy-btn");
    if (!btn) return;

    const wrapper = btn.closest(".code-wrapper");
    if (!wrapper) return;

    const codeBlock = wrapper.querySelector("code");
    if (!codeBlock) return;

    const code = codeBlock.textContent;

    const success = await copyToClipboard(code);

    btn.textContent = success ? "Copied!" : "Failed!";

    setTimeout(() => {
        btn.textContent = "Copy";
    }, 1200);
});
