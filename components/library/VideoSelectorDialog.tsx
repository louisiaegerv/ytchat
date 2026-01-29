"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, ChevronLeft, ChevronRight, Check } from "lucide-react";
import type { Video } from "@/types/library";

interface VideoSelectorDialogProps {
  collectionId?: string;
  preSelectedVideoIds?: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (selectedVideoIds: string[]) => void;
}

const PAGE_SIZE = 20;

export default function VideoSelectorDialog({
  collectionId,
  preSelectedVideoIds = [],
  open,
  onOpenChange,
  onConfirm,
}: VideoSelectorDialogProps) {
  const supabase = createClient();

  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(preSelectedVideoIds),
  );
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedIds(new Set(preSelectedVideoIds));
      setPage(0);
      setHasMore(true);
      setSearchQuery("");
      setDebouncedSearch("");
    }
  }, [open, preSelectedVideoIds]);

  // Fetch videos
  const fetchVideos = useCallback(
    async (pageToFetch: number, reset = false) => {
      setLoading(true);
      try {
        let query = supabase
          .from("videos")
          .select(
            `
            id,
            title,
            youtube_url,
            youtube_id,
            created_at,
            published_at,
            duration,
            views,
            likes,
            comments,
            channels (title),
            tags
          `,
          )
          .order("created_at", { ascending: false })
          .range(pageToFetch * PAGE_SIZE, (pageToFetch + 1) * PAGE_SIZE - 1);

        if (debouncedSearch) {
          query = query.ilike("title", `%${debouncedSearch}%`);
        }

        const { data, error } = await query;

        if (error) throw error;

        if (reset) {
          setVideos(data || []);
        } else {
          setVideos((prev) => [...prev, ...(data || [])]);
        }

        setHasMore((data?.length || 0) === PAGE_SIZE);
      } catch (err: any) {
        console.error("Failed to fetch videos:", err);
      } finally {
        setLoading(false);
      }
    },
    [supabase, debouncedSearch],
  );

  // Initial fetch
  useEffect(() => {
    if (open) {
      fetchVideos(0, true);
    }
  }, [open, fetchVideos]);

  // Handle search
  useEffect(() => {
    if (open) {
      setPage(0);
      setHasMore(true);
      fetchVideos(0, true);
    }
  }, [debouncedSearch, open, fetchVideos]);

  // Load more
  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchVideos(nextPage, false);
    }
  };

  // Toggle selection
  const toggleSelection = (videoId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(videoId)) {
        next.delete(videoId);
      } else {
        next.add(videoId);
      }
      return next;
    });
  };

  // Handle confirm
  const handleConfirm = () => {
    onConfirm(Array.from(selectedIds));
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Videos</DialogTitle>
          <DialogDescription>
            Choose videos to add to this collection.
          </DialogDescription>
        </DialogHeader>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Video list */}
        <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[400px] border rounded-md">
          {loading && videos.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Loading videos...
            </div>
          ) : videos.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No videos found
            </div>
          ) : (
            <div className="divide-y">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    id={`video-${video.id}`}
                    checked={selectedIds.has(video.id)}
                    onCheckedChange={() => toggleSelection(video.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor={`video-${video.id}`}
                      className="font-medium text-sm text-primary truncate cursor-pointer"
                    >
                      {video.title || "Untitled Video"}
                    </label>
                    <p className="text-xs text-muted-foreground truncate">
                      {video.channels?.title || "Unknown Channel"}
                    </p>
                  </div>
                  {selectedIds.has(video.id) && (
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {hasMore && videos.length > 0 && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={loadMore}
              disabled={loading}
            >
              {loading ? "Loading..." : "Load More"}
            </Button>
          </div>
        )}

        {/* Footer */}
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={selectedIds.size === 0}>
            Add {selectedIds.size} video{selectedIds.size !== 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
