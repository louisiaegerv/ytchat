/**
 * YouTube metadata utility functions
 * Provides a shared interface for fetching YouTube video metadata
 */

export interface YouTubeMetadata {
  title: string;
  description: string;
  youtube_thumbnail: string;
  channel_id: string;
  channel_title: string;
  published_at: string;
  duration: string;
  view_count: number | null;
  like_count: number | null;
  comment_count: number | null;
  tags: string[];
}

/**
 * Fetches YouTube metadata using the API route
 * @param videoId - The YouTube video ID
 * @returns Promise<YouTubeMetadata | null> - The metadata or null if failed
 */
export async function fetchYouTubeMetadata(
  videoId: string,
): Promise<YouTubeMetadata | null> {
  try {
    const response = await fetch("/api/youtube/metadata", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ videoId }),
    });

    if (!response.ok) {
      console.error("Failed to fetch YouTube metadata:", response.statusText);
      return null;
    }

    const metadata = await response.json();
    return metadata as YouTubeMetadata;
  } catch (error) {
    console.error("Error fetching YouTube metadata:", error);
    return null;
  }
}

/**
 * Extracts YouTube video ID from various URL formats
 * @param url - The YouTube URL
 * @returns The video ID or null if invalid
 */
export function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.replace("/", "");
    }
    if (
      parsed.hostname === "www.youtube.com" ||
      parsed.hostname === "youtube.com"
    ) {
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v") ?? null;
      } else if (parsed.pathname.startsWith("/live/")) {
        return parsed.pathname.split("/").pop() ?? null;
      }
    }
    return null;
  } catch {
    return null;
  }
}
