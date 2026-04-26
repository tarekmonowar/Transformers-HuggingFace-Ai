import "dotenv/config";

type EnvConfig = {
  port: number;
  hfToken?: string;
  hfModel: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
};

const env: EnvConfig = {
  port: Number(process.env.PORT) || 9000,
  hfToken: process.env.HF_TOKEN,
  hfModel: process.env.HF_MODEL || "google/gemma-2-2b-it",
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
  ollamaModel: process.env.OLLAMA_MODEL || "llama3.2",
};

if (!env.hfToken) {
  console.warn("[env] HF_TOKEN is not set — Hugging Face requests will fail.");
}

console.log(
  `[env] Ollama -> ${env.ollamaBaseUrl} (model: ${env.ollamaModel})`,
);

export default env;
