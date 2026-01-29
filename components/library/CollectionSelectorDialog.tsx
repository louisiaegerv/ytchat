"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Folder, Check, Loader2 } from "lucide-react";
import type { Collection } from "@/types/library";

interface CollectionSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (selectedCollectionIds: string[]) => void;
}

export default function CollectionSelectorDialog({
  open,
  onOpenChange,
  onConfirm,
}: CollectionSelectorDialogProps) {
  const supabase = createClient();

  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Fetch collections when dialog opens
  useEffect(() => {
    const fetchCollections = async () => {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setCollections([]);
          return;
        }

        const { data, error } = await supabase
          .from("groups")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setCollections(data || []);
      } catch (err) {
        console.error("Failed to fetch collections:", err);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchCollections();
    }
  }, [open, supabase]);

  // Reset selections when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedIds(new Set());
    }
  }, [open]);

  // Toggle selection
  const toggleSelection = (collectionId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(collectionId)) {
        next.delete(collectionId);
      } else {
        next.add(collectionId);
      }
      return next;
    });
  };

  // Handle confirm
  const handleConfirm = () => {
    console.log("🔍 [CollectionSelectorDialog] handleConfirm called");
    console.log(
      "🔍 [CollectionSelectorDialog] selectedIds (Set):",
      selectedIds,
    );
    console.log(
      "🔍 [CollectionSelectorDialog] selectedIds (Array):",
      Array.from(selectedIds),
    );
    onConfirm(Array.from(selectedIds));
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Collections</DialogTitle>
          <DialogDescription>
            Choose collections to add this video to.
          </DialogDescription>
        </DialogHeader>

        {/* Collection list */}
        <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[400px] border rounded-md">
          {loading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading collections...
            </div>
          ) : collections.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No collections found. Create one first.
            </div>
          ) : (
            <div className="divide-y">
              {collections.map((collection) => (
                <div
                  key={collection.id}
                  className="flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    id={`collection-${collection.id}`}
                    checked={selectedIds.has(collection.id)}
                    onCheckedChange={() => toggleSelection(collection.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor={`collection-${collection.id}`}
                      className="font-medium text-sm text-primary truncate cursor-pointer flex items-center gap-2"
                    >
                      <Folder className="h-4 w-4 flex-shrink-0" />
                      {collection.name || "Untitled Collection"}
                    </label>
                    {collection.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {collection.description}
                      </p>
                    )}
                  </div>
                  {selectedIds.has(collection.id) && (
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={selectedIds.size === 0}>
            Add to {selectedIds.size} collection
            {selectedIds.size !== 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
