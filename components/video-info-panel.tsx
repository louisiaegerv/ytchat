"use client";

import { Card, CardContent } from "@/components/ui/card";

/**
 * Normalize any YouTube URL to the canonical long format:
 *   https://www.youtube.com/watch?v=VIDEO_ID
 * Removes all query parameters except v.
 */
const normalizeYouTubeUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url.trim());
    let videoId: string | null = null;

    // Short format: youtu.be/VIDEO_ID
    if (parsed.hostname === "youtu.be") {
      videoId = parsed.pathname.replace("/", "");
    }
    // Long format: youtube.com/watch?v=VIDEO_ID
    else if (
      parsed.hostname === "www.youtube.com" ||
      parsed.hostname === "youtube.com"
    ) {
      if (parsed.pathname === "/watch") {
        videoId = parsed.searchParams.get("v");
      }
    }
    if (!videoId) return null;
    return `https://www.youtube.com/watch?v=${videoId}`;
  } catch {
    return null;
  }
};

// Helper function to extract YouTube video ID from different URL formats
const extractYouTubeVideoId = (url: string): string | null => {
  // Use normalization logic to extract video ID
  try {
    const parsed = new URL(url.trim());
    // Short format
    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.replace("/", "");
    }
    // Long format
    if (
      parsed.hostname === "www.youtube.com" ||
      parsed.hostname === "youtube.com"
    ) {
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v");
      }
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * VideoInfoPanel: only displays video info and error
 */
export interface VideoInfoPanelProps {
  url: string;
  isLoading: boolean;
  error: string;
  lastUrl: string;
  videoMeta: any;
  youtubeId: string | null;
}

export function VideoInfoPanel({
  url,
  isLoading,
  error,
  lastUrl,
  videoMeta,
  youtubeId,
}: VideoInfoPanelProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardContent>
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        {youtubeId && (
          <div className="mt-4">
            <img
              src={
                videoMeta?.youtube_thumbnail ||
                `https://img.youtube.com/vi/${youtubeId}/0.jpg`
              }
              alt="YouTube Video Thumbnail"
              className="w-full rounded-md shadow-sm"
              referrerPolicy="no-referrer"
            />
            {videoMeta && (
              <div className="mt-2 space-y-1">
                <h3 className="font-semibold text-lg">{videoMeta.title}</h3>
                <div className="text-sm text-gray-600">
                  Channel:{" "}
                  {videoMeta.channel_title ? (
                    <span>{videoMeta.channel_title}</span>
                  ) : null}
                </div>
                {videoMeta.published_at && (
                  <div className="text-xs text-gray-500">
                    Published:{" "}
                    {new Date(videoMeta.published_at).toLocaleDateString()}
                  </div>
                )}
                {videoMeta.duration && (
                  <div className="text-xs text-gray-500">
                    Duration: {videoMeta.duration}
                  </div>
                )}
                {videoMeta.description && (
                  <div className="text-xs text-gray-700 line-clamp-3">
                    {videoMeta.description}
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mt-1">
                  {videoMeta.tags &&
                    Array.isArray(videoMeta.tags) &&
                    videoMeta.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="inline-block bg-gray-200 text-gray-700 rounded px-2 py-0.5 text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                </div>
                <div className="flex gap-4 text-xs text-gray-500 mt-1">
                  {videoMeta.view_count !== null && (
                    <span>Views: {videoMeta.view_count}</span>
                  )}
                  {videoMeta.like_count !== null && (
                    <span>Likes: {videoMeta.like_count}</span>
                  )}
                  {videoMeta.comment_count !== null && (
                    <span>Comments: {videoMeta.comment_count}</span>
                  )}
                </div>
                <div className="mt-2">
                  <a
                    href={`https://www.youtube.com/watch?v=${youtubeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline text-xs"
                  >
                    Watch on YouTube
                  </a>
                  <span className="text-xs text-gray-400 ml-2">
                    (YouTube content &copy; respective owners)
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
