import express from "express";
import path from "path";
import { dirname } from "path";
import ollamaRouter from "./ollama/ollama.router";
import huggingFaceRouter from "./HuggingFace/hugging.router";

const app = express();
app.use(express.static(path.join(__dirname, "../public")));

// Routes
app.use("/api/huggingface", huggingFaceRouter);
app.use("/api/ollama", ollamaRouter);

// Home
app.get("/", (req, res) => {
  res.send("I am getting data from home ec2 check");
});

// 404
app.use((req, res) => {
  res.status(400).send("Bad Request tarek");
});

export default app;
