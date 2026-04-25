import { Router, Request, Response } from "express";
import { InferenceClient } from "@huggingface/inference";

const router = Router();

const HF_TOKEN = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY;
const HF_MODEL = process.env.HF_MODEL || "meta-llama/Llama-3.1-8B-Instruct";

const client = new InferenceClient(HF_TOKEN);

router.post("/chat", async (req: Request, res: Response) => {
  try {
    const { message } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing 'message' in body" });
    }

    if (!HF_TOKEN) {
      return res.status(500).json({
        error:
          "HF_TOKEN env var is not set. Add it to your .env file.",
      });
    }

    const out = await client.chatCompletion({
      model: HF_MODEL,
      messages: [{ role: "user", content: message }],
      max_tokens: 512,
    });

    const reply = out.choices?.[0]?.message?.content ?? "";
    return res.json({ reply, model: HF_MODEL });
  } catch (err: any) {
    console.error("[huggingface] chat error:", err);
    return res
      .status(500)
      .json({ error: err?.message || "Hugging Face request failed" });
  }
});

export default router;
