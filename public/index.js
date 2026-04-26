const form = document.getElementById("chatForm");
const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const tabs = document.querySelectorAll(".tab");
const windows = document.querySelectorAll(".chat-window");

let activeProvider = "huggingface";

function setActiveProvider(provider) {
  activeProvider = provider;

  tabs.forEach((t) => {
    const isActive = t.dataset.provider === provider;
    t.classList.toggle("active", isActive);
    t.setAttribute("aria-selected", isActive ? "true" : "false");
  });

  windows.forEach((w) => {
    w.classList.toggle("active", w.dataset.provider === provider);
  });

  input.placeholder =
    provider === "huggingface"
      ? "Ask Hugging Face..."
      : "Ask your local Ollama model...";
  input.focus();
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => setActiveProvider(tab.dataset.provider));
});

function getWindow(provider) {
  return document.getElementById(`chat-${provider}`);
}

function addMessage(text, who, provider) {
  const win = getWindow(provider);
  const wrap = document.createElement("div");
  wrap.className = `msg ${who}`;
  const bubble = document.createElement("div");
  bubble.className = "bubble dynamic";
  bubble.textContent = text;
  wrap.appendChild(bubble);
  win.appendChild(wrap);
  win.scrollTop = win.scrollHeight;
  return { bubble, win };
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = input.value.trim();
  if (!message) return;

  const provider = activeProvider;

  addMessage(message, "user", provider);
  input.value = "";
  sendBtn.disabled = true;

  const { bubble: typingBubble, win } = addMessage("Thinking...", "bot", provider);
  typingBubble.classList.add("typing");

  try {
    const res = await fetch(`/api/${provider}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Request failed (HTTP ${res.status})`);
    }

    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("text/plain") && res.body) {
      typingBubble.classList.remove("typing");
      typingBubble.textContent = "";

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        typingBubble.textContent = acc;
        win.scrollTop = win.scrollHeight;
      }

      acc += decoder.decode();
      typingBubble.textContent = acc;
      win.scrollTop = win.scrollHeight;
    } else {
      const data = await res.json().catch(() => ({}));
      typingBubble.classList.remove("typing");
      typingBubble.textContent =
        data.reply ?? data.response ?? data.message ?? JSON.stringify(data);
    }
  } catch (err) {
    typingBubble.classList.remove("typing");
    typingBubble.textContent = `Error: ${err.message}`;
  } finally {
    sendBtn.disabled = false;
    input.focus();
  }
});

setActiveProvider("huggingface");
