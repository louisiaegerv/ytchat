import React from "react";
import { formatTimestamp } from "@/utils/transcriptUtils";
import type { TranscriptEntry } from "@/utils/transcriptUtils";

interface TranscriptTextProps {
  entries: TranscriptEntry[];
  videoId: string;
}

export function TranscriptText({ entries, videoId }: TranscriptTextProps) {
  return (
    <div className="prose dark:prose-invert">
      {entries.map((entry, i) => (
        <p key={i} className="mb-2 text-lg">
          <a
            href={`https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(entry.start)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 hover:underline"
          >
            {formatTimestamp(entry.start)}
          </a>{" "}
          {entry.text}
        </p>
      ))}
    </div>
  );
}
