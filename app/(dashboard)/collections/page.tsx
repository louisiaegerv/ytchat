"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CollectionThumbnailGrid } from "@/components/collections/CollectionThumbnailGrid";
import CreateCollectionDialog from "@/components/library/CreateCollectionDialog";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useUserId } from "@/hooks/queries/useUserQuery";

import type { Collection as CollectionType } from "@/types/library";
import { Folder, Grid3X3, List, Plus, Search, ArrowRight, Video, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { collectionsKeys } from "@/lib/queryKeys";

const PAGE_SIZE = 12;

type ViewMode = "grid" | "list";
type SortOption = "recent" | "name" | "videos";

interface CollectionWithVideoCount extends CollectionType {
  video_count: number;
}

// Fetch paginated collections with video counts
const fetchCollectionsWithCounts = async (
  userId: string, 
  pageParam: number
): Promise<CollectionWithVideoCount[]> => {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_collections_with_counts_paginated", {
    p_user_id: userId,
    p_limit: PAGE_SIZE,
    p_offset: pageParam * PAGE_SIZE,
  });

  if (error) {
    console.error("Error fetching collections:", error);
    throw new Error(error.message);
  }

  return (data || []).map((item) => ({
    ...item,
    video_count: Number(item.video_count) || 0,
  }));
};

export default function CollectionsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Use React Query hook for user ID
  const { userId } = useUserId();

  // Intersection observer ref for infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Use React Query infinite query for collections with caching
  const { 
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch 
  } = useInfiniteQuery({
    queryKey: [...collectionsKeys.list(userId || ""), "infinite"],
    queryFn: ({ pageParam }) => fetchCollectionsWithCounts(userId!, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // If we got a full page, there might be more
      if (lastPage.length === PAGE_SIZE) {
        return allPages.length;
      }
      return undefined;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Flatten collections from all pages
  const collections = data?.pages.flatMap((page) => page) ?? [];

  // Filter and sort collections client-side
  const filteredCollections = collections
    .filter((c) =>
      c.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.name || "").localeCompare(b.name || "");
        case "videos":
          return b.video_count - a.video_count;
        case "recent":
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Refetch collections after creating a new one
  const handleCreateSuccess = () => {
    refetch();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Show loading skeleton while waiting for userId OR while fetching data
  if (!userId || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Collections</h1>
          <p className="text-muted-foreground">
            Organize and analyze your videos
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Collection
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          >
            <option value="recent">Most Recent</option>
            <option value="name">Name</option>
            <option value="videos">Video Count</option>
          </select>
          <div className="flex border rounded-md overflow-hidden">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              className="rounded-none h-9 w-9"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              className="rounded-none h-9 w-9"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Collections */}
      {filteredCollections.length === 0 && !isLoading ? (
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <Folder className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <h3 className="text-lg font-medium mb-2">No collections yet</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery
              ? "No collections match your search"
              : "Create your first collection to organize videos"}
          </p>
          {!searchQuery && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Collection
            </Button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCollections.map((collection) => (
            <Link key={collection.id} href={`/collections/${collection.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-64 flex flex-col overflow-hidden group">
                <CardContent className="p-4 flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Folder className="h-5 w-5 text-primary flex-shrink-0" />
                      <h3 
                        className="font-semibold text-primary truncate"
                        title={collection.name || "Untitled Collection"}
                      >
                        {collection.name || "Untitled Collection"}
                      </h3>
                    </div>
                  </div>
                  
                  {/* Video count */}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                    <Video className="h-4 w-4" />
                    <span>
                      {collection.video_count} video
                      {collection.video_count !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Thumbnail Grid */}
                  <div className="flex-1 min-h-0">
                    <CollectionThumbnailGrid
                      collectionId={collection.id}
                      videoCount={collection.video_count}
                      size="md"
                    />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredCollections.map((collection) => (
            <Link key={collection.id} href={`/collections/${collection.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Folder className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {collection.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {collection.video_count} video{collection.video_count !== 1 ? "s" : ""} • Updated {formatDate(collection.updated_at)}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Infinite Scroll Trigger */}
      {hasNextPage && (
        <div
          ref={loadMoreRef}
          className="flex items-center justify-center py-8"
        >
          {isFetchingNextPage ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading more...</span>
            </div>
          ) : (
            <div className="h-8" /> // Spacer for intersection observer
          )}
        </div>
      )}

      {/* Create Collection Dialog */}
      {userId && (
        <CreateCollectionDialog
          userId={userId}
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
}
