import env from "../config/env";

export async function* OllamaServices(
  message: string,
): AsyncGenerator<string> {
  const url = `${env.ollamaBaseUrl}/api/chat`;

  let response: globalThis.Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: env.ollamaModel,
        messages: [{ role: "user", content: message }],
        stream: true,
      }),
    });
  } catch (err: any) {
    throw new Error(
      `Cannot reach Ollama at ${env.ollamaBaseUrl}. ` +
        `Is the Ollama app running? (${err?.message || err})`,
    );
  }

  if (!response.ok || !response.body) {
    const errText = await response.text().catch(() => "");
    throw new Error(
      `Ollama request failed (${response.status}) ${errText || ""}`.trim(),
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const json = JSON.parse(trimmed);
        const content: string =
          json?.message?.content ?? json?.response ?? "";

        if (content) yield content;
        if (json?.done) return;
      } catch {
        // ignore malformed line
      }
    }
  }

  const tail = buffer.trim();
  if (tail) {
    try {
      const json = JSON.parse(tail);
      const content: string = json?.message?.content ?? json?.response ?? "";
      if (content) yield content;
    } catch {
      // ignore
    }
  }
}
