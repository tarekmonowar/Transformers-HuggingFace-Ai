import "dotenv/config";

type EnvConfig = {
  hfToken?: string;
  hfModel: string;
  port: number;
};

const env: EnvConfig = {
  hfToken: process.env.HF_TOKEN,
  hfModel: process.env.HF_MODEL,
  port: Number(process.env.PORT),
};

if (!env.hfToken) {
  console.warn("HF_TOKEN is not set");
}

export default env;
