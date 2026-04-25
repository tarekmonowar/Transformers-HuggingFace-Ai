import { Router, Request, Response } from "express";

const router = Router();

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";

router.post("/chat", async (req: Request, res: Response) => {
  try {
    const { message } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing 'message' in body" });
    }

    const ollamaRes = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [{ role: "user", content: message }],
        stream: false,
      }),
    });

    if (!ollamaRes.ok) {
      const text = await ollamaRes.text();
      return res.status(502).json({
        error: `Ollama request failed (${ollamaRes.status}): ${text}`,
      });
    }

    const data: any = await ollamaRes.json();
    const reply = data?.message?.content ?? data?.response ?? "";
    return res.json({ reply, model: OLLAMA_MODEL });
  } catch (err: any) {
    console.error("[ollama] chat error:", err);
    return res.status(500).json({
      error:
        err?.message ||
        "Ollama request failed. Is Ollama running on " + OLLAMA_URL + "?",
    });
  }
});

export default router;
