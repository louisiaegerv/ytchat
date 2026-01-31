"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { collectionsKeys } from "@/lib/queryKeys";
import { queryConfig } from "@/lib/queryClient";
import { getCollections, getCollectionVideos } from "@/app/actions";
import type { CollectionWithVideoCount, Video } from "@/types/library";

interface UseCollectionsQueryOptions {
  enabled?: boolean;
}

/**
 * Hook to fetch all collections for a user
 * Uses React Query for caching and deduplication
 *
 * @example
 * ```tsx
 * const { data: collections, isLoading, error } = useCollectionsQuery(userId);
 * ```
 */
export function useCollectionsQuery(
  userId: string | null,
  options: UseCollectionsQueryOptions = {}
) {
  return useQuery({
    queryKey: userId ? collectionsKeys.list(userId) : ["collections", "list", "empty"],
    queryFn: async (): Promise<CollectionWithVideoCount[]> => {
      if (!userId) throw new Error("User ID is required");
      return getCollections(userId);
    },
    enabled: !!userId && options.enabled !== false,
    staleTime: queryConfig.collections.staleTime,
    gcTime: queryConfig.collections.gcTime,
  });
}

interface UseCollectionVideosQueryOptions {
  enabled?: boolean;
}

/**
 * Hook to fetch videos in a specific collection
 *
 * @example
 * ```tsx
 * const { data: videos, isLoading } = useCollectionVideosQuery(collectionId);
 * ```
 */
export function useCollectionVideosQuery(
  collectionId: string | null,
  options: UseCollectionVideosQueryOptions = {}
) {
  return useQuery({
    queryKey: collectionId
      ? collectionsKeys.videos(collectionId)
      : ["collections", "detail", "empty", "videos"],
    queryFn: async (): Promise<Video[]> => {
      if (!collectionId) throw new Error("Collection ID is required");
      return getCollectionVideos(collectionId);
    },
    enabled: !!collectionId && options.enabled !== false,
    staleTime: queryConfig.videos.staleTime,
    gcTime: queryConfig.videos.gcTime,
  });
}

/**
 * Hook to prefetch collections (useful for navigation)
 *
 * @example
 * ```tsx
 * const { prefetchCollections } = usePrefetchCollections();
 * // On hover over a link
 * prefetchCollections(userId);
 * ```
 */
export function usePrefetchCollections() {
  const queryClient = useQueryClient();

  return {
    prefetchCollections: (userId: string) => {
      return queryClient.prefetchQuery({
        queryKey: collectionsKeys.list(userId),
        queryFn: () => getCollections(userId),
        staleTime: queryConfig.collections.staleTime,
      });
    },
    prefetchCollectionVideos: (collectionId: string) => {
      return queryClient.prefetchQuery({
        queryKey: collectionsKeys.videos(collectionId),
        queryFn: () => getCollectionVideos(collectionId),
        staleTime: queryConfig.videos.staleTime,
      });
    },
  };
}
