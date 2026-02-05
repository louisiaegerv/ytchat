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
  // - If exactly 6 videos: show all 6 thumbnails (3x2 grid)
  // - If more than 6 videos: show 5 thumbnails + counter in 6th slot
  // - If less than 6 videos: show all thumbnails
  const MAX_THUMBNAILS = 6;
  const actualVideoCount = videoCount || videos.length;
  let thumbnailsToShow: typeof videos = [];
  let showCounter = false;
  let counterValue = 0;

  if (actualVideoCount === MAX_THUMBNAILS) {
    // Exactly 6: show all 6
    thumbnailsToShow = videos.slice(0, MAX_THUMBNAILS);
    showCounter = false;
  } else if (actualVideoCount > MAX_THUMBNAILS) {
    // More than 6: show 5 thumbnails + counter
    thumbnailsToShow = videos.slice(0, MAX_THUMBNAILS - 1);
    showCounter = true;
    counterValue = actualVideoCount - (MAX_THUMBNAILS - 1);
  } else {
    // Less than 6: show all
    thumbnailsToShow = videos.slice(0, MAX_THUMBNAILS);
    showCounter = false;
  }

  // Size configurations (3 columns, 2 rows for the 3x2 grid)
  const sizeClasses = {
    sm: "grid-cols-3 gap-1",
    md: "grid-cols-3 gap-2",
    lg: "grid-cols-3 gap-2",
  };

  const containerHeight = {
    sm: "h-14",
    md: "h-20",
    lg: "h-24",
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
