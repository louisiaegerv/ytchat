export interface ModelOption {
  id: string;
  name: string;
}

export const models: ModelOption[] = [
  {
    id: "google/gemini-2.5-flash-lite-preview-09-2025",
    name: "Gemini Flash Lite Preview 09-2025",
  },
  {
    id: "z-ai/glm-4.7",
    name: "GLM 4.7 (Dec '25)",
  },
  {
    id: "xiaomi/mimo-v2-flash:free",
    name: "Mimo v2 Flash Free",
  },
  {
    id: "xiaomi/mimo-v2-flash",
    name: "Mimo v2 Flash",
  },
  {
    id: "x-ai/grok-4.1-fast",
    name: "x-ai/grok-4.1-fast",
  },
  {
    id: "minimax/minimax-m2.1",
    name: "Minimax M2.1 (Dec '25)",
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
    id: "moonshotai/kimi-k2-0905",
    name: "Kimi K2 0905",
  },
];

export type OpenRouterModel =
  | "google/gemini-2.5-flash-lite-preview-09-2025"
  | "z-ai/glm-4.7"
  | "xiaomi/mimo-v2-flash:free"
  | "xiaomi/mimo-v2-flash"
  | "minimax/minimax-m2.1"
  | "qwen/qwen3-next-80b-a3b-thinking"
  | "qwen/qwen3-next-80b-a3b-instruct"
  | "moonshotai/kimi-k2-0905";

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
