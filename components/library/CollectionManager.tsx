"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LayoutGrid, ListIcon, Plus, FolderOpen } from "lucide-react";
import CollectionCard from "./CollectionCard";
import CollectionList from "./CollectionList";
import CreateCollectionDialog from "./CreateCollectionDialog";
import RenameCollectionDialog from "./RenameCollectionDialog";
import DeleteCollectionDialog from "./DeleteCollectionDialog";
import PinLimitDialog from "./PinLimitDialog";
import { useCollectionsQuery } from "@/hooks/queries/useCollectionsQuery";
import { usePinnedCollectionsQuery } from "@/hooks/queries/usePinnedCollectionsQuery";
import { useCollectionMutations } from "@/hooks/mutations/useCollectionMutations";
import { useIsCollectionPinnedQuery } from "@/hooks/queries/usePinnedCollectionsQuery";
import { usePinnedCollectionMutations } from "@/hooks/mutations/usePinnedCollectionMutations";

interface CollectionManagerProps {
  userId: string;
}

// Hook to get pinned status for a single collection
function useCollectionPinStatus(userId: string, collectionId: string) {
  const { data: isPinned, isLoading } = useIsCollectionPinnedQuery(
    userId,
    collectionId
  );
  return { isPinned: isPinned ?? false, isLoading };
}

