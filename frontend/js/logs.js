/* -------------------------
   Logging Utilities
------------------------- */

const DEBUG = true;

export function logChatRequest({ model, message, history }) {
    if (!DEBUG) return;

    const systemMessages = history.filter(m => m.role === "system");

    console.group("[Chat Request Debug]");

    console.log("🧠 Model:", model);

    systemMessages.forEach((msg, i) => {
        if (msg.content.startsWith("Here is the code context:")) {
            console.log(`📎 Context Prompt [${i}]`);
            console.log(msg.content);
        } else {
            console.log(`⚙️ System Prompt [${i}]`);
            console.log(msg.content);
        }
    });

    console.log("👤 User Input:");
    console.log(message);

    console.log("📦 Full Payload Preview:", {
        message,
        history,
        model
    });

    console.groupEnd();
}
