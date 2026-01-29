import React, { createContext, useContext, useState, ReactNode } from "react";
import type { TranscriptEntry } from "@/app/capture/page";

interface VideoContextType {
  videoUuid: string | null;
  setVideoUuid: (id: string | null) => void;
  youtubeUrl: string | null;
  setYoutubeUrl: (url: string | null) => void;
  youtubeId: string | null;
  setYoutubeId: (id: string | null) => void;
  transcript: TranscriptEntry[] | null;
  setTranscript: (t: TranscriptEntry[] | null) => void;
  aiSummary: string | null;
  setAiSummary: (s: string | null) => void;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export function VideoProvider({ children }: { children: ReactNode }) {
  const [videoUuid, setVideoUuid] = useState<string | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState<string | null>(null);
  const [youtubeId, setYoutubeId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[] | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  return (
    <VideoContext.Provider
      value={{
        videoUuid,
        setVideoUuid,
        youtubeUrl,
        setYoutubeUrl,
        youtubeId,
        setYoutubeId,
        transcript,
        setTranscript,
        aiSummary,
        setAiSummary,
      }}
    >
      {children}
    </VideoContext.Provider>
  );
}

export function useVideoContext() {
  const ctx = useContext(VideoContext);
  if (!ctx) {
    throw new Error("useVideoContext must be used within a VideoProvider");
  }
  return ctx;
}
