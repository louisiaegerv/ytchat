export interface ModelOption {
  id: string;
  name: string;
}

export const models: ModelOption[] = [
  {
    id: "meta-llama/llama-4-scout-17b-16e-instruct",
    name: "Llama 4 Scout (Groq)",
  },
  {
    id: "meta-llama/llama-4-scout",
    name: "Llama 4 Scout",
  },
  {
    id: "google/gemini-2.0-flash-001",
    name: "Gemini 2.0 Flash",
  },
  {
    id: "openrouter/quasar-alpha",
    name: "Quasar Alpha",
  },
];

export type OpenRouterModel =
  | "meta-llama/llama-4-scout"
  | "google/gemini-2.0-flash-001"
  | "openrouter/quasar-alpha";

export async function openRouterChat(
  model: OpenRouterModel,
  messages: { role: string; content: string }[]
) {
  try {
    const response = await fetch("/api/openrouter", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages, model }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch OpenRouter response");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("OpenRouter API error:", error);
    throw error;
  }
}
