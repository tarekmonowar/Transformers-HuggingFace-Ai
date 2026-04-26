import { Router } from "express";
import { chatOllama } from "./ollama.controller";

const router = Router();
router.post("/chat", chatOllama);

export default router;
