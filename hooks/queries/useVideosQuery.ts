"use client";

import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { videosKeys } from "@/lib/queryKeys";
import { queryConfig } from "@/lib/queryClient";
import { createClient } from "@/utils/supabase/client";
import type { Video } from "@/types/library";

const PAGE_SIZE = 12;

interface VideoListFilters {
  userId: string;
  searchQuery?: string;
  selectedTags?: string[];
  selectedCollections?: string[];
}

interface FetchVideosResult {
  videos: Video[];
  nextPage: number | undefined;
}

/**
 * Hook to fetch videos with infinite scroll pagination
 * Replaces the manual pagination logic in LibraryPage
 *
 * @example
 * ```tsx
 * const {
 *   data,
 *   fetchNextPage,
 *   hasNextPage,
 *   isFetchingNextPage,
 *   isLoading,
 * } = useVideosInfiniteQuery({
 *   userId,
 *   searchQuery: debouncedSearch,
 *   selectedTags,
 *   selectedCollections,
 * });
 *
 * const videos = data?.pages.flatMap(page => page.videos) ?? [];
 * ```
 */
export function useVideosInfiniteQuery(filters: VideoListFilters) {
  const supabase = createClient();
  const { userId, searchQuery, selectedTags, selectedCollections } = filters;

  return useInfiniteQuery({
    queryKey: videosKeys.infinite({
      userId,
      search: searchQuery,
      tags: selectedTags,
      collections: selectedCollections,
    }),
    queryFn: async ({ pageParam = 0 }): Promise<FetchVideosResult> => {
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

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to match Video type
      const videos: Video[] = (data || []).map((video: any) => ({
        id: video.id,
        title: video.title,
        youtube_url: video.youtube_url,
        youtube_id: video.youtube_id,
        created_at: video.created_at,
        published_at: video.published_at,
        duration: video.duration,
        views: video.view_count,
        likes: video.like_count,
        comments: video.comment_count,
        channels: video.channels,
        tags: null, // Tags fetched separately
      }));

      // Determine if there's a next page
      const hasMore = videos.length === PAGE_SIZE;

      return {
        videos,
        nextPage: hasMore ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    enabled: !!userId,
    staleTime: queryConfig.videos.staleTime,
    gcTime: queryConfig.videos.gcTime,
  });
}

interface UseVideoQueryOptions {
  enabled?: boolean;
}

/**
 * Hook to fetch a single video by ID
 *
 * @example
 * ```tsx
 * const { data: video, isLoading } = useVideoQuery(videoId);
 * ```
 */
export function useVideoQuery(
  videoId: string | null,
  options: UseVideoQueryOptions = {}
) {
  const supabase = createClient();

  return useQuery({
    queryKey: videoId ? videosKeys.detail(videoId) : ["videos", "detail", "empty"],
    queryFn: async (): Promise<Video | null> => {
      if (!videoId) return null;
      
      const { data, error } = await supabase
        .from("videos")
        .select(
          `id, title, youtube_url, youtube_id, created_at, channel_id, published_at, description, duration, view_count, like_count, comment_count, channels(title)`
        )
        .eq("id", videoId)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        title: data.title,
        youtube_url: data.youtube_url,
        youtube_id: data.youtube_id,
        created_at: data.created_at,
        published_at: data.published_at,
        duration: data.duration,
        views: data.view_count,
        likes: data.like_count,
        comments: data.comment_count,
        channels: data.channels,
        tags: null,
      };
    },
    enabled: !!videoId && options.enabled !== false,
    staleTime: queryConfig.videos.staleTime,
    gcTime: queryConfig.videos.gcTime,
  });
}

/**
 * Hook to prefetch video data (useful for navigation)
 *
 * @example
 * ```tsx
 * const { prefetchVideo } = usePrefetchVideos();
 * // On hover over video card
 * prefetchVideo(videoId);
 * ```
 */
export function usePrefetchVideos() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return {
    prefetchVideo: (videoId: string) => {
      return queryClient.prefetchQuery({
        queryKey: videosKeys.detail(videoId),
        queryFn: async () => {
          const { data, error } = await supabase
            .from("videos")
            .select(
              `id, title, youtube_url, youtube_id, created_at, channel_id, published_at, description, duration, view_count, like_count, comment_count, channels(title)`
            )
            .eq("id", videoId)
            .single();

          if (error) throw error;
          return data;
        },
        staleTime: queryConfig.videos.staleTime,
      });
    },
  };
}
