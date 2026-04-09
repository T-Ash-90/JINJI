/* -------------------------
   Models Logic
------------------------- */

import { CONFIG } from './config.js';
import { modelSelector } from "./state.js";
import { updateSendButtonState } from "./utils.js";

// Load Models
export async function loadModels() {
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
            const cloudGroup = document.createElement("optgroup");
            cloudGroup.label = "Cloud Based Models";

            const localGroup = document.createElement("optgroup");
            localGroup.label = "Local Models";

            data.models.forEach(model => {
                const opt = document.createElement("option");
                opt.value = model;
                opt.textContent = model;

                if (model.endsWith("-cloud")) {
                    cloudGroup.appendChild(opt);
                } else {
                    localGroup.appendChild(opt);
                }
            });

            if (cloudGroup.contains(cloudGroup.firstChild) || cloudGroup.children.length > 0) {
                modelSelector.appendChild(cloudGroup);
            }
            if (localGroup.contains(localGroup.firstChild) || localGroup.children.length > 0) {
                modelSelector.appendChild(localGroup);
            }
        }

    } catch {
        modelSelector.innerHTML = "<option>Error loading models</option>";
    }

    updateSendButtonState();
}

// Load Model Details
export async function loadModelDetails(modelName) {
    try {
        const res = await fetch(`http://localhost:8000/models/${modelName}`);
        const data = await res.json();

        if (data.model_info) {
            const modelInfoText = data.model_info;
            const modelInfo = parseModelInfo(modelInfoText);

            document.getElementById("architecture").textContent = modelInfo.architecture || "N/A";
            document.getElementById("parameters").textContent = modelInfo.parameters || "N/A";
            document.getElementById("context-length").textContent = modelInfo.contextLength || "N/A";
            document.getElementById("embedding-length").textContent = modelInfo.embeddingLength || "N/A";
            document.getElementById("quantization").textContent = modelInfo.quantization || "N/A";
            document.getElementById("model-details").style.display = "block";

            console.log("Parsed model info:", modelInfo);
        }
    } catch (error) {
        console.error("Error loading model details:", error);
    }
}

// Parse Model Info
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

// Model Selector
export function isModelSelected() {
    return modelSelector.value && modelSelector.value.trim() !== "";
}

// Set maxTokens dynamically.
export function setMaxTokens(value) {
    CONFIG.maxTokens = value;
    localStorage.setItem("maxTokens", value);
    console.log(`Updated maxTokens to ${CONFIG.maxTokens}`);
}

// Initialize maxTokens from localStorage if available
export function loadMaxTokens() {
    const stored = localStorage.getItem("maxTokens");
    if (stored) {
        CONFIG.maxTokens = parseInt(stored, 10);
    }
}
