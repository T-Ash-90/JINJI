/* -------------------------
   Initialization Script
------------------------- */

import { setElements, history, setDefaultPrompt } from "./state.js";
import { CONFIG } from "./config.js";
import { sendMessage } from "./chat.js";
import { copyToClipboard, updateSendButtonState, stopGeneration, trackScroll } from "./utils.js";
import { loadModels, loadModelDetails } from "./models.js";

// Main Script
document.addEventListener("DOMContentLoaded", () => {
    const elements = {
        inputField: document.getElementById("input"),
        sendButton: document.getElementById("send-button"),
        stopButton: document.getElementById("stop-button"),
        modelSelector: document.getElementById("model-selector")
    };

    const modelDetailsSection = document.getElementById("model-details");

    if (modelDetailsSection) {
        modelDetailsSection.style.display = "none";
    }

    if (elements.modelSelector) {
        elements.modelSelector.addEventListener("change", () => {
            const selectedModel = elements.modelSelector.value;

            if (modelDetailsSection) {
                modelDetailsSection.style.display = selectedModel ? "block" : "none";
            }

            if (selectedModel) {
                loadModelDetails(selectedModel);
            }

            updateSendButtonState();

            const previousMessages = history.filter(m => m.role !== "system");
            history.length = 0;
            history.push(...previousMessages);
        });
    }

    trackScroll();
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

    updateSendButtonState();
});

// Copy button handler
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
