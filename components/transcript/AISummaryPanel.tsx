// Dialog modal for summary expansion
import { BlinkBlur } from "react-loading-indicators";
import { SummaryButton } from "@/components/summary-button";
import { useVideoContext } from "@/components/VideoContext";
import type { TranscriptEntry } from "@/utils/transcriptUtils";
import Markdown from "markdown-to-jsx";
import { useEffect } from "react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Maximize2 } from "lucide-react";

interface AISummaryPanelProps {
  loadingSummary: boolean;
  parsedTranscript: TranscriptEntry[];
  model: string;
  setModel: (m: string) => void;
  setLoadingSummary: (b: boolean) => void;
  videoId?: string;
}

export function AISummaryPanel({
  loadingSummary,
  parsedTranscript,
  model,
  setModel,
  setLoadingSummary,
}: AISummaryPanelProps) {
  const { videoUuid, aiSummary, setAiSummary } = useVideoContext();
  const videoId = videoUuid || "";

  useEffect(() => {
    console.log("AI Summary:", aiSummary);
  }, [aiSummary]);

  return (
    <>
      {aiSummary && (
        <div className="relative">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                className="sticky top-0 right-0 z-[100]  m-0 bg-background hover:bg-background/80"
                size="sm"
                variant="ghost"
                aria-label="Expand summary"
                style={{ float: "right" }}
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent
              className="max-h-[80vh] w-full max-w-5xl overflow-y-auto"
              style={{ scrollbarWidth: "thin" }}
            >
              <div className="prose dark:prose-invert max-w-none">
                <Markdown>{aiSummary}</Markdown>
              </div>
            </DialogContent>
          </Dialog>
          <div className="flex-1" style={{ scrollbarWidth: "none" }}>
            <div className="prose dark:prose-invert max-w-none">
              <Markdown>{aiSummary}</Markdown>
            </div>
          </div>
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
              videoId={videoId}
            />
          </div>
        </div>
      )}
      {!aiSummary && loadingSummary && (
        <div className="h-full flex flex-col items-center justify-center gap-4 mt-4">
          <BlinkBlur
            color="#1d4ed8"
            size="medium"
            text="Loading..."
            textColor="white"
          />
        </div>
      )}
    </>
  );
}
