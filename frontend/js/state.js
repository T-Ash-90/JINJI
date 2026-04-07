/* -------------------------
   State
------------------------- */

import { CONFIG } from './config.js';

export let history = [];
export let currentController = null;
export let inputField;
export let sendButton;
export let stopButton;
export let modelSelector;

// Set Controller
export function setController(controller) {
    currentController = controller;
}

// Set Default Prompt
export function setDefaultPrompt(prompt) {
    CONFIG.systemPrompt = prompt;
}

// Set Elements
export function setElements(elements) {
    inputField = elements.inputField;
    sendButton = elements.sendButton;
    stopButton = elements.stopButton;
    modelSelector = elements.modelSelector;
}
