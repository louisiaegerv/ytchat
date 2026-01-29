"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { LayoutGrid, ListIcon, Plus, FolderOpen, Pin } from "lucide-react";
import type { CollectionWithVideoCount, Video } from "@/types/library";
import CollectionCard from "./CollectionCard";
import CollectionList from "./CollectionList";
import CreateCollectionDialog from "./CreateCollectionDialog";
import RenameCollectionDialog from "./RenameCollectionDialog";
import DeleteCollectionDialog from "./DeleteCollectionDialog";
import PinLimitDialog from "./PinLimitDialog";
import { usePinnedCollections } from "@/components/PinnedCollectionsContext";

interface CollectionManagerProps {
  userId: string;
}

export default function CollectionManager({ userId }: CollectionManagerProps) {
  const router = useRouter();
  const supabase = createClient();

  // Integrate usePinnedCollections hook
  const {
    checkIsPinned,
    handlePin,
    handleUnpin,
    pinnedCollections,
    syncingCollectionId,
  } = usePinnedCollections();

  const [collections, setCollections] = useState<CollectionWithVideoCount[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [collectionVideos, setCollectionVideos] = useState<
    Record<string, Video[]>
  >({});
  const [pinnedStatus, setPinnedStatus] = useState<Record<string, boolean>>({});
  const [showPinLimitDialog, setShowPinLimitDialog] = useState(false);
  const [pendingCollectionId, setPendingCollectionId] = useState<string | null>(
    null,
  );

  // Ref to track if a fetch is currently in progress
  // This prevents duplicate fetches from React Strict Mode while allowing the first request
  const isFetchingRef = useRef(false);

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    string | null
  >(null);

  // Fetch collections
  const fetchCollections = useCallback(async () => {
    // Prevent duplicate fetches caused by React Strict Mode in development
    // Use a ref to track if a fetch is already in progress
    if (isFetchingRef.current) {
      return;
    }
    isFetchingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const { getCollections, getCollectionVideos } = await import(
        "@/app/actions"
      );
      const data = await getCollections(userId);
      console.log("🔍 [CollectionManager] Fetched collections:", data);
      console.log(
        "🔍 [CollectionManager] Collections with video_count > 0:",
        data.filter((c) => c.video_count > 0),
      );
      setCollections(data);

      // Check pinned status for each collection
      const pinnedStatusMap: Record<string, boolean> = {};
      await Promise.all(
        data.map(async (collection) => {
          const isPinned = await checkIsPinned(collection.id);
          pinnedStatusMap[collection.id] = isPinned;
        }),
      );
      setPinnedStatus(pinnedStatusMap);

      // Fetch videos for each collection
      const videosMap: Record<string, Video[]> = {};
      await Promise.all(
        data.map(async (collection) => {
          if (collection.video_count > 0) {
            try {
              const videos = await getCollectionVideos(collection.id);
              console.log(
                `🔍 [CollectionManager] Fetched ${videos.length} videos for collection "${collection.name}"`,
              );
              videosMap[collection.id] = videos;
            } catch (err) {
              console.error(
                `🔍 [CollectionManager] Error fetching videos for collection "${collection.name}":`,
                err,
              );
              videosMap[collection.id] = [];
            }
          } else {
            videosMap[collection.id] = [];
          }
        }),
      );
      setCollectionVideos(videosMap);
    } catch (err: any) {
      console.error("🔍 [CollectionManager] Error fetching collections:", err);
      setError(err.message || "Failed to load collections");
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [userId, checkIsPinned]);

  useEffect(() => {
    fetchCollections();
  }, [userId]);

  // Handlers
  const handleOpenCollection = (collectionId: string) => {
    router.push(`/library/collections/${collectionId}`);
  };

  const handleRenameClick = (collectionId: string) => {
    setSelectedCollectionId(collectionId);
    setShowRenameDialog(true);
  };

  const handleDeleteClick = (collectionId: string) => {
    setSelectedCollectionId(collectionId);
    setShowDeleteDialog(true);
  };

  const handleCreateSuccess = () => {
    setShowCreateDialog(false);
    fetchCollections();
  };

  const handleRenameSuccess = () => {
    setShowRenameDialog(false);
    setSelectedCollectionId(null);
    fetchCollections();
  };

  const handleDeleteSuccess = () => {
    setShowDeleteDialog(false);
    setSelectedCollectionId(null);
    fetchCollections();
  };

  const handleTogglePin = async (collectionId: string) => {
    const isCurrentlyPinned = pinnedStatus[collectionId];

    if (isCurrentlyPinned) {
      // Unpin the collection
      try {
        await handleUnpin(collectionId);
        setPinnedStatus((prev) => ({
          ...prev,
          [collectionId]: false,
        }));
      } catch (err: any) {
        console.error(
          "🔍 [CollectionManager] Error unpinning collection:",
          err,
        );
      }
    } else {
      // Try to pin the collection
      try {
        await handlePin(collectionId);
        setPinnedStatus((prev) => ({
          ...prev,
          [collectionId]: true,
        }));
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
  };

  const handleReplacePin = async (
    oldCollectionId: string,
    newCollectionId: string,
  ) => {
    try {
      await handleUnpin(oldCollectionId);
      await handlePin(newCollectionId);
      setPinnedStatus((prev) => ({
        ...prev,
        [oldCollectionId]: false,
        [newCollectionId]: true,
      }));
      setShowPinLimitDialog(false);
      setPendingCollectionId(null);
    } catch (err: any) {
      console.error(
        "🔍 [CollectionManager] Error replacing pinned collection:",
        err,
      );
    }
  };

  const getSelectedCollection = () => {
    return collections.find((c) => c.id === selectedCollectionId);
  };

  // Empty state
  if (!loading && collections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FolderOpen className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-primary mb-2">
          No collections yet
        </h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-md">
          Create collections to organize your videos into groups for easier
          browsing.
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
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Collection
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
      {error && (
        <div className="text-center py-12">
          <p className="text-destructive">{error}</p>
          <Button onClick={fetchCollections} variant="outline" className="mt-4">
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
            <div key={collection.id}>
              {viewMode === "grid" ? (
                <CollectionCard
                  collection={collection}
                  videos={collectionVideos[collection.id] || []}
                  onOpen={handleOpenCollection}
                  onRename={handleRenameClick}
                  onDelete={handleDeleteClick}
                  isPinned={pinnedStatus[collection.id] || false}
                  onTogglePin={handleTogglePin}
                  syncingCollectionId={syncingCollectionId}
                />
              ) : (
                <CollectionList
                  collection={collection}
                  onOpen={handleOpenCollection}
                  onRename={handleRenameClick}
                  onDelete={handleDeleteClick}
                />
              )}
            </div>
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
