/* -------------------------
   Initialization Script
------------------------- */

import { setElements, history, setDefaultPrompt, modelSelector } from "./state.js";
import { CONFIG } from "./config.js";
import { sendMessage } from "./chat.js";
import { copyToClipboard, updateSendButtonState, stopGeneration } from "./utils.js";

// Load Models
async function loadModels() {
    try {
        const res = await fetch("http://localhost:8000/models");
        const data = await res.json();

        modelSelector.innerHTML = "";
        console.log("modelSelector:", modelSelector);

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

// Load Model Details
async function loadModelDetails(modelName) {
    try {
        const res = await fetch(`http://localhost:8000/models/${modelName}`);
        const data = await res.json();

        if (data.model_info) {
            const modelInfoText = data.model_info;
            const modelInfo = parseModelInfo(modelInfoText);
            console.log("Parsed model info:", modelInfo);

            document.getElementById("architecture").textContent = modelInfo.architecture || "N/A";
            document.getElementById("parameters").textContent = modelInfo.parameters || "N/A";
            document.getElementById("context-length").textContent = modelInfo.contextLength || "N/A";
            document.getElementById("embedding-length").textContent = modelInfo.embeddingLength || "N/A";
            document.getElementById("quantization").textContent = modelInfo.quantization || "N/A";
            document.getElementById("model-details").style.display = "block";
        }
    } catch (error) {
        console.error("Error loading model details:", error);
    }
}

// Helper function to parse model info text
function parseModelInfo(modelInfoText) {
    const modelInfo = {};
    const lines = modelInfoText.split("\n");

    lines.forEach(line => {
        line = line.trim();

        if (line.length === 0) return;

        if (line.startsWith("architecture")) {
            modelInfo.architecture = line.split(/\s+/).slice(1).join(" ").trim();
        } else if (line.startsWith("parameters")) {
            modelInfo.parameters = line.split(/\s+/).slice(1).join(" ").trim();
        } else if (line.startsWith("context")) {
            modelInfo.contextLength = line.split(/\s+/).slice(1).join(" ").trim().replace(/length/, "");
        } else if (line.startsWith("embedding")) {
            modelInfo.embeddingLength = line.split(/\s+/).slice(1).join(" ").trim().replace(/length/, "");
        } else if (line.startsWith("quantization")) {
            modelInfo.quantization = line.split(/\s+/).slice(1).join(" ").trim();
        }
    });

    return modelInfo;
}

// Modify the modelSelector event listener to load model details when a model is selected
document.addEventListener("DOMContentLoaded", () => {
    const modelSelector = document.getElementById("model-selector");

    // Initially hide the model details section
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
                // Hide model details if no model is selected
                if (modelDetailsSection) {
                    modelDetailsSection.style.display = "none";
                }
            }
        });
    }
});

// Modify the modelSelector event listener to load model details when a model is selected
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

    /* -------------------------
       Boot
    ------------------------- */
    const elements = {
        inputField: document.getElementById("input"),
        sendButton: document.getElementById("send-button"),
        stopButton: document.getElementById("stop-button"),
        modelSelector: document.getElementById("model-selector")
    };

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
