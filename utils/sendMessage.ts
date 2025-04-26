import type { ChatMessage } from "@/types/transcript";
import type { TranscriptEntry } from "@/utils/transcriptUtils";

export async function sendMessage(
  input: string,
  messages: ChatMessage[],
  model: string,
  parsedTranscript: TranscriptEntry[]
): Promise<string> {
  const userMessage: ChatMessage = { role: "user", content: input };

  try {
    const endpoint = "/api/openrouter";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content:
              "You are a helpful youtube video transcript assistant/chatbot. Users will ask send messages about a video transcript and your goal is to use the transcript to answer their question. Past user messages and your responses are included for context.",
          },
          ...messages,
          userMessage,
          {
            role: "user",
            content: `Transcript: ${parsedTranscript.map((t) => t.text).join("\n")}`,
          },
        ],
        model,
      }),
    });

    if (!response.ok) throw new Error("Failed to send message");

    const data = await response.json();
    console.log("data log:", data);

    return data.content;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}
