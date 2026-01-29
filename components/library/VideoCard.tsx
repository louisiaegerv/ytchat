import { Card } from "@/components/ui";
import Link from "next/link";
import {
  Eye,
  ThumbsUp,
  MessageCircle,
  Clock,
  Calendar,
  MessageSquare,
  Sparkles,
  Youtube,
  Check,
} from "lucide-react";
import { useState } from "react";
import type { VideoWithFlags } from "@/types/library";
import { formatNumberShort, cn } from "@/lib/utils";

interface VideoCardProps {
  video: VideoWithFlags;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string, event?: React.MouseEvent | React.TouchEvent) => void;
  setIsSelectionMode?: (value: boolean) => void;
  viewMode?: "list" | "grid";
}

function formatDuration(duration?: number | string | null) {
  if (!duration) return "";
  if (typeof duration === "string") {
    // If already in "Xm Ys" format, return as-is
    if (/^\d+m \d{1,2}s$/.test(duration.trim())) {
      return duration;
    }
    // If it's a string number, parse as seconds
    const n = Number(duration);
    if (Number.isFinite(n) && n > 0) {
      const mins = Math.floor(n / 60);
      const secs = Math.floor(n % 60);
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    }
    return "";
  }
  if (
    typeof duration === "number" &&
    Number.isFinite(duration) &&
    duration > 0
  ) {
    const mins = Math.floor(duration / 60);
    const secs = Math.floor(duration % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }
  return "";
}

function formatDateAgo(dateString?: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays >= 1) {
    if (diffDays < 30) return `${diffDays}d`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo`;
    return `${Math.floor(diffDays / 365)}yr`;
  } else if (diffHours >= 1) {
    return `${diffHours}h`;
  } else if (diffMinutes >= 1) {
    return `${diffMinutes}m`;
  } else {
    return `${diffSeconds}s`;
  }
}

// Bulk selection support added
export default function VideoCard({
  video,
  isSelectionMode = false,
  isSelected = false,
  onSelect,
  setIsSelectionMode,
  viewMode = "grid",
}: VideoCardProps) {
  const [showFullDescription, setShowFullDescription] = useState(false);

  const toggleDescription = () => setShowFullDescription((prev) => !prev);

  // Prevent text selection on shift-click when in selection mode
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isSelectionMode && e.shiftKey) {
      e.preventDefault();
    }
  };

  // Handle click for selection or navigation
  const handleCardClick = (e: React.MouseEvent) => {
    // Check if Ctrl/Cmd key is pressed OR if already in selection mode
    if (onSelect && (e.ctrlKey || e.metaKey || isSelectionMode)) {
      e.preventDefault(); // Prevent default navigation if Ctrl/Cmd is pressed or in selection mode
      onSelect(video.id, e);
    }
    // If not in selection mode and Ctrl/Cmd not pressed, allow navigation (Link handles it)
  };

  // Handle checkbox click (prevent navigation)
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) onSelect(video.id, e);
  };

  if (viewMode === "list") {
    return (
      <Card
        className={cn(
          "flex flex-row  rounded-3xl overflow-hidden transition-shadow group-hover:shadow-lg relative h-[200px] !max-w-none",
          isSelectionMode && isSelected
            ? "ring-2 ring-sidebar-primary ring-offset-4 ring-offset-background"
            : "",
          isSelectionMode ? "cursor-pointer" : "",
        )}
        onMouseDown={handleMouseDown}
        onClick={handleCardClick}
        tabIndex={0}
        aria-selected={isSelected}
      >
        {/* Image */}
        <div className="relative flex-shrink-0 w-1/3 rounded-l-3xl overflow-hidden h-full">
          {/* Selection Checkbox */}
          {isSelectionMode && isSelected && (
            <div
              className={cn(
                "absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center z-30 transition-colors bg-sidebar-primary border-sidebar-primary text-primary ",
              )}
              onClick={handleCheckboxClick}
              tabIndex={-1}
              aria-label={isSelected ? "Deselect video" : "Select video"}
              role="checkbox"
              aria-checked={isSelected}
            >
              {isSelected && <Check strokeWidth={4} size={14} />}
            </div>
          )}
          {isSelectionMode ? (
            <img
              src={`https://img.youtube.com/vi/${video.youtube_id}/0.jpg`}
              alt={video.title || "Video Thumbnail"}
              className={cn(
                "h-full w-full object-cover object-center filter transition",
                video.blurThumbnail ? "blur-[6px]" : "",
              )}
            />
          ) : (
            <Link href={`/videos/${video.id}`} prefetch={false} scroll={true}>
              <img
                src={`https://img.youtube.com/vi/${video.youtube_id}/0.jpg`}
                alt={video.title || "Video Thumbnail"}
                className={cn(
                  "h-full w-full object-cover object-center filter transition",
                  video.blurThumbnail ? "blur-[6px]" : "",
                )}
              />
            </Link>
          )}
          {/* Gradient overlay for better badge visibility */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent z-10"
            aria-hidden="true"
          />
          <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs z-20">
            {/* Summary badge bottom left */}
            {video.hasSummary && (
              <div className="flex items-center gap-1 bg-white/30 rounded-full px-2 py-1">
                <Sparkles size={16} />
                {/* <span>Summary</span> */}
              </div>
            )}
            {/* Chat badge bottom left */}
            {video.hasChats && (
              <div className="flex items-center gap-1 bg-white/30 rounded-full px-2 py-1">
                <MessageSquare size={16} />
                {/* <span>Chat</span> */}
              </div>
            )}
          </div>
          {/* Duration bottom right */}
          {video.duration && (
            <div className="absolute bottom-2 right-2 bg-white/30 text-white text-xs rounded-lg px-2 py-1 z-20">
              {formatDuration(video.duration)}
            </div>
          )}
        </div>
        {/*  Content */}
        <div
          className="flex flex-col justify-between p-4 flex-grow overflow-y-scroll text-white"
          style={{ scrollbarWidth: "none" }}
        >
          <div>
            <h3
              className="font-bold text-lg"
              title={video.title || "Untitled Video"}
            >
              {video.title || "Untitled Video"}
            </h3>
            <p className="text-sm text-white/70">
              {video.channel_title || "Unknown Channel"}
            </p>
            <p
              className={`text-sm text-white overflow-hidden ${
                showFullDescription ? "" : "line-clamp-3"
              }`}
            >
              {video.description || "No description available."}
            </p>
            {video.description && video.description.length > 150 && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  toggleDescription();
                }}
                className="text-sm text-blue-500 underline self-start"
              >
                {showFullDescription ? "See less" : "See more"}
              </button>
            )}
          </div>
          <div className="flex items-center gap-4 rounded-md px-4 py-2 text-muted-foreground text-sm mt-2">
            {typeof video.views === "number" && (
              <div className="flex items-center gap-1">
                <Eye size={16} />
                <span>{formatNumberShort(video.views)}</span>
              </div>
            )}
            {typeof video.likes === "number" && (
              <div className="flex items-center gap-1">
                <ThumbsUp size={16} />
                <span>{formatNumberShort(video.likes)}</span>
              </div>
            )}
            {typeof video.comments === "number" && (
              <div className="flex items-center gap-1">
                <MessageCircle size={16} />
                <span>{formatNumberShort(video.comments)}</span>
              </div>
            )}
            {video.published_at && (
              <div className="flex items-center gap-1">
                <Youtube size={16} />
                <span>{formatDateAgo(video.published_at)}</span>
              </div>
            )}
            {video.created_at && (
              <div className="flex items-center gap-1">
                <Calendar size={16} />
                <span>{formatDateAgo(video.created_at)}</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "flex flex-col bg-background rounded-lg overflow-hidden transition-shadow group-hover:shadow-lg relative",
        isSelectionMode && isSelected
          ? "ring-2 ring-sidebar-primary ring-offset-4 ring-offset-background"
          : "",
        isSelectionMode ? "cursor-pointer" : "",
      )}
      onMouseDown={handleMouseDown}
      onClick={handleCardClick}
      tabIndex={0}
      aria-selected={isSelected}
    >
      <div className="relative overflow-clip">
        {/* Selection Checkbox */}
        {isSelectionMode && isSelected && (
          <div
            className={cn(
              "absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center z-30 transition-colors bg-sidebar-primary border-sidebar-primary text-primary ",
            )}
            onClick={handleCheckboxClick}
            tabIndex={-1}
            aria-label={isSelected ? "Deselect video" : "Select video"}
            role="checkbox"
            aria-checked={isSelected}
          >
            {isSelected && <Check strokeWidth={4} size={14} />}
          </div>
        )}
        {isSelectionMode ? (
          <img
            src={`https://img.youtube.com/vi/${video.youtube_id}/0.jpg`}
            alt={video.title || "Video Thumbnail"}
            className={cn(
              "w-full h-48 object-cover filter transition",
              video.blurThumbnail ? "blur-[6px]" : "",
            )}
          />
        ) : (
          <Link href={`/videos/${video.id}`} prefetch={false} scroll={true}>
            <img
              src={`https://img.youtube.com/vi/${video.youtube_id}/0.jpg`}
              alt={video.title || "Video Thumbnail"}
              className={cn(
                "w-full h-48 object-cover filter transition",
                video.blurThumbnail ? "blur-[6px]" : "",
              )}
            />
          </Link>
        )}
        {/* Gradient overlay for better badge visibility */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent z-10"
          aria-hidden="true"
        />
        <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs z-20">
          {/* Summary badge bottom left */}
          {video.hasSummary && (
            <div className="flex items-center gap-1 bg-white/30 rounded-full px-2 py-1">
              <Sparkles size={16} />
              {/* <span>Summary</span> */}
            </div>
          )}
          {/* Chat badge bottom left */}
          {video.hasChats && (
            <div className="flex items-center gap-1 bg-white/30 rounded-full px-2 py-1">
              <MessageSquare size={16} />
              {/* <span>Chat</span> */}
            </div>
          )}
        </div>
        {/* Duration bottom right */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-white/30 text-white text-xs rounded-lg px-2 py-1 z-20">
            {formatDuration(video.duration)}
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col gap-2 justify-between h-full">
        <div>
          <h3
            className="font-semibold text-md text-primary/50"
            title={video.title || "Untitled Video"}
          >
            {video.title || "Untitled Video"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {video.channel_title || "Unknown Channel"}
          </p>
          {/* <p>
            className={`text-sm text-muted-foreground overflow-hidden ${
              showFullDescription ? "" : "line-clamp-3"
            }`}
          >
            {video.description || "No description available."}
          </p>
          {video.description && video.description.length > 150 && (
            <button
              onClick={(e) => {
                e.preventDefault();
                toggleDescription();
              }}
              className="text-sm text-primary underline self-start"
            >
              {showFullDescription ? "See less" : "See more"}
            </button>
          )}
          {/* Tags shown only when description expanded */}
          {/* {showFullDescription && video.tags && video.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {video.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-primary/20 text-primary rounded-full px-3 py-1 text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )} */}
        </div>
        {/* Bottom row of stats */}
        <div className="flex items-center gap-4 text-muted-foreground text-sm mt-2">
          {typeof video.views === "number" && (
            <div className="flex items-center gap-1">
              <Eye size={16} />
              <span>{formatNumberShort(video.views)}</span>
            </div>
          )}
          {typeof video.likes === "number" && (
            <div className="flex items-center gap-1">
              <ThumbsUp size={16} />
              <span>{formatNumberShort(video.likes)}</span>
            </div>
          )}
          {typeof video.comments === "number" && (
            <div className="flex items-center gap-1">
              <MessageCircle size={16} />
              <span>{formatNumberShort(video.comments)}</span>
            </div>
          )}
          {video.published_at && (
            <div className="flex items-center gap-1">
              <Youtube size={16} />
              <span>{formatDateAgo(video.published_at)}</span>
            </div>
          )}
          {video.created_at && (
            <div className="flex items-center gap-1">
              <Calendar size={16} />
              <span>{formatDateAgo(video.created_at)}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
