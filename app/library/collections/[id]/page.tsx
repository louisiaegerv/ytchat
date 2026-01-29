"use client";

import { useState, useEffect, useCallback, useMemo, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Folder,
  Video as VideoIcon,
  MoreVertical,
  Trash2,
  Plus,
  Calendar,
  Pin,
} from "lucide-react";
import type { Collection, Video } from "@/types/library";
import VideoCard from "@/components/library/VideoCard";
import VideoSelectorDialog from "@/components/library/VideoSelectorDialog";
import { usePinnedCollections } from "@/components/PinnedCollectionsContext";
import PinLimitDialog from "@/components/library/PinLimitDialog";
import {
  addVideosToCollection,
  removeVideosFromCollection,
} from "@/app/actions";

interface CollectionDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function CollectionDetailPage({
  params,
}: CollectionDetailPageProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { id: collectionId } = use(params);

  const [collection, setCollection] = useState<Collection | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVideoSelector, setShowVideoSelector] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [showPinLimitDialog, setShowPinLimitDialog] = useState(false);

  const {
    handlePin,
    handleUnpin,
    handleUpdateLastAccessed,
    pinnedCollections,
    syncingCollectionId,
  } = usePinnedCollections();

  // Fetch collection details
  const fetchCollection = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .eq("id", collectionId)
        .single();

      if (error) throw error;
      setCollection(data);

      // Update last accessed timestamp
      await handleUpdateLastAccessed(collectionId);
    } catch (err: any) {
      console.error("Error fetching collection:", err);
      setError(err.message || "Failed to load collection");
    }
  }, [collectionId]);

  // Fetch collection videos
  const fetchVideos = useCallback(async () => {
    try {
      const { getCollectionVideos } = await import("@/app/actions");
      const data = await getCollectionVideos(collectionId);
      setVideos(data);
    } catch (err: any) {
      console.error("Error fetching videos:", err);
      setError(err.message || "Failed to load videos");
    }
  }, [collectionId]);

  // Initial fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      await Promise.all([fetchCollection(), fetchVideos()]);
      setLoading(false);
    };
    loadData();
  }, [fetchCollection, fetchVideos]);

  // Update pin status when pinnedCollections changes
  useEffect(() => {
    const isPinned = pinnedCollections.some(
      (p) => p.collection_id === collectionId,
    );
    setIsPinned(isPinned);
  }, [pinnedCollections, collectionId]);

  // Handle adding videos
  const handleAddVideos = async (selectedVideoIds: string[]) => {
    try {
      await addVideosToCollection(collectionId, selectedVideoIds);
      // Refresh videos
      await fetchVideos();
    } catch (err: any) {
      console.error("Error adding videos:", err);
      setError(err.message || "Failed to add videos");
    }
  };

  // Handle removing a video
  const handleRemoveVideo = async (videoId: string) => {
    if (isRemoving) return;

    setIsRemoving(true);
    try {
      await removeVideosFromCollection(collectionId, [videoId]);
      // Refresh videos
      await fetchVideos();
    } catch (err: any) {
      console.error("Error removing video:", err);
      setError(err.message || "Failed to remove video");
    } finally {
      setIsRemoving(false);
    }
  };

  // Handle pin/unpin collection
  const handleTogglePin = async () => {
    if (isPinned) {
      await handleUnpin(collectionId);
      setIsPinned(false);
    } else {
      try {
        await handlePin(collectionId);
        setIsPinned(true);
      } catch (err: any) {
        if (err.message === "PIN_LIMIT_REACHED") {
          setShowPinLimitDialog(true);
        }
      }
    }
  };

  // Handle replace from pin limit dialog
  const handleReplaceFromDialog = async (oldCollectionId: string) => {
    await handleUnpin(oldCollectionId);
    await handlePin(collectionId);
    setIsPinned(true);
    setShowPinLimitDialog(false);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading collection...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !collection) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12">
          <p className="text-destructive mb-4">
            {error || "Collection not found"}
          </p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Button onClick={() => router.back()} variant="ghost" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Library
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Folder className="h-6 w-6 text-primary" />
                  <h1 className="text-3xl font-bold text-primary">
                    {collection.name || "Untitled Collection"}
                  </h1>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <VideoIcon className="h-4 w-4" />
                    <span>
                      {videos.length} video{videos.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Created {formatDate(collection.created_at)}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={isPinned ? "default" : "outline"}
                  size="sm"
                  onClick={handleTogglePin}
                  disabled={syncingCollectionId === collectionId}
                >
                  <Pin
                    className={`h-4 w-4 mr-2 ${
                      isPinned ? "fill-current" : ""
                    } ${
                      syncingCollectionId === collectionId
                        ? "animate-pulse"
                        : ""
                    }`}
                  />
                  {isPinned ? "Pinned" : "Pin Collection"}
                </Button>
                <Button onClick={() => setShowVideoSelector(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Videos
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-4 bg-destructive/10 border border-destructive rounded-md">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {/* Videos grid */}
      {videos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <VideoIcon className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-primary mb-2">
              No videos yet
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md text-center">
              This collection doesn't have any videos yet. Add some videos to
              get started.
            </p>
            <Button onClick={() => setShowVideoSelector(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Videos
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.map((video) => (
            <div key={video.id} className="relative group">
              <VideoCard video={video} />
              {/* Remove video dropdown */}
              <div className="absolute top-2 right-2 z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 bg-background/80 hover:bg-background"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleRemoveVideo(video.id)}
                      disabled={isRemoving}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove from Collection
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Selector Dialog */}
      {showVideoSelector && (
        <VideoSelectorDialog
          collectionId={collectionId}
          preSelectedVideoIds={videos.map((v) => v.id)}
          open={showVideoSelector}
          onOpenChange={setShowVideoSelector}
          onConfirm={handleAddVideos}
        />
      )}

      {/* Pin Limit Dialog */}
      <PinLimitDialog
        open={showPinLimitDialog}
        onOpenChange={setShowPinLimitDialog}
        pinnedCollections={pinnedCollections}
        onReplace={handleReplaceFromDialog}
        newCollectionId={collectionId}
      />
    </div>
  );
}
