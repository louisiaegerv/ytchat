import React from "react";
import { BlinkBlur } from "react-loading-indicators";
import { SummaryButton } from "@/components/summary-button";
import type { TranscriptEntry } from "@/utils/transcriptUtils";

interface AISummaryPanelProps {
  aiSummary: string;
  loadingSummary: boolean;
  parsedTranscript: TranscriptEntry[];
  model: string;
  setAiSummary: (s: string) => void;
  setModel: (m: string) => void;
  setLoadingSummary: (b: boolean) => void;
}

export function AISummaryPanel({
  aiSummary,
  loadingSummary,
  parsedTranscript,
  model,
  setAiSummary,
  setModel,
  setLoadingSummary,
}: AISummaryPanelProps) {
  return (
    <>
      {aiSummary && (
        <div
          className="flex-1 overflow-y-auto"
          style={{ scrollbarWidth: "none" }}
        >
          <div
            className="prose dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: aiSummary }}
          />
        </div>
      )}
      {!aiSummary && !loadingSummary && (
        <div className="h-full flex flex-col items-center justify-center gap-4 mt-4">
          <h1 className="text-2xl">No Summary Generated</h1>
          <p>Generate a new one below.</p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <SummaryButton
              transcript={parsedTranscript}
              setAiSummary={setAiSummary}
              model={model}
              setModel={setModel}
              setLoadingSummary={setLoadingSummary}
              loading={loadingSummary}
            />
          </div>
        </div>
      )}
      {!aiSummary && loadingSummary && (
        <div className="h-full flex flex-col items-center justify-center gap-4 mt-4">
          <BlinkBlur
            color="#32cd32"
            size="medium"
            text="Loading..."
            textColor="white"
          />
        </div>
      )}
    </>
  );
}
