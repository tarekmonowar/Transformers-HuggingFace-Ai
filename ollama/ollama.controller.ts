import { Request, Response } from "express";
import { OllamaServices } from "./ollama.services";

export const chatOllama = async (req: Request, res: Response) => {
  const { message } = req.body || {};
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Missing 'message' in body" });
  }

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  let aborted = false;
  req.on("close", () => {
    aborted = true;
  });

  try {
    for await (const token of OllamaServices(message)) {
      if (aborted) break;
      res.write(token);
    }
    res.end();
  } catch (err: any) {
    console.error("[ollama] chat error:", err);
    if (!res.headersSent) {
      return res.status(500).json({
        error: err?.message || "Ollama request failed.",
      });
    }
    res.write(`\n\n[stream error] ${err?.message || "unknown error"}`);
    res.end();
  }
};
