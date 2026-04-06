/* -------------------------
   UI Helpers
------------------------- */

import {
    inputField,
    sendButton,
    stopButton,
    modelSelector,
    currentController
} from "./state.js";

export function isModelSelected() {
    return modelSelector.value && modelSelector.value.trim() !== "";
}

export function hasInputText() {
    return inputField.value.trim().length > 0;
}

export function updateSendButtonState() {
    const hasModel = isModelSelected();
    const hasText = hasInputText();
    const isBusy = currentController !== null;

    sendButton.disabled = !(hasModel && hasText) || isBusy;
}

export function setGeneratingState(isGenerating) {
    stopButton.disabled = !isGenerating;
    inputField.disabled = isGenerating;
    updateSendButtonState();
}
