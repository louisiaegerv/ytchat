export interface ModelOption {
  id: string;
  name: string;
}

export const models: ModelOption[] = [
  {
    id: "google/gemini-2.5-flash-lite-preview-09-2025",
    name: "Gemini 2.5 Flash Lite Prev 9-25",
  },
  {
    id: "google/gemini-2.5-flash-preview-09-2025",
    name: "Gemini 2.5 Flash Prev 9-25",
  },
  {
    id: "moonshotai/kimi-k2-0905",
    name: "Kimi K2 0905",
  },
  {
    id: "qwen/qwen3-next-80b-a3b-thinking",
    name: "Qwen 3 A3B Thinking",
  },
  {
    id: "qwen/qwen3-next-80b-a3b-instruct",
    name: "Qwen 3 A3B Instruct",
  },
  {
    id: "google/gemini-2.0-flash-001",
    name: "Gemini 2.0 Flash",
  },
  {
    id: "google/gemini-2.0-flash-exp:free",
    name: "Gemini 2.0 Flash Free",
  },
  {
    id: "google/gemini-2.5-pro-exp-03-25",
    name: "Gemini 2.5 Pro Free",
  },
  {
    id: "openai/gpt-4.1-mini",
    name: "GPT 4.1 Mini",
  },
  {
    id: "openai/gpt-4.1-nano",
    name: "GPT 4.1 Nano",
  },
  {
    id: "meta-llama/llama-4-scout",
    name: "Llama 4 Scout",
  },
];

export type OpenRouterModel =
  | "qwen/qwen3-next-80b-a3b-thinking"
  | "qwen/qwen3-next-80b-a3b-instruct"
  | "moonshotai/kimi-k2-0905"
  | "gogoogle/gemini-2.5-flash-preview-09-2025"
  | "google/gemini-2.5-flash-lite-preview-09-2025"
  | "google/gemini-2.0-flash-001"
  | "google/gemini-2.0-flash-exp:free"
  | "google/gemini-2.5-pro-exp-03-25"
  | "openai/gpt-4.1-mini"
  | "openai/gpt-4.1-nano"
  | "meta-llama/llama-4-scout";

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
