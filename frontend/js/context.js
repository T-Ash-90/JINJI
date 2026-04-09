/* -------------------------
   Context and Tokens Logic
------------------------- */

import { CONFIG } from './config.js';

// Estimate Tokens
export async function estimateTokens(text) {
    if (!text) return 0;
    const res = await fetch("http://localhost:8000/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
    });
    const data = await res.json();
    return data.tokens;
}


// Get Context from API
export async function getContext() {
    try {
        const toggleEl = document.getElementById("context-toggle");
        if (!toggleEl) {
            console.error("[getContext] Toggle element not found in DOM");
            return "";
        }

        const includeContext = toggleEl.checked;

        if (!includeContext) {
            return "";
        }

        const endpoint = CONFIG.contextApiEndpoint || "none";

        if (endpoint === "none") {
            console.warn("[getContext] No context API endpoint configured");
            return "";
        }

        const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });

        console.log("[getContext] Response received:", {
            status: res.status,
            statusText: res.statusText,
        });

        if (!res.ok) {
            const text = await res.text().catch(() => "<failed to read body>");
            console.error("[getContext] HTTP error:", {
                status: res.status,
                statusText: res.statusText,
                body: text,
            });
            throw new Error(`HTTP ${res.status}`);
        }

        let data;
        try {
            data = await res.json();
        } catch (parseErr) {
            console.error("[getContext] Failed to parse JSON:", parseErr);
            throw parseErr;
        }

        if (!data || !Array.isArray(data.files)) {
            console.error("[getContext] Unexpected response format:", data);
            return "";
        }

        console.log(`[getContext] Received ${data.files.length} files`);

        console.log(
            "[getContext] File paths:",
            data.files.map(f => f.path)
        );

        return data.files
            .map((f, i) => {
                if (!f.path || !f.content) {
                    console.warn(`[getContext] File ${i} missing fields:`, f);
                }
                return `Path: ${f.path}\nContent:\n${f.content}`;
            })
            .join("\n\n");

    } catch (err) {
        console.error("[getContext] Fatal error:", {
            message: err.message,
            stack: err.stack,
        });
        return "";
    }
}

// Append Context
export function appendContext(contextFiles, tokenInfo) {
    const box = document.getElementById("chat-box");
    const infoDiv = document.createElement("div");
    infoDiv.classList.add("info-message");

    const contextLabel = document.createElement("div");
    contextLabel.classList.add("info-label");
    contextLabel.textContent = "Context files:";

    const contextContent = document.createElement("div");
    contextContent.classList.add("info-content");

    contextContent.textContent = `${contextFiles.join(",\n")}\n\nTokens: ${tokenInfo.totalTokens} (User: ${tokenInfo.userTokens}, Context: ${tokenInfo.contextTokens})`;

    infoDiv.appendChild(contextLabel);
    infoDiv.appendChild(contextContent);
    box.appendChild(infoDiv);
}
