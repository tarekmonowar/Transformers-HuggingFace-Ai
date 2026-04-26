import {
  setActiveProvider,
  addUserMessage,
  createBotBubble,
} from "./utils/ui.js";
import { streamChat } from "./utils/stream.js";

const form = document.getElementById("chatForm");
const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const tabs = document.querySelectorAll(".tab");
const windows = document.querySelectorAll(".chat-window");

let activeProvider = "huggingface";
let currentController = null;

const switchProvider = (provider) => {
  activeProvider = provider;
  setActiveProvider(provider, { tabs, windows, input });
};

tabs.forEach((tab) =>
  tab.addEventListener("click", () => switchProvider(tab.dataset.provider)),
);

const setSending = (streaming) => {
  sendBtn.classList.toggle("stop", streaming);
  sendBtn.textContent = streaming ? "Stop" : "Send";
  input.disabled = streaming;
};

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (currentController) {
    currentController.abort();
    return;
  }

  const message = input.value.trim();
  if (!message) return;

  const provider = activeProvider;
  addUserMessage(provider, message);
  input.value = "";

  const bubble = createBotBubble(provider);
  const controller = new AbortController();
  currentController = controller;
  setSending(true);

  try {
    for await (const chunk of streamChat({
      provider,
      message,
      signal: controller.signal,
    })) {
      bubble.appendChunk(chunk);
    }
    bubble.finish();
  } catch (err) {
    if (err.name === "AbortError") bubble.stop();
    else bubble.fail(err.message || "Request failed");
  } finally {
    currentController = null;
    setSending(false);
    input.focus();
  }
});

switchProvider("huggingface");
