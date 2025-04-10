import type { TranscriptEntry } from "../utils/transcriptUtils";

export interface TranscriptDisplayProps {
  transcript?: string | TranscriptEntry[];
  videoId?: string;
  onLoadingComplete?: () => void;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
