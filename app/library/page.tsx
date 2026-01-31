"use client";

import { createClient } from "@/utils/supabase/client";
import { redirect } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import type {
  VideoWithFlags,
  Collection,
  VideoCollection,
} from "@/types/library";
import LoadingSkeleton from "@/components/library/LoadingSkeleton";
import ActiveFiltersBar from "@/components/library/ActiveFiltersBar";
import LibraryControls from "@/components/library/LibraryControls";
import VideoList from "@/components/library/VideoList";
import BulkActionBar from "@/components/library/BulkActionBar";
import CollectionManager from "@/components/library/CollectionManager";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import ToolbarButton from "@/components/library/ToolbarButton";
import { CheckSquare } from "lucide-react";
import { useItemSelection } from "@/components/library/hooks/useItemSelection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserId } from "@/hooks/queries/useUserQuery";
import { useCollectionsQuery } from "@/hooks/queries/useCollectionsQuery";
import { useVideoMutations } from "@/hooks/mutations/useVideoMutations";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { videosKeys } from "@/lib/queryKeys";
import { queryConfig } from "@/lib/queryClient";

const PAGE_SIZE = 12;

/**
 * Hook to fetch video metadata (tags, summaries, chats) for enriching video data
 */
function useVideoMetadata(userId: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["videoMetadata", userId],
    queryFn: async () => {
      if (!userId) return { tags: [], videoTags: [], links: [] };

      const [{ data: tagsData }, { data: videoTagsData }, { data: linksData }] =
        await Promise.all([
          supabase.from("tags").select("id, name"),
          supabase.from("video_tags").select("video_id, tag_id"),
          supabase.from("video_collections").select("video_id, collection_id"),
        ]);

      return {
        tags: tagsData || [],
        videoTags: videoTagsData || [],
        links: linksData || [],
      };
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch enhanced video data with tags, summaries, chats, and blur flags
 */
function useEnhancedVideos(
  userId: string | null,
  searchQuery: string,
  selectedTags: string[],
  selectedCollections: string[]
) {
  const supabase = useMemo(() => createClient(), []);
  const { data: metadata } = useVideoMetadata(userId);

  // Create a map for quick tag lookups
  const tagMap = useMemo(() => {
    if (!metadata?.tags) return new Map();
    return new Map(metadata.tags.map((t) => [t.id, t.name]));
  }, [metadata]);

  return useInfiniteQuery({
    queryKey: videosKeys.infinite({
      userId: userId || "",
      search: searchQuery,
      tags: selectedTags,
      collections: selectedCollections,
    }),
    queryFn: async ({ pageParam = 0 }) => {
      if (!userId) throw new Error("User ID required");

      let query;

      if (searchQuery) {
        // Use RPC for search
        query = supabase
          .rpc("search_videos_by_title_or_channel", {
            p_user_id: userId,
            p_search_query: searchQuery,
          })
          .select(
            `id, title, youtube_url, youtube_id, created_at, channel_id, published_at, description, duration, view_count, like_count, comment_count, channels(title)`
          );
      } else {
        // Standard query
        query = supabase
          .from("videos")
          .select(
            `id, title, youtube_url, youtube_id, created_at, channel_id, published_at, description, duration, view_count, like_count, comment_count, channels(title)`
          )
          .eq("user_id", userId);
      }

      // Apply pagination
      const start = pageParam * PAGE_SIZE;
      const end = start + PAGE_SIZE - 1;
      query = query.order("created_at", { ascending: false }).range(start, end);

      const { data: videosData, error } = await query;
      if (error) throw error;

      const videos = videosData || [];
      const videoIds = videos.map((v: any) => v.id);

      // Fetch summaries, chats, and blur flags in parallel
      const [summariesRes, chatsRes, flagsRes] = await Promise.all([
        supabase.from("summaries").select("video_id").in("video_id", videoIds),
        supabase.from("chats").select("video_id").in("video_id", videoIds),
        supabase
          .from("user_video_flags")
          .select("video_id, blur_thumbnail")
          .eq("user_id", userId)
          .in("video_id", videoIds),
      ]);

      const summaryIds = new Set((summariesRes.data || []).map((s) => s.video_id));
      const chatIds = new Set((chatsRes.data || []).map((c) => c.video_id));
      const blurMap = new Map(
        (flagsRes.data || []).map((f) => [f.video_id, f.blur_thumbnail])
      );

      // Build video tags map
      const videoTagsMap: Record<string, string[]> = {};
      videos.forEach((video: any) => {
        const videoTagEntries = (metadata?.videoTags || []).filter(
          (vt) => vt.video_id === video.id
        );
        videoTagsMap[video.id] = videoTagEntries
          .map((vt) => tagMap.get(vt.tag_id))
          .filter(Boolean) as string[];
      });

      // Transform to VideoWithFlags
      const videosWithFlags: VideoWithFlags[] = videos.map((video: any) => {
        const channels = video.channels;
        const channelTitle = Array.isArray(channels)
          ? channels[0]?.title
          : channels?.title;

        return {
          id: video.id,
          title: video.title,
          youtube_url: video.youtube_url,
          youtube_id: video.youtube_id,
          created_at: video.created_at,
          published_at: video.published_at || video.created_at,
          duration: video.duration,
          views: video.view_count,
          likes: video.like_count,
          comments: video.comment_count,
          channels: video.channels,
          tags: videoTagsMap[video.id] || [],
          description: video.description,
          hasSummary: summaryIds.has(video.id),
          hasChats: chatIds.has(video.id),
          channel_title: channelTitle || null,
          blurThumbnail: blurMap.get(video.id) || false,
        };
      });

      return {
        videos: videosWithFlags,
        nextPage: videos.length === PAGE_SIZE ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    enabled: !!userId,
    staleTime: queryConfig.videos.staleTime,
    gcTime: queryConfig.videos.gcTime,
  });
}

export default function LibraryPage() {
  const { userId } = useUserId();
  const supabase = useMemo(() => createClient(), []);

  // UI state
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Dialog state for delete confirmation
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);
    return () => clearTimeout(timerId);
  }, [searchQuery]);

  // Redirect if not authenticated
  useEffect(() => {
    if (userId === null) {
      // Wait a moment to avoid flash during loading
      const timer = setTimeout(() => {
        redirect("/login");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [userId]);

  // Fetch collections for filter UI
  const { data: collectionsData = [] } = useCollectionsQuery(userId);

  // Convert CollectionWithVideoCount[] to Collection[] for the filter UI
  const allCollections = useMemo(
    () =>
      collectionsData.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        user_id: c.user_id,
        created_at: c.created_at,
        updated_at: c.updated_at,
      })),
    [collectionsData]
  );

  // Fetch all tags for the filter UI
  const { data: allTagsData = [] } = useQuery({
    queryKey: ["allTags"],
    queryFn: async () => {
      const { data } = await supabase.from("tags").select("name");
      return (data || []).map((t) => t.name).sort();
    },
    staleTime: 5 * 60 * 1000,
  });

  const allTags = allTagsData;

  // Fetch videos with React Query infinite scroll
  const {
    data: videosData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: loading,
    error,
  } = useEnhancedVideos(
    userId,
    debouncedSearchQuery,
    selectedTags,
    selectedCollections
  );

  // Flatten videos from all pages
  const videos = useMemo(
    () => videosData?.pages.flatMap((page) => page.videos) || [],
    [videosData]
  );

  // Video mutations
  const { deleteVideos, setBlurFlag, isDeleting } = useVideoMutations();

  // Bulk selection hook
  const { selectedItems, handleItemSelect, clearSelection } = useItemSelection({
    items: videos,
    isSelectionMode,
    setIsSelectionMode,
  });

  // Infinite scroll fetch
  const fetchNext = useCallback(() => {
    if (isFetchingNextPage || !hasNextPage) return;
    fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Handlers for tag/collection selection
  const handleTagSelect = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const handleCollectionSelect = useCallback((collectionId: string) => {
    setSelectedCollections((prev) =>
      prev.includes(collectionId)
        ? prev.filter((id) => id !== collectionId)
        : [...prev, collectionId]
    );
  }, []);

  // Helper to get collection name by ID
  const getCollectionName = useCallback(
    (collectionId: string) => {
      return (
        allCollections.find((c) => c.id === collectionId)?.name ||
        "Unknown Collection"
      );
    },
    [allCollections]
  );

  // Handler for clearing all filters
  const handleClearAllFilters = useCallback(() => {
    setSelectedTags([]);
    setSelectedCollections([]);
  }, []);

  // Bulk action handlers
  const handleBulkDelete = useCallback(async () => {
    if (!userId || selectedItems.length === 0) return;

    try {
      await deleteVideos({ userId, videoIds: selectedItems });
      setShowDeleteDialog(false);
      clearSelection();
      setIsSelectionMode(false);
    } catch (err) {
      console.error("Failed to delete videos:", err);
    }
  }, [userId, selectedItems, deleteVideos, clearSelection]);

  const handleBulkTag = useCallback(() => {
    // TODO: Implement bulk tag logic
  }, []);

  const handleBulkAnalyze = useCallback(() => {
    // TODO: Implement bulk analyze logic
  }, []);

  // Selection mode toggle
  const handleToggleSelectionMode = useCallback(() => {
    if (isSelectionMode) {
      clearSelection();
    }
    setIsSelectionMode(!isSelectionMode);
  }, [isSelectionMode, clearSelection]);

  // Bulk blur/unblur handler
  const handleToggleBlur = useCallback(async () => {
    if (selectedItems.length === 0) return;

    // Determine majority state among selected
    let blurredCount = 0;
    const selectedSet = new Set(selectedItems);
    videos.forEach((v) => {
      if (selectedSet.has(v.id) && v.blurThumbnail) blurredCount += 1;
    });
    const n = selectedItems.length;
    const target = blurredCount >= Math.ceil(n / 2) ? false : true;

    try {
      await setBlurFlag({ videoIds: selectedItems, blur: target });
    } catch (err) {
      console.error("Failed to set blur flag:", err);
    }
  }, [selectedItems, videos, setBlurFlag]);

  const errorMessage = error instanceof Error ? error.message : null;

  return (
    <div className="container mx-auto pt-8 px-4 md:px-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Library</h1>
          <p className="text-sm text-muted-foreground">
            View past transcripts, AI summaries, and chats.
          </p>
        </div>
        {/* Controls: Search, Filters, and Selection Toggle */}
        <div className="flex items-center gap-2">
          <LibraryControls
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            viewMode={viewMode}
            setViewMode={setViewMode}
            allTags={allTags}
            selectedTags={selectedTags}
            onTagSelect={handleTagSelect}
            allCollections={allCollections}
            selectedCollections={selectedCollections}
            onCollectionSelect={handleCollectionSelect}
          />
          <ToolbarButton
            icon={<CheckSquare size={16} />}
            isActive={isSelectionMode}
            onClick={handleToggleSelectionMode}
          />
        </div>
      </div>

      {/* Content Section with Tabs */}
      <Tabs defaultValue="all-videos" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all-videos">All Videos</TabsTrigger>
          <TabsTrigger value="groups">Collections</TabsTrigger>
        </TabsList>

        {/* All Videos Tab */}
        <TabsContent value="all-videos" className="space-y-4">
          {/* Active Filters Display */}
          <ActiveFiltersBar
            selectedTags={selectedTags}
            selectedCollections={selectedCollections}
            getCollectionName={getCollectionName}
            onTagRemove={handleTagSelect}
            onCollectionRemove={handleCollectionSelect}
            onClearAll={handleClearAllFilters}
          />

          {/* Bulk Action Bar */}
          {isSelectionMode && (
            <>
              <BulkActionBar
                selectedCount={selectedItems.length}
                selectedVideoIds={selectedItems}
                onClearSelection={clearSelection}
                onDelete={() => setShowDeleteDialog(true)}
                onTag={handleBulkTag}
                onAnalyze={handleBulkAnalyze}
                onToggleBlur={handleToggleBlur}
              />
            </>
          )}

          {/* Delete Confirmation Dialog */}
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete selected videos?</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete the following videos? This
                  action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <ul className="max-h-40 overflow-y-auto mb-2 pl-4 list-disc">
                {videos
                  .filter((v) => selectedItems.includes(v.id))
                  .map((v) => (
                    <li key={v.id} className="text-sm">
                      {v.title || v.id}
                    </li>
                  ))}
              </ul>
              {errorMessage && <p className="text-red-500">{errorMessage}</p>}
              <DialogFooter>
                <button
                  className="px-4 py-2 rounded bg-muted text-foreground"
                  onClick={() => setShowDeleteDialog(false)}
                  disabled={isDeleting}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded bg-destructive text-destructive-foreground"
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                  type="button"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Main Content Area */}
          {loading && videos.length === 0 ? (
            <LoadingSkeleton viewMode={viewMode} />
          ) : error ? (
            <p className="text-red-500">{errorMessage}</p>
          ) : videos.length > 0 ? (
            <VideoList
              videos={videos}
              hasMore={hasNextPage}
              fetchNext={fetchNext}
              viewMode={viewMode}
              isSelectionMode={isSelectionMode}
              selectedItems={selectedItems}
              onSelect={handleItemSelect}
              setIsSelectionMode={setIsSelectionMode}
            />
          ) : (
            <p>
              {searchQuery
                ? "No videos match your search."
                : "You haven't saved any videos yet."}
            </p>
          )}
        </TabsContent>

        {/* Collections Tab */}
        <TabsContent value="groups" className="space-y-4">
          {userId && <CollectionManager userId={userId} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
