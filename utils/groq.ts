export async function groqChat(
  model:
    | "meta-llama/llama-4-scout-17b-16e-instruct"
    | "meta-llama/llama-4-scout",
  messages: { role: string; content: string }[]
) {
  try {
    const response = await fetch("/api/groq", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages, model }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch Groq response");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Groq API error:", error);
    throw error;
  }
}
