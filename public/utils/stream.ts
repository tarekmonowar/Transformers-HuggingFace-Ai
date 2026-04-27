// Posts a chat message to /api/<provider>/chat and yields text chunks as they arrive.
// Works with both streaming (text/plain) and JSON responses.

import type { Provider } from "./ui.js";

interface StreamChatOptions {
  provider: Provider;
  message: string;
  signal?: AbortSignal;
}

export async function* streamChat({
  provider,
  message,
  signal,
}: StreamChatOptions): AsyncGenerator<string, void, unknown> {
  const res = await fetch(`/api/${provider}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
    signal,
  });

  if (!res.ok) {
    let serverMsg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      if (data?.error) serverMsg = data.error;
    } catch {
      // ignore
    }
    throw new Error(serverMsg);
  }

  const contentType = res.headers.get("content-type") || "";

  if (res.body && contentType.includes("text/plain")) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      if (chunk) yield chunk;
    }

    const tail = decoder.decode();
    if (tail) yield tail;
    return;
  }

  // Fallback: server returned JSON instead of a stream.
  const data = await res.json().catch(() => ({}));
  const text =
    data.reply ?? data.response ?? data.message ?? JSON.stringify(data);
  if (text) yield String(text);
}
