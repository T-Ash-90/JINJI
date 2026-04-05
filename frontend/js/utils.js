/* -------------------------
   Utilities
------------------------- */

//Copy to clipboard
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

// Helper to append context and token info
export function appendContextAndTokenInfo(contextFiles, tokenInfo) {
    const box = document.getElementById("chat-box");

    const infoDiv = document.createElement("div");
    infoDiv.classList.add("info-message");

    const contextLabel = document.createElement("div");
    contextLabel.classList.add("info-label");
    contextLabel.textContent = "Context files:";
    const contextContent = document.createElement("div");
    contextContent.classList.add("info-content");
    contextContent.textContent = contextFiles.join(",\n");

    const tokenLabel = document.createElement("div");
    tokenLabel.classList.add("info-label");
    tokenLabel.textContent = "Estimated Total Tokens:";
    const tokenContent = document.createElement("div");
    tokenContent.classList.add("info-content");
    tokenContent.textContent = tokenInfo.totalTokens;

    infoDiv.appendChild(contextLabel);
    infoDiv.appendChild(contextContent);
    infoDiv.appendChild(tokenLabel);
    infoDiv.appendChild(tokenContent);

    box.appendChild(infoDiv);
}

// Helper to estimate tokens
export function estimateTokens(text) {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
}

// Enable Send Button
export function enableSendButton() {
    const sendButton = document.getElementById("send-button");
    if (sendButton) {
        sendButton.disabled = false;
    }
}
