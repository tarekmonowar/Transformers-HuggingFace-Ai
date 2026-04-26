import { Request, Response } from "express";
import { HuggingFaceServices } from "./hugging.services";

export const chatHuggingFace = async (req: Request, res: Response) => {
  try {
    const { message } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing 'message' in body" });
    }

    const chunks: string[] = [];
    for await (const token of HuggingFaceServices(message)) {
      chunks.push(token);
    }

    return res.json({
      reply: chunks.join(""),
    });
  } catch (err: any) {
    console.error("[huggingface] chat error:", err);
    return res.status(500).json({
      error: err?.message || "Hugging Face request failed.",
    });
  }
};
