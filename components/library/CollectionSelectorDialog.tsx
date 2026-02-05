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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Folder, Check, Loader2, Plus, AlertCircle } from "lucide-react";
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

  // Create collection state
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

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
          .from("collections")
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

  // Reset selections and create form when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedIds(new Set());
      setShowCreateForm(false);
      setNewCollectionName("");
      setNewCollectionDescription("");
      setCreateError(null);
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

  // Handle create collection
  const handleCreateCollection = async () => {
    setCreateError(null);

    if (!newCollectionName.trim()) {
      setCreateError("Collection name is required");
      return;
    }

    setIsCreating(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setCreateError("Not authenticated");
        return;
      }

      const { data, error } = await supabase
        .from("collections")
        .insert({
          user_id: user.id,
          name: newCollectionName.trim(),
          description: newCollectionDescription.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Add new collection to list and select it
      setCollections((prev) => [data, ...prev]);
      setSelectedIds((prev) => new Set(prev).add(data.id));

      // Reset form
      setNewCollectionName("");
      setNewCollectionDescription("");
      setShowCreateForm(false);
    } catch (err: any) {
      console.error("Failed to create collection:", err);
      setCreateError(err.message || "Failed to create collection");
    } finally {
      setIsCreating(false);
    }
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

        {/* Create Collection Form */}
        {showCreateForm && (
          <div className="border rounded-md p-4 space-y-3 mb-3 bg-muted/30">
            <h4 className="font-medium text-sm">Create New Collection</h4>
            
            <div className="space-y-2">
              <Label htmlFor="new-collection-name" className="text-xs">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="new-collection-name"
                placeholder="Enter collection name"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                disabled={isCreating}
                className="h-9"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-collection-description" className="text-xs">
                Description (optional)
              </Label>
              <Input
                id="new-collection-description"
                placeholder="Enter a description"
                value={newCollectionDescription}
                onChange={(e) => setNewCollectionDescription(e.target.value)}
                disabled={isCreating}
                className="h-9"
              />
            </div>

            {createError && (
              <div className="flex items-center gap-2 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateForm(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreateCollection}
                disabled={isCreating || !newCollectionName.trim()}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Create
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Create New Button (when form is hidden) */}
        {!showCreateForm && (
          <Button
            variant="outline"
            className="mb-3 justify-start"
            onClick={() => setShowCreateForm(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Collection
          </Button>
        )}

        {/* Collection list */}
        <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[400px] border rounded-md">
          {loading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading collections...
            </div>
          ) : collections.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground px-4 text-center">
              <div>
                <p className="mb-2">No collections found.</p>
                {!showCreateForm && (
                  <p className="text-sm">Click "Create New Collection" above to get started.</p>
                )}
              </div>
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
