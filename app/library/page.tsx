"use client";

import { createClient } from "@/utils/supabase/client";
import { redirect } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import type { Video, VideoWithFlags, Collection } from "@/types/library";
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
import {
  LayoutGrid,
  ListIcon,
  MousePointer,
  CheckSquare,
  CopyCheck,
} from "lucide-react";
import { useVideoQuery } from "@/hooks/useVideoQuery";
import { useItemSelection } from "@/components/library/hooks/useItemSelection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PAGE_SIZE = 12;

export default function LibraryPage() {
  const [videos, setVideos] = useState<VideoWithFlags[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFetchingNext, setIsFetchingNext] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allGroups, setAllGroups] = useState<Collection[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [videoGroupLinks, setVideoGroupLinks] = useState<VideoGroup[]>([]);
  const [allTagObjects, setAllTagObjects] = useState<
    { id: number; name: string }[]
  >([]);
  const [videoTags, setVideoTags] = useState<
    { video_id: string; tag_id: number }[]
  >([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Bulk selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const supabase = createClient();

  // Debounce search query
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);
    return () => clearTimeout(timerId);
  }, [searchQuery]);

  // Fetch user and groups/tags on mount
  useEffect(() => {
    const fetchUserAndMeta = async () => {
      console.log(
        "🔍 [LibraryPage] useEffect triggered - fetchUserAndMeta called",
      );
      console.log("🔍 [LibraryPage] supabase dependency changed:", supabase);
      setLoading(true);
      setError(null);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        redirect("/login");
        return;
      }
      console.log("🔍 [LibraryPage] About to set userId:", user.id);
      console.log("🔍 [LibraryPage] Current userId before setUserId:", userId);
      setUserId(user.id);
      console.log("🔍 [LibraryPage] userId set to:", user.id);

      try {
        // Fetch all groups, video_groups, tags, and video_tags for filter UI
        const [
          { data: groupData },
          { data: linkData },
          { data: tagData },
          { data: videoTagData },
        ] = await Promise.all([
          supabase
            .from("collections")
            .select("id, name")
            .eq("user_id", user.id),
          supabase.from("video_collections").select("video_id, collection_id"),
          supabase.from("tags").select("id, name"),
          supabase.from("video_tags").select("video_id, tag_id"),
        ]);
        setAllGroups(
          (groupData || []).sort((a, b) =>
            (a.name || "").localeCompare(b.name || ""),
          ),
        );
        setVideoGroupLinks(linkData || []);
        setAllTagObjects(tagData || []);
        setVideoTags(videoTagData || []);
      } catch (err: any) {
        setError("Failed to load filter data.");
      } finally {
        setLoading(false);
      }
    };
    fetchUserAndMeta();
  }, [supabase]);

  // Use custom hook for building video query
  const buildVideoQuery = useVideoQuery({
    debouncedSearchQuery,
    selectedTags,
    selectedGroups,
    videoGroupLinks,
  });

  // Bulk selection hook
  const { selectedItems, handleItemSelect, clearSelection } = useItemSelection({
    items: videos,
    isSelectionMode,
    setIsSelectionMode,
  });

  // Fetch videos (paginated, with filters)
  const fetchVideos = useCallback(
    async (pageToFetch: number, reset = false) => {
      console.log("fetchVideos called with page:", pageToFetch);
      if (!userId) return;
      if (reset) {
        setLoading(true);
        setError(null);
      } else {
        setIsFetchingNext(true);
      }
      try {
        const query = buildVideoQuery(userId, pageToFetch);
        console.log("Executing query for page:", pageToFetch);
        const { data, error } = await query;
        if (error) throw error;

        // Build a map of video_id -> tag names
        const videoTagsMap: Record<string, string[]> = {};
        (data || []).forEach((video) => {
          videoTags
            .filter((vt) => vt.video_id === video.id)
            .forEach((vt) => {
              const tagName = allTagObjects.find(
                (t) => t.id === vt.tag_id,
              )?.name;
              if (tagName) {
                if (!videoTagsMap[video.id]) videoTagsMap[video.id] = [];
                videoTagsMap[video.id].push(tagName);
              }
            });
        });

        // --- New logic: check for summaries and chats for each video ---
        const videoIds = (data || []).map((video) => video.id);

        // Query summaries and chats in parallel
        const [summariesRes, chatsRes] = await Promise.all([
          supabase
            .from("summaries")
            .select("video_id")
            .in("video_id", videoIds),
          supabase.from("chats").select("video_id").in("video_id", videoIds),
        ]);

        const summaryVideoIds = new Set(
          (summariesRes.data || []).map((row) => row.video_id),
        );
        const chatVideoIds = new Set(
          (chatsRes.data || []).map((row) => row.video_id),
        );

        // Map each video to include tags, hasSummary, hasChats, and new fields with defaults
        let videosWithFlags: VideoWithFlags[] = (data || []).map((video) => {
          // Destructure video to separate channels, then reconstruct
          const { channels, ...restOfVideo } = video;

          // Explicitly type and reconstruct channels to match the Video type
          const typedChannels: { title: string | null } | null =
            channels && typeof channels === "object" && !Array.isArray(channels)
              ? { title: (channels as any).title }
              : null;

          const base: VideoWithFlags = {
            ...(restOfVideo as any),
            channels: typedChannels,
            description: (video as any).description || null,
            published_at:
              (video as any).published_at || (video as any).created_at,
            duration: (video as any).duration || 0,
            views: (video as any).view_count || 0,
            likes: (video as any).like_count || 0,
            comments: (video as any).comment_count || 0,
            tags: videoTagsMap[video.id] || [],
            hasSummary: summaryVideoIds.has(video.id),
            hasChats: chatVideoIds.has(video.id),
            channel_title: typedChannels?.title || null,
            blurThumbnail: false, // default, may be overridden by user flags fetch below
          };
          return base;
        });

        // Secondary fetch: per-user blur flags for current page videos
        try {
          if (videoIds.length > 0) {
            const { data: flagsData, error: flagsError } = await supabase
              .from("user_video_flags")
              .select("video_id, blur_thumbnail")
              .eq("user_id", userId)
              .in("video_id", videoIds);

            if (!flagsError && flagsData) {
              const blurMap = new Map<string, boolean>();
              flagsData.forEach((row: any) => {
                blurMap.set(row.video_id, !!row.blur_thumbnail);
              });
              videosWithFlags = videosWithFlags.map((v) => ({
                ...v,
                blurThumbnail: blurMap.get(v.id) ?? false,
              }));
            }
          }
        } catch (_err) {
          // Gracefully handle if table doesn't exist yet or other errors; default remains false
          // no-op
        }

        if (reset) {
          setVideos(videosWithFlags);
        } else {
          setVideos((prev) => {
            // Deduplicate by id
            const allVideos = [...prev, ...videosWithFlags];
            const seen = new Set();
            return allVideos.filter((v) => {
              if (seen.has(v.id)) return false;
              seen.add(v.id);
              return true;
            });
          });
        }

        // Extract unique tags from this batch
        const uniqueTags = new Set<string>();
        Object.values(videoTagsMap).forEach((tagsArr) => {
          tagsArr.forEach((tag) => uniqueTags.add(tag));
        });
        setAllTags((prev) =>
          Array.from(
            new Set(Array.from(prev).concat(Array.from(uniqueTags))),
          ).sort(),
        );
        // If less than PAGE_SIZE, no more data
        setHasMore((data?.length || 0) === PAGE_SIZE);
      } catch (err: any) {
        setError("Failed to load videos.");
        setHasMore(false);
      } finally {
        setLoading(false);
        setIsFetchingNext(false);
      }
    },
    [userId, buildVideoQuery],
  );

  // Initial and filter-triggered fetch
  useEffect(() => {
    console.log("🔍 [LibraryPage] fetchVideos useEffect triggered");
    console.log("🔍 [LibraryPage] userId:", userId);
    if (!userId) return;
    setVideos([]);
    setPage(0);
    setHasMore(true);
    console.log("🔍 [LibraryPage] Calling fetchVideos(0, true)");
    fetchVideos(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    userId,
    debouncedSearchQuery,
    selectedTags,
    selectedGroups,
    videoGroupLinks,
  ]);

  // Infinite scroll fetch
  const fetchNext = () => {
    if (isFetchingNext) return;
    setPage((prevPage) => {
      const nextPage = prevPage + 1;
      console.log("fetchNext called, nextPage:", nextPage);
      fetchVideos(nextPage);
      return nextPage;
    });
  };

  // Handlers for tag/group selection
  const handleTagSelect = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };
  const handleGroupSelect = (groupId: string) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId],
    );
  };

  // Helper to get group name by ID
  const getGroupName = (groupId: string) => {
    return allGroups.find((g) => g.id === groupId)?.name || "Unknown Group";
  };

  // Handler for clearing all filters
  const handleClearAllFilters = () => {
    setSelectedTags([]);
    setSelectedGroups([]);
  };

  // Dialog state for delete confirmation
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Bulk action handlers
  const handleBulkDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmBulkDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const { error } = await supabase
        .from("videos")
        .delete()
        .in("id", selectedItems);
      if (error) throw error;
      // Remove deleted videos from state
      setVideos((prev) => prev.filter((v) => !selectedItems.includes(v.id)));
      clearSelection();
      setIsSelectionMode(false);
      setShowDeleteDialog(false);
    } catch (err: any) {
      setDeleteError("Failed to delete videos.");
    } finally {
      setIsDeleting(false);
    }
  };
  const handleBulkTag = () => {
    // TODO: Implement bulk tag logic
  };
  const handleBulkAnalyze = () => {
    // TODO: Implement bulk analyze logic
  };

  // Selection mode toggle
  const handleToggleSelectionMode = () => {
    if (isSelectionMode) {
      clearSelection();
    }
    setIsSelectionMode(!isSelectionMode);
  };

  // Bulk blur/unblur handler with majority rule and optimistic update
  const handleToggleBlur = async () => {
    if (selectedItems.length === 0) return;

    // Determine majority state among selected
    let blurredCount = 0;
    const selectedSet = new Set(selectedItems);
    videos.forEach((v) => {
      if (selectedSet.has(v.id) && v.blurThumbnail) blurredCount += 1;
    });
    const n = selectedItems.length;
    const target = blurredCount >= Math.ceil(n / 2) ? false : true;

    // Snapshot previous states for revert
    const prevMap = new Map<string, boolean>();
    videos.forEach((v) => {
      if (selectedSet.has(v.id)) prevMap.set(v.id, !!v.blurThumbnail);
    });

    // Optimistic update
    setVideos((prev) =>
      prev.map((v) =>
        selectedSet.has(v.id) ? { ...v, blurThumbnail: target } : v,
      ),
    );

    // Persist
    try {
      const { setBlurFlagForVideos } = await import("@/app/actions");
      await setBlurFlagForVideos(selectedItems, target);
    } catch (err) {
      // Revert only affected ids
      console.warn("Failed to persist blur flag, reverting selection.", err);
      setVideos((prev) =>
        prev.map((v) =>
          selectedSet.has(v.id)
            ? { ...v, blurThumbnail: prevMap.get(v.id) ?? v.blurThumbnail }
            : v,
        ),
      );
    }
  };

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
            allGroups={allGroups}
            selectedGroups={selectedGroups}
            onGroupSelect={handleGroupSelect}
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
            selectedGroups={selectedGroups}
            getGroupName={getGroupName}
            onTagRemove={handleTagSelect}
            onGroupRemove={handleGroupSelect}
            onClearAll={handleClearAllFilters}
          />

          {/* Bulk Action Bar */}
          {isSelectionMode && (
            <>
              {console.log(
                "🔍 [LibraryPage] Rendering BulkActionBar with selectedItems:",
                selectedItems,
              )}
              <BulkActionBar
                selectedCount={selectedItems.length}
                selectedVideoIds={selectedItems}
                onClearSelection={clearSelection}
                onDelete={handleBulkDelete}
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
              {deleteError && <p className="text-red-500">{deleteError}</p>}
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
                  onClick={confirmBulkDelete}
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
            <p className="text-red-500">{error}</p>
          ) : videos.length > 0 ? (
            <VideoList
              videos={videos}
              hasMore={hasMore}
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
