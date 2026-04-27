import { Request, Response } from "express";
import { HuggingFaceServices } from "./hugging.services";

export const chatHuggingFace = async (req: Request, res: Response) => {
  const { message } = req.body || {};
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Missing 'message' in body" });
  }

  let aborted = false;
  req.on("close", () => {
    aborted = true;
  });

  let started = false;
  const startStream = () => {
    if (started) return;
    started = true;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();
  };

  try {
    for await (const token of HuggingFaceServices(message)) {
      if (aborted) break;
      startStream();
      res.write(token);
    }
    if (!started) {
      // Upstream succeeded but produced no tokens.
      return res.status(502).json({
        error: "Hugging Face returned an empty response.",
      });
    }
    res.end();
  } catch (err: any) {
    console.error("[huggingface] chat error:", err);
    if (!res.headersSent) {
      return res.status(500).json({
        error: err?.message || "Hugging Face request failed.",
      });
    }
    res.write(`\n\n[stream error] ${err?.message || "unknown error"}`);
    res.end();
  }
};
