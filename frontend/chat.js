let history = [];

async function sendMessage() {
    const input = document.getElementById("input");
    const text = input.value.trim();
    if (!text) return;

    appendMessage('user', text);
    input.value = '';

    const botDiv = appendMessage('bot', '');

    const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ message: text, history: history })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let fullReply = '';
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullReply += chunk;

        botDiv.innerHTML = marked.parse(fullReply);
        botDiv.querySelectorAll('pre code').forEach(block => {
            hljs.highlightBlock(block);
            addCopyButton(block);
        });
    }

    history.push({role: 'user', content: text});
    history.push({role: 'assistant', content: fullReply});
}

function appendMessage(role, text) {
    const chatBox = document.getElementById('chat-box');
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', role);

    if (role === 'bot') {
        const avatarDiv = document.createElement('div');
        avatarDiv.classList.add('avatar');
        const avatarImg = document.createElement('img');
        avatarImg.src = 'assets/images/jinji.png';
        avatarImg.alt = 'Bot Avatar';
        avatarImg.classList.add('avatar-img');
        avatarDiv.appendChild(avatarImg);

        msgDiv.appendChild(avatarDiv);
        msgDiv.innerHTML += text ? marked.parse(text) : '';
    } else {
        const preElement = document.createElement('pre');
        preElement.textContent = text;
        msgDiv.appendChild(preElement);
    }

    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    return msgDiv;
}

function addCopyButton(codeBlock) {
    if (codeBlock.parentElement.querySelector('.copy-code-btn')) {
        return;
    }

    const copyButton = document.createElement('button');
    copyButton.textContent = 'Copy Code';
    copyButton.classList.add('copy-code-btn');

    copyButton.addEventListener('click', () => {
        copyCodeToClipboard(codeBlock, copyButton);
    });

    codeBlock.parentElement.style.position = 'relative';
    codeBlock.parentElement.appendChild(copyButton);
}

function copyCodeToClipboard(codeBlock, button) {
    const range = document.createRange();
    range.selectNodeContents(codeBlock);

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    if (document.execCommand('copy')) {
        button.textContent = 'Copied!';
        setTimeout(() => {
            button.textContent = 'Copy Code';
        }, 1000);
    }

    selection.removeAllRanges();
}

const inputField = document.getElementById("input");
inputField.addEventListener("keydown", function(event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});

document.getElementById("send-button").addEventListener("click", sendMessage);
