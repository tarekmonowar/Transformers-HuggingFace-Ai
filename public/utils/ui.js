// DOM helpers for the chat UI.
const getWindow = (provider) => document.getElementById(`chat-${provider}`);
const isNearBottom = (el, threshold = 120) => el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
const scrollToBottom = (el) => el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
export function setActiveProvider(provider, { tabs, windows, input }) {
    tabs.forEach((t) => {
        const isActive = t.dataset.provider === provider;
        t.classList.toggle("active", isActive);
        t.setAttribute("aria-selected", isActive ? "true" : "false");
    });
    windows.forEach((w) => w.classList.toggle("active", w.dataset.provider === provider));
    input.placeholder =
        provider === "huggingface"
            ? "Ask Hugging Face..."
            : "Ask your local Ollama model...";
    input.focus();
}
export function addUserMessage(provider, text) {
    const win = getWindow(provider);
    if (!win)
        return;
    const wrap = document.createElement("div");
    wrap.className = "msg user";
    const bubble = document.createElement("div");
    bubble.className = "bubble dynamic";
    bubble.textContent = text;
    wrap.appendChild(bubble);
    win.appendChild(wrap);
    scrollToBottom(win);
}
// Creates an empty bot bubble with typing dots + blinking caret,
// and returns a small controller to drive its lifecycle.
export function createBotBubble(provider) {
    const win = getWindow(provider);
    if (!win) {
        // Fallback no-op bubble — keeps callers safe if the window is missing.
        return {
            appendChunk: () => { },
            finish: () => { },
            fail: () => { },
            stop: () => { },
        };
    }
    const wrap = document.createElement("div");
    wrap.className = "msg bot";
    const bubble = document.createElement("div");
    bubble.className = "bubble dynamic streaming";
    const textEl = document.createElement("span");
    textEl.className = "stream-text";
    const dots = document.createElement("span");
    dots.className = "typing-dots";
    dots.innerHTML = "<span></span><span></span><span></span>";
    const caret = document.createElement("span");
    caret.className = "caret";
    caret.textContent = "▍";
    bubble.append(textEl, dots, caret);
    wrap.appendChild(bubble);
    win.appendChild(wrap);
    scrollToBottom(win);
    let buffered = "";
    let firstChunkSeen = false;
    let painting = false;
    const paint = () => {
        painting = false;
        textEl.textContent = buffered;
        if (isNearBottom(win))
            scrollToBottom(win);
    };
    const schedulePaint = () => {
        if (painting)
            return;
        painting = true;
        requestAnimationFrame(paint);
    };
    const removePending = () => {
        if (dots.isConnected)
            dots.remove();
        if (caret.isConnected)
            caret.remove();
    };
    return {
        appendChunk(chunk) {
            if (!chunk)
                return;
            if (!firstChunkSeen) {
                firstChunkSeen = true;
                if (dots.isConnected)
                    dots.remove();
            }
            buffered += chunk;
            schedulePaint();
        },
        finish() {
            bubble.classList.remove("streaming");
            removePending();
            textEl.textContent = buffered || "(no response)";
            scrollToBottom(win);
        },
        fail(message) {
            bubble.classList.remove("streaming");
            bubble.classList.add("error");
            removePending();
            textEl.textContent = buffered
                ? `${buffered}\n\nError: ${message}`
                : `Error: ${message}`;
            scrollToBottom(win);
        },
        stop() {
            bubble.classList.remove("streaming");
            removePending();
            textEl.textContent = `${buffered}${buffered ? "\n\n" : ""}[stopped]`;
            scrollToBottom(win);
        },
    };
}
