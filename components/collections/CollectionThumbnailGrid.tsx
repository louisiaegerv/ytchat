"use client";

import { useCollectionVideosQuery } from "@/hooks/queries/useCollectionsQuery";
import { VideoIcon } from "lucide-react";

interface CollectionThumbnailGridProps {
  collectionId: string;
  videoCount?: number;
  size?: "sm" | "md" | "lg";
}

export function CollectionThumbnailGrid({
  collectionId,
  videoCount = 0,
  size = "md",
}: CollectionThumbnailGridProps) {
  const { data: videos = [] } = useCollectionVideosQuery(collectionId);

  // Logic:
  // - If exactly 9 videos: show all 9 thumbnails (3x3 grid)
  // - If more than 9 videos: show 8 thumbnails + counter in 9th slot
  // - If less than 9 videos: show all thumbnails
  const actualVideoCount = videoCount || videos.length;
  let thumbnailsToShow: typeof videos = [];
  let showCounter = false;
  let counterValue = 0;

  if (actualVideoCount === 9) {
    // Exactly 9: show all 9
    thumbnailsToShow = videos.slice(0, 9);
    showCounter = false;
  } else if (actualVideoCount > 9) {
    // More than 9: show 8 thumbnails + counter
    thumbnailsToShow = videos.slice(0, 8);
    showCounter = true;
    counterValue = actualVideoCount - 8;
  } else {
    // Less than 9: show all
    thumbnailsToShow = videos.slice(0, 9);
    showCounter = false;
  }

  // Size configurations (always 3 columns for the 3x3 grid)
  const sizeClasses = {
    sm: "grid-cols-3 gap-1",
    md: "grid-cols-3 gap-2",
    lg: "grid-cols-3 gap-2",
  };

  const containerHeight = {
    sm: "h-20",
    md: "h-28",
    lg: "h-36",
  };

  if (thumbnailsToShow.length === 0) {
    return (
      <div
        className={`w-full ${containerHeight[size]} rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground`}
      >
        <div className="flex flex-col items-center gap-1">
          <VideoIcon className="h-4 w-4" />
          <span>No videos</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`grid ${sizeClasses[size]} w-full ${containerHeight[size]}`}>
      {thumbnailsToShow.map((video, index) => (
        <div
          key={video.id || index}
          className="aspect-video rounded-md overflow-hidden bg-muted"
        >
          <img
            src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`}
            alt={video.title || "Video thumbnail"}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ))}
      {showCounter && (
        <div className="aspect-video rounded-md overflow-hidden bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
          +{counterValue}
        </div>
      )}
    </div>
  );
}
