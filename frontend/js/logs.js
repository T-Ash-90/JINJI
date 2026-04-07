/* -------------------------
   Logging Utility
------------------------- */

import { CONFIG } from "./config.js";
import { estimateTokens } from "./context.js";

// Chat Debug
export function logChatDebug({ context = "", userInput = "" }) {
    const systemTokens = estimateTokens(CONFIG.systemPrompt);
    const contextTokens = estimateTokens(context);
    const userTokens = estimateTokens(userInput);
    const totalTokens = systemTokens + contextTokens + userTokens;

    console.groupCollapsed("%c[Chat Debug]", "color: #0a0; font-weight: bold;");

    console.log("[System Prompt]:", CONFIG.systemPrompt);
    console.log("[Context]:", context);
    console.log("[User Input]:", userInput);

    console.groupEnd();

    console.log("[Token Estimate] System:", systemTokens);
    console.log("[Token Estimate] Context:", contextTokens);
    console.log("[Token Estimate] User input:", userTokens);
    console.log("[Token Estimate] Total tokens:", totalTokens);
}
