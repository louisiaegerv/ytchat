export interface ModelOption {
  id: string;
  name: string;
}

export const models: ModelOption[] = [
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
  | "meta-llama/llama-4-scout"
  | "google/gemini-2.5-flash-preview"
  | "google/gemini-2.0-flash-001"
  | "google/gemini-2.0-flash-exp:free"
  | "google/gemini-2.5-flash-lite-preview-06-17"
  | "openai/gpt-4.1-mini"
  | "openai/gpt-4.1-nano";

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
