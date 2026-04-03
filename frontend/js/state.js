/* -------------------------
   State
------------------------- */

export let history = [];
export let currentController = null;
export let DEFAULT_SYSTEM_PROMPT = "";
export let isSticky = true;

export let inputField;
export let sendButton;
export let stopButton;
export let modelSelector;

export function setController(controller) {
    currentController = controller;
}

export function setDefaultPrompt(prompt) {
    DEFAULT_SYSTEM_PROMPT = prompt;
}

export function setSticky(val) {
    isSticky = val;
}

export function setElements(elements) {
    inputField = elements.inputField;
    sendButton = elements.sendButton;
    stopButton = elements.stopButton;
    modelSelector = elements.modelSelector;
}
