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
  Calendar,
} from "lucide-react";
import type { CollectionWithVideoCount } from "@/types/library";
import { formatCompactDate } from "@/lib/utils";

interface CollectionListProps {
  collection: CollectionWithVideoCount;
  onOpen?: (collectionId: string) => void;
  onRename?: (collectionId: string) => void;
  onDelete?: (collectionId: string) => void;
}

export default function CollectionList({
  collection,
  onOpen,
  onRename,
  onDelete,
}: CollectionListProps) {
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

  return (
    <div
      className="flex items-center justify-between p-4 border-b border-border hover:bg-accent/50 transition-colors cursor-pointer group"
      onClick={handleOpen}
    >
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="flex-shrink-0">
          <Folder className="h-8 w-8 text-primary" />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <h3
            className="font-semibold text-primary truncate"
            title={collection.name || "Untitled Collection"}
          >
            {collection.name || "Untitled Collection"}
          </h3>
          {collection.description && (
            <p
              className="text-sm text-muted-foreground truncate"
              title={collection.description}
            >
              {collection.description}
            </p>
          )}
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
            <div className="flex items-center gap-1">
              <VideoIcon className="h-4 w-4" />
              <span>
                {collection.video_count} video
                {collection.video_count !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{formatCompactDate(new Date(collection.created_at))}</span>
            </div>
          </div>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
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
          <DropdownMenuItem onClick={handleDelete} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
