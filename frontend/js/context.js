/* -------------------------
   Context
------------------------- */

import { CONFIG } from "./config.js";

export async function getContext() {
    try {
        console.log("[getContext] Starting context fetch...");

        const toggleEl = document.getElementById("context-toggle");
        if (!toggleEl) {
            console.error("[getContext] Toggle element not found in DOM");
            return "";
        }

        const includeContext = toggleEl.checked;
        console.log("[getContext] includeContext:", includeContext);

        if (!includeContext) {
            console.log("[getContext] Context disabled, returning empty string");
            return "";
        }

        const endpoint = CONFIG.contextApiEndpoint || "none";

        if (endpoint === "none") {
            console.warn("[getContext] No context API endpoint configured");
            return "";
        }

        console.log("[getContext] Using endpoint:", endpoint);
        console.log("[getContext] Sending request to local API...");

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
