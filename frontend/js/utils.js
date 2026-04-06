/* -------------------------
   Utilities
------------------------- */

import { inputField, sendButton, stopButton, modelSelector, currentController } from "./state.js";

// Model Selector
export function isModelSelected() {
    return modelSelector.value && modelSelector.value.trim() !== "";
}

// Input Text Utility
export function hasInputText() {
    return inputField.value.trim().length > 0;
}

// Update Send Button State
export function updateSendButtonState() {
    const hasModel = isModelSelected();
    const hasText = hasInputText();
    const isBusy = currentController !== null;

    sendButton.disabled = !(hasModel && hasText) || isBusy;
}

// Set Generating State
export function setGeneratingState(isGenerating) {
    stopButton.disabled = !isGenerating;
    inputField.disabled = isGenerating;
    updateSendButtonState();
}

// Enable Send Button
export function enableSendButton() {
    const sendButton = document.getElementById("send-button");
    if (sendButton) {
        sendButton.disabled = false;
    }
}

// Stop Generation
export function stopGeneration() {
    if (currentController) currentController.abort();
    enableSendButton();
}

// Copy To Clipboard
export async function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {}
    }

    try {
        const textarea = document.createElement("textarea");
        textarea.value = text;

        textarea.style.position = "fixed";
        textarea.style.opacity = "0";

        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        const success = document.execCommand("copy");
        document.body.removeChild(textarea);

        return success;
    } catch {
        return false;
    }
}
