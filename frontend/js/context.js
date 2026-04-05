export async function getContext() {
    try {
        const res = await fetch("http://127.0.0.1:8765/files", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // Convert objects to readable string
        return data.files.map(f => `Path: ${f.path}\nContent:\n${f.content}`).join('\n\n');

    } catch (err) {
        console.error("Error fetching context:", err);
        return "";
    }
}
