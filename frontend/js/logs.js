/* -------------------------
   Logging Utility
------------------------- */

import { DEFAULT_SYSTEM_PROMPT } from "./state.js";

export function logChatDebug({ context = "", userInput = "" }) {
    const systemTokens = estimateTokens(DEFAULT_SYSTEM_PROMPT);
    const contextTokens = estimateTokens(context);
    const userTokens = estimateTokens(userInput);
    const totalTokens = systemTokens + contextTokens + userTokens;

    console.groupCollapsed("%c[Chat Debug]", "color: #0a0; font-weight: bold;");

    console.log("[System Prompt]:", DEFAULT_SYSTEM_PROMPT);
    console.log("[Context]:", context);
    console.log("[User Input]:", userInput);

    console.log("[Token Estimate] System:", systemTokens);
    console.log("[Token Estimate] Context:", contextTokens);
    console.log("[Token Estimate] User input:", userTokens);
    console.log("[Token Estimate] Total tokens:", totalTokens);

    console.groupEnd();
}

function estimateTokens(text) {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
}
