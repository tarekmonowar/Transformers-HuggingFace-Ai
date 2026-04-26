import { Router } from "express";
import { chatHuggingFace } from "./hugging.controller";

const router = Router();
router.post("/chat", chatHuggingFace);

export default router;
