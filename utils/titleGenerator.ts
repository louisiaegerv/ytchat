import { models } from "./openrouter";

const TITLE_GENERATION_MODEL = "google/gemini-2.5-flash-lite-preview-09-2025";

/**
 * Generates a concise title (2-5 words) based on the user's first message and AI's response.
 * This mimics ChatGPT/Claude behavior where new chats are auto-titled.
 */
export async function generateChatTitle(
  userMessage: string,
  aiResponse: string,
  model: string = TITLE_GENERATION_MODEL
): Promise<string> {
  const prompt = `Based on this conversation, create a very short, concise title (2-5 words max) that captures the main topic. Be brief and specific.

User's first question: "${userMessage.slice(0, 500)}"

AI's response summary: "${aiResponse.slice(0, 500)}"

Rules:
- 2-5 words maximum
- No quotes, no punctuation at the end
- Capture the essence of what's being asked
- Be specific but concise
- Examples: "React Performance Tips", "Python File Handling", "CSS Grid Layout", "API Authentication"

Title:`;

  try {
    const response = await fetch("/api/openrouter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }],
        model,
        temperature: 0.3,
        max_tokens: 20,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate title");
    }

    const data = await response.json();
    let title = data.content?.trim() || data.message?.content?.trim() || "";
    
    // Clean up the title
    title = title
      .replace(/^["']|["']$/g, "") // Remove quotes
      .replace(/\.$/, "") // Remove trailing period
      .trim();
    
    // If title is too long, truncate
    const words = title.split(/\s+/);
    if (words.length > 6) {
      title = words.slice(0, 5).join(" ");
    }
    
    // Fallback if empty or too short
    if (!title || title.length < 3) {
      return generateFallbackTitle(userMessage);
    }
    
    return title;
  } catch (error) {
    console.error("Title generation error:", error);
    return generateFallbackTitle(userMessage);
  }
}

/**
 * Generates a fallback title based on the first few words of the user's message
 */
function generateFallbackTitle(userMessage: string): string {
  const words = userMessage.trim().split(/\s+/).slice(0, 4);
  let title = words.join(" ");
  
  // Capitalize first letter
  title = title.charAt(0).toUpperCase() + title.slice(1);
  
  // Add ellipsis if truncated
  if (userMessage.split(/\s+/).length > 4) {
    title += "...";
  }
  
  return title || "New Chat";
}
