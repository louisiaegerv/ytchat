"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Video as VideoIcon } from "lucide-react";
import type { CollectionWithVideoCount } from "@/types/library";

interface DeleteCollectionDialogProps {
  collection: CollectionWithVideoCount | null | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function DeleteCollectionDialog({
  collection,
  open,
  onOpenChange,
  onSuccess,
}: DeleteCollectionDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!collection) return;

    setIsDeleting(true);
    setError(null);

    try {
      const { deleteCollection } = await import("@/app/actions");
      await deleteCollection(collection.id);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to delete collection");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setError(null);
    onOpenChange(false);
  };

  if (!collection) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-destructive">
            Delete Collection
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this collection? This action cannot
            be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Collection info */}
          <div className="flex items-start gap-3 p-4 bg-muted rounded-md">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-primary">
                {collection.name || "Untitled Collection"}
              </p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <VideoIcon className="h-4 w-4" />
                <span>
                  {collection.video_count} video
                  {collection.video_count !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Warning message */}
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-2">This will:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Delete the collection permanently</li>
              <li>Remove all videos from this collection</li>
              <li>Not delete the videos themselves</li>
            </ul>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Collection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
