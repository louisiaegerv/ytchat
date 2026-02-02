// Dialog modal for summary expansion
import { BlinkBlur } from "react-loading-indicators";
import { SummaryButton } from "@/components/summary-button";
import { useVideoContext } from "@/components/VideoContext";
import type { TranscriptEntry } from "@/utils/transcriptUtils";
import Markdown from "markdown-to-jsx";
import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Maximize2,
  Minimize2,
  Sparkles,
  Lightbulb,
  Type,
  Focus,
  Printer,
  Copy,
  Check,
  X,
  AlignLeft,
  AlignJustify,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AISummaryPanelProps {
  loadingSummary: boolean;
  parsedTranscript: TranscriptEntry[];
  model: string;
  setModel: (m: string) => void;
  setLoadingSummary: (b: boolean) => void;
  videoId?: string;
}

// Text size configurations
const TEXT_SIZES = {
  small: { prose: "prose-sm", label: "Small", scale: 0.875 },
  normal: { prose: "prose-base", label: "Normal", scale: 1 },
  large: { prose: "prose-lg", label: "Large", scale: 1.125 },
  xl: { prose: "prose-xl", label: "Extra Large", scale: 1.25 },
};

type TextSize = keyof typeof TEXT_SIZES;

export function AISummaryPanel({
  loadingSummary,
  parsedTranscript,
  model,
  setModel,
  setLoadingSummary,
}: AISummaryPanelProps) {
  const { videoUuid, aiSummary, setAiSummary } = useVideoContext();
  const videoId = videoUuid || "";

  // Reader preferences state
  const [textSize, setTextSize] = useState<TextSize>("normal");
  const [lineHeight, setLineHeight] = useState<"tight" | "normal" | "relaxed">(
    "relaxed",
  );
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isFullWidth, setIsFullWidth] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile and set focus mode as default
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto-enable focus mode on mobile when dialog opens
      if (mobile && isOpen) {
        setIsFocusMode(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [isOpen]);

  useEffect(() => {
    console.log("AI Summary:", aiSummary?.substring(0, 50));
  }, [aiSummary]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // ESC to exit focus mode
      if (e.key === "Escape" && isFocusMode) {
        setIsFocusMode(false);
        return;
      }

      // Cmd/Ctrl + +/- for text size
      if ((e.metaKey || e.ctrlKey) && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        setTextSize((prev) => {
          const sizes: TextSize[] = ["small", "normal", "large", "xl"];
          const idx = sizes.indexOf(prev);
          return sizes[Math.min(idx + 1, sizes.length - 1)];
        });
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "-") {
        e.preventDefault();
        setTextSize((prev) => {
          const sizes: TextSize[] = ["small", "normal", "large", "xl"];
          const idx = sizes.indexOf(prev);
          return sizes[Math.max(idx - 1, 0)];
        });
      }

      // F for focus mode
      if (
        e.key === "f" &&
        !e.metaKey &&
        !e.ctrlKey &&
        e.target === document.body
      ) {
        setIsFocusMode((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isFocusMode]);

  const handleCopy = useCallback(async () => {
    if (!aiSummary) return;
    await navigator.clipboard.writeText(aiSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [aiSummary]);

  const handlePrint = useCallback(() => {
    if (!aiSummary) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>AI Summary</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              line-height: 1.6;
              max-width: 65ch;
              margin: 0 auto;
              padding: 2rem;
              color: #333;
            }
            h1, h2, h3 { color: #111; }
            code { background: #f4f4f4; padding: 0.2em 0.4em; border-radius: 3px; }
            pre { background: #f4f4f4; padding: 1em; overflow-x: auto; border-radius: 6px; }
            blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 1em; color: #666; }
          </style>
        </head>
        <body>
          ${aiSummary}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }, [aiSummary]);

  // Extract key points from summary
  const extractKeyPoints = (summary: string): string[] => {
    const lines = summary
      .split(/\n|(?<=[.!?])\s+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 20 && line.length < 200)
      .slice(0, 4);

    if (lines.length === 0) {
      return [
        "Key insight extracted from the video content",
        "Important concept discussed in the transcript",
        "Notable point made by the speaker",
        "Summary conclusion or takeaway",
      ];
    }
    return lines;
  };

  // Reader toolbar component
  const ReaderToolbar = ({ inDialog = false }: { inDialog?: boolean }) => (
    <div
      className={cn(
        "flex items-center gap-1 p-2 rounded-xl transition-all",
        inDialog
          ? "bg-black/40 backdrop-blur-xl border border-white/10"
          : "bg-white/5 border border-white/10",
      )}
    >
      {/* Text Size Controls */}
      <div className="flex items-center gap-0.5">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-gray-400 hover:text-white"
                onClick={() => {
                  const sizes: TextSize[] = ["small", "normal", "large", "xl"];
                  const idx = sizes.indexOf(textSize);
                  setTextSize(sizes[Math.max(idx - 1, 0)]);
                }}
                disabled={textSize === "small"}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Smaller Text</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <span className="text-xs text-gray-400 min-w-[3rem] text-center">
          {TEXT_SIZES[textSize].label}
        </span>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-gray-400 hover:text-white"
                onClick={() => {
                  const sizes: TextSize[] = ["small", "normal", "large", "xl"];
                  const idx = sizes.indexOf(textSize);
                  setTextSize(sizes[Math.min(idx + 1, sizes.length - 1)]);
                }}
                disabled={textSize === "xl"}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Larger Text</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Line Height */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-white"
              onClick={() =>
                setLineHeight((prev) =>
                  prev === "tight"
                    ? "normal"
                    : prev === "normal"
                      ? "relaxed"
                      : "tight",
                )
              }
            >
              {lineHeight === "tight" ? (
                <AlignLeft className="w-4 h-4" />
              ) : (
                <AlignJustify className="w-4 h-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Spacing: {lineHeight}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="w-px h-4 bg-white/10 mx-1" />

      {/* Focus Mode */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                isFocusMode
                  ? "text-blue-400"
                  : "text-gray-400 hover:text-white",
              )}
              onClick={() => setIsFocusMode(!isFocusMode)}
            >
              <Focus className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Focus Mode</p>
            <p className="text-xs text-gray-400">Press F</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Full Width */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                isFullWidth
                  ? "text-blue-400"
                  : "text-gray-400 hover:text-white",
              )}
              onClick={() => setIsFullWidth(!isFullWidth)}
            >
              {isFullWidth ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isFullWidth ? "Narrow" : "Full Width"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="w-px h-4 bg-white/10 mx-1" />

      {/* Copy */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-white"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{copied ? "Copied!" : "Copy Summary"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Print */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-white"
              onClick={handlePrint}
            >
              <Printer className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Print Summary</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );

  return (
    <>
      {aiSummary ? (
        <div className="space-y-6">
          {/* Summary Content */}
          <div className="relative">
            {/* Expand Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button
                  className="absolute top-0 right-0 z-10 bg-white/5 hover:bg-white/10 border border-white/10"
                  size="sm"
                  variant="ghost"
                  aria-label="Expand summary"
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </DialogTrigger>

              <DialogContent
                className={cn(
                  "overflow-hidden p-0 gap-0 transition-all duration-300",
                  isFocusMode
                    ? "!fixed !inset-0 !w-screen !h-screen !max-w-none !rounded-none !border-0 !translate-x-0 !translate-y-0 [&>button]:top-[calc(1rem+env(safe-area-inset-top))]"
                    : isFullWidth
                      ? "max-w-6xl w-[95vw] max-h-[90vh]"
                      : "max-w-3xl w-[90vw] max-h-[85vh]",
                  "glass-strong border-white/10",
                )}
              >
                <DialogTitle></DialogTitle>
                {/* Focus Mode Exit Button - Only show on desktop */}
                {isFocusMode && !isMobile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="fixed top-4 right-4 z-50 text-gray-400 hover:text-white bg-black/20 backdrop-blur-sm"
                    onClick={() => setIsFocusMode(false)}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Exit Focus
                  </Button>
                )}

                {/* Header - Hidden on mobile in focus mode */}
                {(!isFocusMode || !isMobile) && (
                  <DialogHeader
                    className={cn(
                      "px-6 transition-all duration-300",
                      isFocusMode
                        ? "fixed top-0 left-0 right-0 z-40 pt-16 pb-4 bg-gradient-to-b from-background to-transparent"
                        : "py-4 border-b border-white/5",
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center justify-between",
                        isFocusMode && "max-w-6xl mx-auto px-6",
                      )}
                    >
                      <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-violet-400" />
                        AI Summary
                      </DialogTitle>
                      {!isFocusMode && <ReaderToolbar inDialog />}
                    </div>
                  </DialogHeader>
                )}

                {/* Content */}
                <div
                  className={cn(
                    "overflow-y-auto transition-all duration-300",
                    isFocusMode
                      ? isMobile
                        ? "pt-4 pb-24 px-4 h-screen"
                        : "pt-32 pb-24 px-8 h-screen"
                      : "px-6 py-6",
                  )}
                  style={{ scrollbarWidth: "thin" }}
                >
                  <div
                    className={cn(
                      "prose dark:prose-invert mx-auto transition-all duration-300",
                      TEXT_SIZES[textSize].prose,
                      lineHeight === "tight" && "leading-tight",
                      lineHeight === "normal" && "leading-normal",
                      lineHeight === "relaxed" && "leading-relaxed",
                      isFullWidth || isFocusMode ? "max-w-none" : "max-w-prose",
                    )}
                  >
                    <Markdown>{aiSummary}</Markdown>
                  </div>

                  {/* Key Takeaways in Dialog */}
                  {!isFocusMode && (
                    <div className="mt-8 pt-6 border-t border-white/5">
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-400" />
                        Key Takeaways
                      </h4>
                      <div className="space-y-2">
                        {extractKeyPoints(aiSummary).map((point, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                          >
                            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs font-bold text-white">
                                {i + 1}
                              </span>
                            </div>
                            <p className="text-sm text-gray-300 leading-relaxed">
                              {point}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Floating Toolbar in Focus Mode */}
                {isFocusMode && (
                  <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                    <ReaderToolbar inDialog />
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Inline Summary */}
            <div className="prose prose-invert prose-sm max-w-none pr-12">
              <Markdown>{aiSummary}</Markdown>
            </div>
          </div>

          {/* Key Takeaways Section */}
          <div className="pt-4 border-t border-white/5">
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              Key Takeaways
            </h4>
            <div className="space-y-2">
              {extractKeyPoints(aiSummary).map((point, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-white">
                      {i + 1}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {point}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : !loadingSummary ? (
        /* Empty State with CTA */
        <div className="h-full flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4 animate-pulse-glow border border-blue-500/20">
            <Sparkles className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No Summary Yet
          </h3>
          <p className="text-sm text-gray-400 max-w-xs mb-6">
            Generate an AI-powered summary to extract key insights from this
            video.
          </p>
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
      ) : (
        /* Loading State */
        <div className="h-full flex flex-col items-center justify-center py-12">
          <BlinkBlur
            color="#1d4ed8"
            size="medium"
            text="Generating summary..."
            textColor="white"
          />
          <p className="text-sm text-gray-400 mt-4">
            Our AI is analyzing the transcript
          </p>
        </div>
      )}
    </>
  );
}
