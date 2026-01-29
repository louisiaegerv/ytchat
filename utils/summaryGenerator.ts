import type { TranscriptEntry } from "@/app/capture/page";
import { openRouterChat, type OpenRouterModel } from "@/utils/openrouter";
import { createClient } from "@/utils/supabase/client";

/**
 * Generate an AI summary for a video transcript.
 * This function is used by both manual summary generation and auto-summary feature.
 */
export async function generateSummary(
  transcript: TranscriptEntry[],
  model: string,
  videoId: string,
  userId: string,
): Promise<string> {
  const messages = [
    {
      role: "system",
      content:
        "Act as a professional youtube video summarizer. I will provide you with the transcript of a YouTube video. Your task is to generate a 1000-word, structured summary by following these guidelines:\n\n**Structure:**\n- **Overview:** Start with a creative title for the summary, followed by a 1-2 sentence overview of the video's primary topic and purpose.\n- **Key Points:** Identify 3-5 main sections or arguments. For each, include:\n  - A brief description of the idea.\n  - Timestamps (e.g., 05:30-10:00) if available.\n  - Supporting examples/data and quotes.\n- Include Relevant emojis for each header and key point for visual engagement.\n- **Conclusion:** Summarize the video's closing message, call-to-action, or final takeaways.\n\n**Markdown Formatting Requirements:**\n- Use proper Markdown syntax for structure and readability\n- Main title: `## Title`\n- Section headers: `### Section Title`\n- Paragraphs: Standard text with a blank line between paragraphs\n- Lists: `- Item` (unordered list with hyphens)\n- Bold text: `**important**`\n- Ensure proper hierarchy: ## > ### > paragraphs/lists\n- Use blank lines between elements for better readability\n\n**Style:**\n- Use clear, neutral language. Avoid jargon unless the video is technical.\n- Keep paragraphs short and scannable.\n- Highlight key terms or phrases in `**bold**` using Markdown syntax.\n\n**Exclusions:**\n- Omit sponsor ads, intros/outros, or repetitive content unless critical.\n- Avoid subjective opinions or analysis—focus on factual content from the transcript.\n- Do not include any output unrelated to the summary, only the summary content. Also do not include ```markdown at the beginning or end of the output. I'm inserting your content directly into a Markdown renderer.",
    },
    {
      role: "user",
      content: (() => {
        return transcript.map((t) => t.text).join(" ");
      })(),
    },
  ];

  // Generate summary using OpenRouter
  const response = await openRouterChat(model as OpenRouterModel, messages);
  const summaryContent = response.content || "";

  // Save summary to database
  try {
    const supabase = createClient();
    const { error } = await supabase.from("summaries").insert([
      {
        video_id: videoId,
        content: summaryContent,
        user_id: userId,
      },
    ]);

    if (error) {
      console.error("Error saving summary to database:", error);
      throw new Error("Could not save summary to database");
    }
  } catch (error) {
    console.error("Error saving summary:", error);
    throw error;
  }

  return summaryContent;
}
