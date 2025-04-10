export interface TranscriptEntry {
  start: number;
  text: string;
}

export function formatTimestamp(seconds: number): string {
  const pad = (num: number) => num.toString().padStart(2, "0");

  if (seconds < 60) {
    return `[${seconds.toFixed(2)}]`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `[${pad(minutes)}:${pad(secs)}]`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `[${pad(hours)}:${pad(minutes)}:${pad(secs)}]`;
  }
}

export function parseTranscript(
  transcript: string | TranscriptEntry[]
): TranscriptEntry[] {
  if (Array.isArray(transcript)) return transcript;

  try {
    const lines = transcript.trim().split("\n");

    return lines.map((line) => {
      const match = line.match(/^\[(\d+\.\d+)\]\s+(.*?)\s*$/);
      if (!match) throw new Error("Invalid transcript format");
      return {
        start: parseFloat(match[1]),
        text: match[2].trim(),
      };
    });
  } catch (error) {
    console.error("Failed to parse transcript:", error);
    return [];
  }
}
