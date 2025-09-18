import React, { useEffect, useRef } from "react";
import { formatTimestamp } from "@/utils/transcriptUtils";
import type { TranscriptEntry } from "@/utils/transcriptUtils";

interface TranscriptTextProps {
  entries: TranscriptEntry[];
  videoId: string;
  searchQuery: string;
  searchResults: { entryIndex: number; startIndex: number; endIndex: number }[];
  currentMatchIndex: number;
}

export function TranscriptText({
  entries,
  videoId,
  searchQuery,
  searchResults,
  currentMatchIndex,
}: TranscriptTextProps) {
  const matchRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (currentMatchIndex !== -1 && matchRefs.current[currentMatchIndex]) {
      matchRefs.current[currentMatchIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentMatchIndex, searchResults]); // Depend on searchResults to re-run when search changes

  // Reset refs when search results change
  useEffect(() => {
    matchRefs.current = matchRefs.current.slice(0, searchResults.length);
  }, [searchResults]);

  return (
    <div className="prose dark:prose-invert">
      {entries.map((entry, entryIndex) => {
        const text = entry.text;
        const entryMatches = searchResults.filter(
          (result) => result.entryIndex === entryIndex
        );
        let lastIndex = 0;
        const parts: React.ReactNode[] = [];
        let matchCounter = 0; // Counter for matches within this entry

        entryMatches.forEach((match) => {
          // Add text before the match
          if (match.startIndex > lastIndex) {
            parts.push(text.substring(lastIndex, match.startIndex));
          }

          // Add the highlighted match
          const isCurrentMatch =
            searchResults[currentMatchIndex]?.entryIndex === entryIndex &&
            searchResults[currentMatchIndex]?.startIndex === match.startIndex;

          parts.push(
            <span
              key={`${entryIndex}-${match.startIndex}`}
              ref={(el) => {
                // Find the global index of this match in searchResults
                const globalMatchIndex = searchResults.findIndex(
                  (res) =>
                    res.entryIndex === entryIndex &&
                    res.startIndex === match.startIndex
                );
                if (globalMatchIndex !== -1) {
                  matchRefs.current[globalMatchIndex] = el;
                }
              }}
              className={`px-1 rounded ${
                isCurrentMatch ? "bg-orange-300" : "bg-yellow-300"
              }`}
            >
              {text.substring(match.startIndex, match.endIndex)}
            </span>
          );

          lastIndex = match.endIndex;
          matchCounter++;
        });

        // Add remaining text after the last match
        if (lastIndex < text.length) {
          parts.push(text.substring(lastIndex));
        }

        return (
          <p key={entryIndex} className="mb-2 text-lg">
            <a
              href={`https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(entry.start)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700 hover:underline"
            >
              {formatTimestamp(entry.start)}
            </a>{" "}
            {parts}
          </p>
        );
      })}
    </div>
  );
}
