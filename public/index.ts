import {
  setActiveProvider,
  addUserMessage,
  createBotBubble,
  type Provider,
} from "./utils/ui.js";
import { streamChat } from "./utils/stream.js";

const form = document.getElementById("chatForm") as HTMLFormElement | null;
const input = document.getElementById("userInput") as HTMLInputElement | null;
const sendBtn = document.getElementById("sendBtn") as HTMLButtonElement | null;
const tabs = document.querySelectorAll<HTMLElement>(".tab");
const windows = document.querySelectorAll<HTMLElement>(".chat-window");

if (!form || !input || !sendBtn) {
  throw new Error("Chat UI elements not found in DOM");
}

let activeProvider: Provider = "huggingface";
let currentController: AbortController | null = null;

const switchProvider = (provider: Provider): void => {
  activeProvider = provider;
  setActiveProvider(provider, { tabs, windows, input });
};

tabs.forEach((tab) =>
  tab.addEventListener("click", () => {
    const provider = tab.dataset.provider as Provider | undefined;
    if (provider) switchProvider(provider);
  }),
);

// Update send button state based on streaming status
const setSending = (streaming: boolean): void => {
  sendBtn.classList.toggle("stop", streaming);
  sendBtn.textContent = streaming ? "Stop" : "Send";
  input.disabled = streaming;
};

form.addEventListener("submit", async (e: Event) => {
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
    const error = err as Error;
    if (error.name === "AbortError") bubble.stop();
    else bubble.fail(error.message || "Request failed");
  } finally {
    currentController = null;
    setSending(false);
    input.focus();
  }
});

switchProvider("huggingface");
