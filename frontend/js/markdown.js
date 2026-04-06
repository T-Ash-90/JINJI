/* -------------------------
   Markdown System
------------------------- */

const markdownPlugins = [];

// Register Markdown Plugin
export function registerMarkdownPlugin(pluginFn) {
    markdownPlugins.push(pluginFn);
}

// Apply Markdown Plugins
export function applyMarkdownPlugins(container) {
    markdownPlugins.forEach(plugin => {
        try {
            plugin(container);
        } catch {}
    });
}

// Render Markdown
export function renderMarkdown(text) {
    const rawHtml = marked.parse(text);
    const cleanHtml = DOMPurify.sanitize(rawHtml);

    const container = document.createElement("div");
    container.innerHTML = cleanHtml;

    applyMarkdownPlugins(container);

    return container.innerHTML;
}

/* -------------------------
   Default Plugins
------------------------- */

registerMarkdownPlugin(container => {
    container.querySelectorAll("pre code").forEach(block => {
        if (block.parentElement.classList.contains("code-wrapper")) return;

        const pre = block.parentElement;

        const wrapper = document.createElement("div");
        wrapper.className = "code-wrapper";

        const header = document.createElement("div");
        header.className = "code-header";

        let langMatch = block.className.match(/language-(\w+)/);
        let lang = langMatch ? langMatch[1] : "text";

        const langLabel = document.createElement("span");
        langLabel.textContent = lang;

        const copyBtn = document.createElement("button");
        copyBtn.className = "copy-btn";
        copyBtn.textContent = "Copy";

        header.appendChild(langLabel);
        header.appendChild(copyBtn);

        pre.parentNode.replaceChild(wrapper, pre);
        wrapper.appendChild(header);
        wrapper.appendChild(pre);

        block.classList.add("hljs");
        hljs.highlightElement(block);
    });
});

registerMarkdownPlugin(container => {
    container.querySelectorAll("a").forEach(a => {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
    });
});
