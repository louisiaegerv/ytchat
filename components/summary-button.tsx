"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";
import {
  openRouterChat,
  type OpenRouterModel,
  models,
} from "@/utils/openrouter";
import type { TranscriptEntry } from "@/app/explore/page";
import { createClient } from "@/utils/supabase/client";

/**
 * videoId: The UUID of the video row in the database (not the YouTube video ID).
 */
interface SummaryButtonProps {
  transcript: TranscriptEntry[];
  setAiSummary: (summary: string) => void;
  model: string;
  setModel: (model: string) => void;
  setLoadingSummary: (loading: boolean) => void;
  loading?: boolean;
  videoId: string; // UUID of the video row
}

export function SummaryButton({
  transcript,
  setAiSummary,
  model,
  setModel,
  setLoadingSummary,
  loading,
  videoId,
}: SummaryButtonProps) {
  const [error, setError] = useState<string | null>(null);

  const messages = [
    {
      role: "system",
      content:
        "Act as a professional youtube video summarizer. I will provide you with the transcript of a YouTube video. Your task is to generate a 1000-word, structured summary by following these guidelines:\n\n**Structure:**\n- **Overview:** Start with a creative title for the summary, followed by a 1-2 sentence overview of the video's primary topic and purpose.\n- **Key Points:** Identify 3-5 main sections or arguments. For each, include:\n  - A brief description of the idea.\n  - Timestamps (e.g., 05:30-10:00) if available.\n  - Supporting examples/data and quotes.\n- Include Relevant emojis for each header and key point for visual engagement.\n- **Conclusion:** Summarize the video's closing message, call-to-action, or final takeaways.\n\n**Markdown Formatting Requirements:**\n- Use proper Markdown syntax for structure and readability\n- Main title: `## Title`\n- Section headers: `### Section Title`\n- Paragraphs: Standard text with a blank line between paragraphs\n- Lists: `- Item` (unordered list with hyphens)\n- Bold text: `**important**`\n- Ensure proper hierarchy: ## > ### > paragraphs/lists\n- Use blank lines between elements for better readability\n\n**Style:**\n- Use clear, neutral language. Avoid jargon unless the video is technical.\n- Keep paragraphs short and scannable.\n- Highlight key terms or phrases in `**bold**` using Markdown syntax.\n\n**Exclusions:**\n- Omit sponsor ads, intros/outros, or repetitive content unless critical.\n- Avoid subjective opinions or analysis—focus on factual content from the transcript.\n- Do not include any output unrelated to the summary, only the summary content. Also do not include ```markdown at the beginning or end of the output. I'm inserting your content directly into a Markdown renderer.",
    },
    {
      role: "user",
      content: transcript.map((t) => t.text).join(" "),
    },
  ];

  const handleSummarize = async () => {
    setLoadingSummary(true);
    setError(null);
    try {
      const response = await openRouterChat(model as OpenRouterModel, messages);

      setAiSummary(response.content || "");

      // --- Supabase auto-save logic for summary ---
      try {
        const supabase = createClient();
        // Get current user (for RLS)
        const { data: userData, error: userError } =
          await supabase.auth.getUser();
        if (userError || !userData?.user) {
          throw new Error("Could not get current user for saving summary.");
        }
        const userId = userData.user.id; // Get the user ID

        // Insert summary including user_id
        const { error: summaryError } = await supabase
          .from("summaries")
          .insert([
            {
              video_id: videoId,
              content: response.content || "",
              user_id: userId, // Add the user ID here
            },
          ]);
        if (summaryError) {
          throw new Error("Could not save summary.");
        }
      } catch (saveError) {
        setError("Summary generated, but failed to auto-save to Supabase.");
        console.error(saveError);
      }
      // --- End Supabase auto-save logic ---
    } catch (error) {
      setError("Summary error: " + (error as Error).message);
      console.error("Summary error:", error);
    } finally {
      setLoadingSummary(false);
    }
  };

  return (
    <div className="flex gap-4">
      <Select
        value={model}
        onValueChange={(value: string) => setModel(value)}
        disabled={loading}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select model" />
        </SelectTrigger>
        <SelectContent>
          {models.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              {model.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex items-center gap-2">
        <Button onClick={handleSummarize} disabled={loading}>
          {loading ? "Generating..." : "Summarize with AI"}
        </Button>
      </div>
      {error && <div className="text-red-500 text-xs ml-2">{error}</div>}
    </div>
  );
}
