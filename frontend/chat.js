let history = [];

async function sendMessage() {
    const input = document.getElementById("input");
    const message = input.value;

    addMessage("You", message);

    const botDiv = addMessage("Bot", ""); // empty placeholder

    const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            message: message,
            history: history
        })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let fullReply = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        fullReply += chunk;
        botDiv.textContent = "Bot: " + fullReply;
    }

    history.push({role: "user", content: message});
    history.push({role: "assistant", content: fullReply});

    input.value = "";
}

function addMessage(sender, text) {
    const chat = document.getElementById("chat");
    const div = document.createElement("div");
    div.textContent = sender + ": " + text;
    chat.appendChild(div);
    return div;
}
