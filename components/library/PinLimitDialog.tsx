"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pin } from "lucide-react";
import type { PinnedCollectionDetails } from "@/types/library";

interface PinLimitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pinnedCollections: PinnedCollectionDetails[];
  onReplace: (oldCollectionId: string, newCollectionId: string) => void;
  newCollectionId: string | null;
}

export default function PinLimitDialog({
  open,
  onOpenChange,
  pinnedCollections,
  onReplace,
  newCollectionId,
}: PinLimitDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pin limit reached</DialogTitle>
          <DialogDescription>
            You can pin up to 6 collections. Select one to replace:
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {pinnedCollections.map((item) => (
            <button
              key={item.id}
              onClick={() =>
                newCollectionId &&
                onReplace(item.collection_id, newCollectionId)
              }
              className="flex items-center gap-2 w-full p-2 hover:bg-muted rounded text-left transition-colors"
              aria-label={`Replace ${
                Array.isArray(item.collections)
                  ? item.collections[0]?.name
                  : (item.collections as any)?.name || "Unnamed Collection"
              }`}
            >
              <Pin className="h-4 w-4 text-primary fill-current flex-shrink-0" />
              <span className="truncate">
                {Array.isArray(item.collections)
                  ? item.collections[0]?.name
                  : (item.collections as any)?.name || "Unnamed Collection"}
              </span>
            </button>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
