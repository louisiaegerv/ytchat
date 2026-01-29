import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Folder,
  MoreVertical,
  Trash2,
  Edit,
  Video as VideoIcon,
  Pin,
} from "lucide-react";
import type { CollectionWithVideoCount, Video } from "@/types/library";

interface CollectionCardProps {
  collection: CollectionWithVideoCount;
  videos?: Video[];
  onOpen?: (collectionId: string) => void;
  onRename?: (collectionId: string) => void;
  onDelete?: (collectionId: string) => void;
  isPinned?: boolean;
  onTogglePin?: (collectionId: string) => void;
  syncingCollectionId?: string | null;
}

export default function CollectionCard({
  collection,
  videos = [],
  onOpen,
  onRename,
  onDelete,
  isPinned = false,
  onTogglePin,
  syncingCollectionId = null,
}: CollectionCardProps) {
  console.log("🔍 [CollectionCard] Rendering collection:", collection.name);
  console.log(
    "🔍 [CollectionCard] collection.video_count:",
    collection.video_count,
  );
  console.log("🔍 [CollectionCard] videos prop received:", videos);
  console.log("🔍 [CollectionCard] videos.length:", videos.length);

  const handleOpen = () => {
    onOpen?.(collection.id);
  };

  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRename?.(collection.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(collection.id);
  };

  const handleTogglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTogglePin?.(collection.id);
  };

  // Get up to 6 thumbnails from videos
  const thumbnails = videos.slice(0, 8);
  const remainingCount = Math.max(
    0,
    collection.video_count - thumbnails.length,
  );

  return (
    <Card
      className="group bg-background hover:shadow-lg transition-all duration-200 cursor-pointer h-64 flex flex-col"
      onClick={handleOpen}
    >
      <CardHeader className="p-4 pb-2 flex-shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Folder className="h-5 w-5 text-primary flex-shrink-0" />
            <h3
              className="font-semibold text-primary truncate"
              title={collection.name || "Untitled Collection"}
            >
              {collection.name || "Untitled Collection"}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            {onTogglePin && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={handleTogglePin}
                disabled={syncingCollectionId === collection.id}
                aria-label={isPinned ? "Unpin collection" : "Pin collection"}
              >
                <Pin
                  className={`h-4 w-4 ${
                    isPinned
                      ? "text-primary fill-current"
                      : "text-muted-foreground"
                  } ${
                    syncingCollectionId === collection.id ? "animate-pulse" : ""
                  }`}
                />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleRename}>
                  <Edit className="h-4 w-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
          <VideoIcon className="h-4 w-4" />
          <span>
            {collection.video_count} video
            {collection.video_count !== 1 ? "s" : ""}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2 flex-1 overflow-hidden">
        {thumbnails.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 h-full">
            {thumbnails.map((video, index) => (
              <div
                key={video.id || index}
                className="aspect-video rounded-md overflow-hidden bg-muted"
              >
                <img
                  src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`}
                  alt={video.title || "Video thumbnail"}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {remainingCount > 0 && (
              <div className="aspect-video rounded-md overflow-hidden bg-muted flex items-center justify-center text-sm text-muted-foreground">
                +{remainingCount}
              </div>
            )}
          </div>
        ) : (
          <div className="h-full rounded-md bg-muted flex items-center justify-center text-sm text-muted-foreground">
            No videos yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}
