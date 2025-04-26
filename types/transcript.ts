import type { TranscriptEntry } from "../utils/transcriptUtils";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
