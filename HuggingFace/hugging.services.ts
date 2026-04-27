import { InferenceClient } from "@huggingface/inference";
import env from "../config/env";

export async function* HuggingFaceServices(
  message: string,
): AsyncGenerator<string> {
  if (!env.hfToken) {
    throw new Error("HF_TOKEN is not set");
  }

  const client = new InferenceClient(env.hfToken);

  const stream = client.chatCompletionStream({
    provider: "auto",
    model: env.hfModel,
    messages: [
      {
        role: "user",
        content: message,
      },
    ],
  });

  for await (const chunk of stream) {
    const newContent = chunk.choices?.[0]?.delta?.content;
    // console.log("RAW CHUNK:", chunk); // 🔥 full data
    // console.log("CONTENT:", newContent);
    if (newContent) {
      yield newContent;
    }
  }
}
