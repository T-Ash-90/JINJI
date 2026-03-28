let history = [];

async function sendMessage() {
    const input = document.getElementById("input");
    const message = input.value;

    appendMessage("user", message); // render user message

    const botDiv = appendMessage("bot", ""); // placeholder for streaming

    // Send message to backend
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

        // Render Markdown dynamically while streaming
        botDiv.innerHTML = marked.parse(fullReply);
        botDiv.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightBlock(block);
        });
    }

    history.push({role: "user", content: message});
    history.push({role: "assistant", content: fullReply});

    input.value = "";
}

// Unified function to add messages
function appendMessage(role, text) {
    const chatBox = document.getElementById('chat-box');
    const msgDiv = document.createElement('div');
    msgDiv.className = role; // 'user' or 'bot'

    if (role === 'user') {
        msgDiv.textContent = text;
    } else {
        // Initially empty, content updated while streaming
        msgDiv.innerHTML = text ? marked.parse(text) : "";
    }

    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    return msgDiv;
}
