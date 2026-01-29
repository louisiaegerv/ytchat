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
import { models } from "@/utils/openrouter";
import type { TranscriptEntry } from "@/app/capture/page";
import { createClient } from "@/utils/supabase/client";
import { generateSummary } from "@/utils/summaryGenerator";

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

  const handleSummarize = async () => {
    setLoadingSummary(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData?.user) {
        throw new Error("Could not get current user for saving summary.");
      }
      const userId = userData.user.id;

      const summaryContent = await generateSummary(
        transcript,
        model,
        videoId,
        userId,
      );
      setAiSummary(summaryContent);
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