export default function CollectionManager({ userId }: CollectionManagerProps) {
  const router = useRouter();

  // React Query hooks
  const { data: collections = [], isLoading: loading, error, refetch } = useCollectionsQuery(userId);
  const { createCollection, renameCollection, deleteCollection, isCreating } = useCollectionMutations();
  const { pinCollection, unpinCollection, isPinning, isUnpinning } = usePinnedCollectionMutations();

  // React Query for pinned collections (replaces context)
  const { data: pinnedCollections = [] } = usePinnedCollectionsQuery(userId);
  const syncingCollectionId = isPinning || isUnpinning ? "syncing" : null;

  // UI state
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showPinLimitDialog, setShowPinLimitDialog] = useState(false);
  const [pendingCollectionId, setPendingCollectionId] = useState<string | null>(null);

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  // Handlers
  const handleOpenCollection = useCallback((collectionId: string) => {
    router.push(`/library/collections/${collectionId}`);
  }, [router]);

  const handleRenameClick = useCallback((collectionId: string) => {
    setSelectedCollectionId(collectionId);
    setShowRenameDialog(true);
  }, []);

  const handleDeleteClick = useCallback((collectionId: string) => {
    setSelectedCollectionId(collectionId);
    setShowDeleteDialog(true);
  }, []);

  const handleCreateSuccess = useCallback(async () => {
    setShowCreateDialog(false);
    // No need to manually refetch - mutation invalidates cache
  }, []);

  const handleRenameSuccess = useCallback(async () => {
    setShowRenameDialog(false);
    setSelectedCollectionId(null);
    // No need to manually refetch - mutation handles optimistic update
  }, []);

  const handleDeleteSuccess = useCallback(async () => {
    setShowDeleteDialog(false);
    setSelectedCollectionId(null);
    // No need to manually refetch - mutation handles optimistic update
  }, []);

  const handleTogglePin = useCallback(async (collectionId: string) => {
    // Check current pinned status from context (will use query in Phase 6)
    const isCurrentlyPinned = pinnedCollections.some(
      (p) => p.collection_id === collectionId
    );

    if (isCurrentlyPinned) {
      // Unpin the collection
      try {
        await unpinCollection({ userId, collectionId });
      } catch (err: any) {
        console.error(
          "🔍 [CollectionManager] Error unpinning collection:",
          err,
        );
      }
    } else {
      // Try to pin the collection
      try {
        await pinCollection({ userId, collectionId });
      } catch (err: any) {
        if (err.message === "PIN_LIMIT_REACHED") {
          // Show pin limit dialog
          setPendingCollectionId(collectionId);
          setShowPinLimitDialog(true);
        } else {
          console.error(
            "🔍 [CollectionManager] Error pinning collection:",
            err,
          );
        }
      }
    }
  }, [userId, pinnedCollections, pinCollection, unpinCollection]);

  const handleReplacePin = useCallback(async (
    oldCollectionId: string,
    newCollectionId: string,
  ) => {
    try {
      await unpinCollection({ userId, collectionId: oldCollectionId });
      await pinCollection({ userId, collectionId: newCollectionId });
      setShowPinLimitDialog(false);
      setPendingCollectionId(null);
    } catch (err: any) {
      console.error(
        "🔍 [CollectionManager] Error replacing pinned collection:",
        err,
      );
    }
  }, [userId, pinCollection, unpinCollection]);

  const getSelectedCollection = useCallback(() => {
    return collections.find((c) => c.id === selectedCollectionId);
  }, [collections, selectedCollectionId]);

  const errorMessage = error instanceof Error ? error.message : error || null;

  // Empty state
  if (!loading && collections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FolderOpen className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-primary mb-2">
          No collections yet
        </h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-md">
          Create collections to organize your videos for easier browsing.
        </p>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Collection
        </Button>
        {showCreateDialog && (
          <CreateCollectionDialog
            userId={userId}
            open={showCreateDialog}
            onOpenChange={setShowCreateDialog}
            onSuccess={handleCreateSuccess}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {collections.length} collection{collections.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center border border-input rounded-md">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-r-none"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-l-none"
              onClick={() => setViewMode("list")}
            >
              <ListIcon className="h-4 w-4" />
            </Button>
          </div>
          {/* Create button */}
          <Button onClick={() => setShowCreateDialog(true)} disabled={isCreating}>
            <Plus className="h-4 w-4 mr-2" />
            {isCreating ? "Creating..." : "Create Collection"}
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading collections...</p>
        </div>
      )}

      {/* Error state */}
      {errorMessage && (
        <div className="text-center py-12">
          <p className="text-destructive">{errorMessage}</p>
          <Button onClick={() => refetch()} variant="outline" className="mt-4">
            Retry
          </Button>
        </div>
      )}

      {/* Collections grid/list */}
      {!loading && !error && (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              : "flex flex-col"
          }
        >
          {collections.map((collection) => (
            <CollectionCardWrapper
              key={collection.id}
              collection={collection}
              userId={userId}
              viewMode={viewMode}
              onOpen={handleOpenCollection}
              onRename={handleRenameClick}
              onDelete={handleDeleteClick}
              onTogglePin={handleTogglePin}
              syncingCollectionId={syncingCollectionId}
              isPinning={isPinning}
              isUnpinning={isUnpinning}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      {showCreateDialog && (
        <CreateCollectionDialog
          userId={userId}
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={handleCreateSuccess}
        />
      )}

      {showRenameDialog && selectedCollectionId && (
        <RenameCollectionDialog
          collectionId={selectedCollectionId}
          collectionName={getSelectedCollection()?.name || ""}
          open={showRenameDialog}
          onOpenChange={setShowRenameDialog}
          onSuccess={handleRenameSuccess}
        />
      )}

      {showDeleteDialog && selectedCollectionId && (
        <DeleteCollectionDialog
          collection={getSelectedCollection()}
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onSuccess={handleDeleteSuccess}
        />
      )}

      {showPinLimitDialog && (
        <PinLimitDialog
          open={showPinLimitDialog}
          onOpenChange={setShowPinLimitDialog}
          pinnedCollections={pinnedCollections}
          onReplace={handleReplacePin}
          newCollectionId={pendingCollectionId}
        />
      )}
    </div>
  );
}

// Wrapper component to handle pin status per collection
import type { CollectionWithVideoCount } from "@/types/library";

interface CollectionCardWrapperProps {
  collection: CollectionWithVideoCount;
  userId: string;
  viewMode: "grid" | "list";
  onOpen: (collectionId: string) => void;
  onRename: (collectionId: string) => void;
  onDelete: (collectionId: string) => void;
  onTogglePin: (collectionId: string) => void;
  syncingCollectionId: string | null;
  isPinning: boolean;
  isUnpinning: boolean;
}

function CollectionCardWrapper({
  collection,
  userId,
  viewMode,
  onOpen,
  onRename,
  onDelete,
  onTogglePin,
  syncingCollectionId,
  isPinning,
  isUnpinning,
}: CollectionCardWrapperProps) {
  const { isPinned } = useCollectionPinStatus(userId, collection.id);

  if (viewMode === "list") {
    return (
      <CollectionList
        collection={collection}
        onOpen={onOpen}
        onRename={onRename}
        onDelete={onDelete}
      />
    );
  }

  return (
    <CollectionCard
      collection={collection}
      onOpen={onOpen}
      onRename={onRename}
      onDelete={onDelete}
      isPinned={isPinned}
      onTogglePin={onTogglePin}
      syncingCollectionId={syncingCollectionId}
    />
  );
}
