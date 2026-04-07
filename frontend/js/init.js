/* -------------------------
   Initialization Script
------------------------- */

import { setElements, history, setDefaultPrompt, modelSelector } from "./state.js";
import { CONFIG } from "./config.js";
import { sendMessage } from "./chat.js";
import { copyToClipboard, updateSendButtonState, stopGeneration, trackScroll } from "./utils.js";
import { loadModels, loadModelDetails } from "./models.js";

/* -------------------------
   Boot
------------------------- */

document.addEventListener("DOMContentLoaded", () => {
    const modelSelector = document.getElementById("model-selector");

    const modelDetailsSection = document.getElementById("model-details");
    if (modelDetailsSection) {
        modelDetailsSection.style.display = "none";
    }

    if (modelSelector) {
        modelSelector.addEventListener("change", () => {
            const selectedModel = modelSelector.value;
            if (selectedModel) {
                loadModelDetails(selectedModel);
            } else {
                if (modelDetailsSection) {
                    modelDetailsSection.style.display = "none";
                }
            }
        });
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const modelSelector = document.getElementById("model-selector");

    if (modelSelector) {
        modelSelector.addEventListener("change", () => {
            const selectedModel = modelSelector.value;
            if (selectedModel) {
                loadModelDetails(selectedModel);
            }
        });
    }

    const elements = {
        inputField: document.getElementById("input"),
        sendButton: document.getElementById("send-button"),
        stopButton: document.getElementById("stop-button"),
        modelSelector: document.getElementById("model-selector")
    };

    trackScroll()
    setElements(elements);
    setDefaultPrompt(
        (CONFIG.systemPrompt && CONFIG.systemPrompt.trim()) ||
        "You are a helpful assistant."
    );
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
});

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
