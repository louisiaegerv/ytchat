// Bulk selection support added
import InfiniteScroll from "react-infinite-scroll-component";
import VideoCard from "@/components/library/VideoCard";
import type { VideoWithFlags } from "@/types/library";

interface VideoListProps {
  videos: VideoWithFlags[];
  hasMore: boolean;
  fetchNext: () => void;
  viewMode: "list" | "grid";
  isSelectionMode?: boolean;
  selectedItems?: string[];
  onSelect?: (id: string, event?: React.MouseEvent | React.TouchEvent) => void;
  setIsSelectionMode?: (value: boolean) => void;
}

export default function VideoList({
  videos,
  hasMore,
  fetchNext,
  viewMode,
  isSelectionMode = false,
  selectedItems = [],
  onSelect,
  setIsSelectionMode,
}: VideoListProps) {
  if (videos.length === 0) return null;

  return (
    <div style={{ overflow: "visible" }}>
      <div
        id="video-scroll-container"
        style={{
          height: isSelectionMode ? 450 : 700,
          overflow: "auto",
          scrollbarWidth: "none",
        }}
      >
        <InfiniteScroll
          className="!overflow-visible"
          dataLength={videos.length}
          next={fetchNext}
          hasMore={hasMore}
          scrollableTarget="video-scroll-container"
          loader={
            <div className="flex justify-center py-4">
              <span>Loading more...</span>
            </div>
          }
          endMessage={
            <div className="flex justify-center py-4 text-muted-foreground">
              <span>No more videos.</span>
            </div>
          }
        >
          <div
            style={{ padding: 16 }}
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                : "space-y-4"
            }
          >
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                isSelectionMode={isSelectionMode}
                isSelected={selectedItems.includes(video.id)}
                onSelect={onSelect}
                setIsSelectionMode={setIsSelectionMode}
                viewMode={viewMode}
              />
            ))}
          </div>
        </InfiniteScroll>
      </div>
    </div>
  );
}
