"use client";

import { Card, CardContent } from "@/components/ui/card";
import { 
  ExternalLink, 
  Eye, 
  ThumbsUp, 
  MessageCircle, 
  Clock,
  Play
} from "lucide-react";
import { formatDuration, formatNumber, formatDate } from "@/lib/utils";

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
    <Card className="h-full flex flex-col glass-strong rounded-3xl border-white/10 overflow-hidden card-lift">
      <CardContent className="p-0">
        {error && (
          <div className="p-4 m-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        
        {youtubeId && (
          <div className="relative">
            {/* Video Embed with Glow Effect */}
            <div className="relative p-4">
              {/* Glow Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
              
              {/* YouTube Embed Container */}
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 group">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title="YouTube video player"
                  className="absolute top-0 left-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
                
                {/* Subtle gradient overlay for depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
                
                {/* Hover Glow Overlay */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 pointer-events-none" />
              </div>
            </div>

            {/* Video Info Section */}
            {videoMeta && (
              <div className="p-6 pt-2 space-y-4">
                {/* Title */}
                <h3 className="text-xl font-bold text-white leading-tight hover:text-gradient transition-all cursor-pointer">
                  {videoMeta.title}
                </h3>

                {/* Channel & Meta Row */}
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Channel Name from joined channels table */}
                  {videoMeta.channels?.title && videoMeta.channel_id && (
                    <a
                      href={`https://www.youtube.com/channel/${videoMeta.channel_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/30 transition-colors"
                    >
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                      <span className="text-sm font-medium text-blue-400">
                        {videoMeta.channels.title}
                      </span>
                    </a>
                  )}
                  {videoMeta.channels?.title && !videoMeta.channel_id && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                      <span className="text-sm font-medium text-blue-400">
                        {videoMeta.channels.title}
                      </span>
                    </div>
                  )}
                  
                  {videoMeta.published_at && (
                    <span className="text-xs text-muted-foreground">
                      {formatDate(videoMeta.published_at)}
                    </span>
                  )}
                </div>

                {/* Stats Pills */}
                <div className="flex flex-wrap gap-2">
                  {videoMeta.view_count !== null && videoMeta.view_count !== undefined && (
                    <div className="stat-pill">
                      <Eye className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-sm text-gray-300">
                        {formatNumber(videoMeta.view_count)}
                      </span>
                    </div>
                  )}
                  {videoMeta.like_count !== null && videoMeta.like_count !== undefined && (
                    <div className="stat-pill">
                      <ThumbsUp className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-sm text-gray-300">
                        {formatNumber(videoMeta.like_count)}
                      </span>
                    </div>
                  )}
                  {videoMeta.comment_count !== null && videoMeta.comment_count !== undefined && (
                    <div className="stat-pill">
                      <MessageCircle className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-sm text-gray-300">
                        {formatNumber(videoMeta.comment_count)}
                      </span>
                    </div>
                  )}
                  {videoMeta.duration && (
                    <div className="stat-pill">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-sm text-gray-300">
                        {formatDuration(videoMeta.duration)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Description with Fade */}
                {videoMeta.description && (
                  <div className="relative">
                    <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed">
                      {videoMeta.description}
                    </p>
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card/75 to-transparent pointer-events-none" />
                  </div>
                )}

                {/* Tags */}
                {videoMeta.tags && Array.isArray(videoMeta.tags) && videoMeta.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {videoMeta.tags.slice(0, 5).map((tag: string) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 text-xs font-medium rounded-full bg-white/5 text-gray-400 border border-white/5 hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/30 transition-all cursor-pointer"
                      >
                        #{tag}
                      </span>
                    ))}
                    {videoMeta.tags.length > 5 && (
                      <span className="px-2.5 py-1 text-xs text-muted-foreground">
                        +{videoMeta.tags.length - 5} more
                      </span>
                    )}
                  </div>
                )}

                {/* Watch on YouTube Link */}
                <a
                  href={`https://www.youtube.com/watch?v=${youtubeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors group/link pt-2"
                >
                  <ExternalLink className="w-4 h-4 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                  Watch on YouTube
                  <span className="text-gray-500 text-xs">(content © respective owners)</span>
                </a>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
