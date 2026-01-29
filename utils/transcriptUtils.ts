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
  transcript: string | TranscriptEntry[],
): TranscriptEntry[] {
  if (Array.isArray(transcript)) return transcript;

  try {
    const lines = transcript.trim().split("\n");
    const result: TranscriptEntry[] = [];

    for (const line of lines) {
      // Skip empty lines
      if (!line.trim()) continue;

      // Match various timestamp formats:
      // [0.08] - just seconds with decimal
      // [0:00.08] - minutes:seconds
      // [0:00:00.08] - hours:minutes:seconds
      const match =
        line.match(/^\[(\d+):?(\d+)?:(\d+\.\d+)\]\s+(.*?)\s*$/) ||
        line.match(/^\[(\d+\.\d+)\]\s+(.*?)\s*$/);

      if (!match) {
        console.warn("Could not parse line:", line);
        continue;
      }

      let start: number;

      if (match[4] !== undefined) {
        // Format: [0:00:00.08] or [0:00.08]
        // match[1] = hours or minutes
        // match[2] = minutes or undefined
        // match[3] = seconds
        // match[4] = text
        if (match[2] !== undefined) {
          // Format: [0:00:00.08] (hours:minutes:seconds)
          const hours = parseInt(match[1], 10);
          const minutes = parseInt(match[2], 10);
          const seconds = parseFloat(match[3]);
          start = hours * 3600 + minutes * 60 + seconds;
        } else {
          // Format: [0:00.08] (minutes:seconds)
          const minutes = parseInt(match[1], 10);
          const seconds = parseFloat(match[3]);
          start = minutes * 60 + seconds;
        }
      } else {
        // Format: [0.08] (just seconds)
        // match[1] = seconds
        // match[2] = text
        start = parseFloat(match[1]);
      }

      result.push({
        start,
        text: match[match.length - 1].trim(),
      });
    }

    return result;
  } catch (error) {
    console.error("Failed to parse transcript:", error);
    return [];
  }
}
