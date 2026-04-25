import express from "express";
import path from "path";
import ollamaRouter from "./ollama/ollama.router";
import huggingFaceRouter from "./HuggingFace/hugging.router";

const app = express();

app.use(express.json());
app.use(express.static(path.resolve(process.cwd(), "public")));

// Routes
app.use("/api/huggingface", huggingFaceRouter);
app.use("/api/ollama", ollamaRouter);

// 404
app.use((req, res) => {
  res.status(404).send("Not Found");
});

export default app;
