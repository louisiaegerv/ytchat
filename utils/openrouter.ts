export interface ModelOption {
  id: string;
  name: string;
}

export const models: ModelOption[] = [
  {
    id: "qwen/qwen3-next-80b-a3b-thinking",
    name: "Qwen 3 A3B Thinking",
  },
  {
    id: "qwen/qwen3-next-80b-a3b-instruct",
    name: "Qwen 3 A3B Instruct",
  },
  {
    id: "nvidia/nemotron-nano-9b-v2:free",
    name: "Nemotron Nano 9b V2 (Free)",
  },
  {
    id: "openrouter/sonoma-dusk-alpha",
    name: "Sonoma Dusk Alpha Instruct (Free Cloaked)",
  },
  {
    id: "openrouter/openrouter/sonoma-sky-alpha",
    name: "Sonoma Sky Alpha - Reasoning (Free Cloaked)",
  },
  {
    id: "moonshotai/kimi-k2-0905",
    name: "Kimi K2 0905",
  },
  {
    id: "google/gemini-2.5-flash-lite-preview-06-17",
    name: "Gemini 2.5 Flash Lite Preview 6-17",
  },
  {
    id: "google/gemini-2.5-flash-preview",
    name: "Gemini 2.5 Flash",
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
  | "nvidia/nemotron-nano-9b-v2:free"
  | "openrouter/sonoma-dusk-alpha"
  | "openrouter/openrouter/sonoma-sky-alpha"
  | "moonshotai/kimi-k2-0905"
  | "google/gemini-2.5-flash-lite-preview-06-17"
  | "google/gemini-2.5-flash-preview"
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
