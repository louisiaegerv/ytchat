"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { pinnedCollectionsKeys } from "@/lib/queryKeys";
import { queryConfig } from "@/lib/queryClient";
import {
  fetchPinnedCollections,
  fetchRecentCollections,
  isCollectionPinned,
} from "@/utils/supabase/pinned-collections";
import type {
  PinnedCollectionDetails,
  CollectionWithLastAccessed,
} from "@/types/library";

interface UsePinnedCollectionsQueryOptions {
  enabled?: boolean;
}

/**
 * Hook to fetch pinned collections for a user
 * No polling - user is the only one who can modify their pinned collections
 *
 * @example
 * ```tsx
 * const { data: pinnedCollections, isLoading } = usePinnedCollectionsQuery(userId);
 * ```
 */
export function usePinnedCollectionsQuery(
  userId: string | null,
  options: UsePinnedCollectionsQueryOptions = {}
) {
  return useQuery({
    queryKey: userId
      ? pinnedCollectionsKeys.list(userId)
      : ["pinnedCollections", "list", "empty"],
    queryFn: async (): Promise<PinnedCollectionDetails[]> => {
      if (!userId) throw new Error("User ID is required");
      return fetchPinnedCollections(userId);
    },
    enabled: !!userId && options.enabled !== false,
    staleTime: queryConfig.pinnedCollections.staleTime,
    gcTime: queryConfig.pinnedCollections.gcTime,
  });
}

/**
 * Hook to fetch recent collections for a user
 * Recent collections are the 5 most recently accessed (excluding pinned)
 *
 * @example
 * ```tsx
 * const { data: recentCollections, isLoading } = useRecentCollectionsQuery(userId);
 * ```
 */
export function useRecentCollectionsQuery(
  userId: string | null,
  pinnedCollectionIds: string[] = [],
  options: UsePinnedCollectionsQueryOptions = {}
) {
  return useQuery({
    queryKey: userId
      ? pinnedCollectionsKeys.recent(userId)
      : ["pinnedCollections", "recent", "empty"],
    queryFn: async (): Promise<CollectionWithLastAccessed[]> => {
      if (!userId) throw new Error("User ID is required");
      return fetchRecentCollections(userId, pinnedCollectionIds);
    },
    enabled: !!userId && options.enabled !== false,
    staleTime: queryConfig.pinnedCollections.staleTime,
    gcTime: queryConfig.pinnedCollections.gcTime,
  });
}

interface UseIsCollectionPinnedQueryOptions {
  enabled?: boolean;
}

/**
 * Hook to check if a specific collection is pinned
 * Used for UI state (showing pin/unpin button)
 *
 * @example
 * ```tsx
 * const { data: isPinned } = useIsCollectionPinnedQuery(userId, collectionId);
 * ```
 */
export function useIsCollectionPinnedQuery(
  userId: string | null,
  collectionId: string | null,
  options: UseIsCollectionPinnedQueryOptions = {}
) {
  return useQuery({
    queryKey:
      userId && collectionId
        ? pinnedCollectionsKeys.status(userId, collectionId)
        : ["pinnedCollections", "status", "empty"],
    queryFn: async (): Promise<boolean> => {
      if (!userId || !collectionId) return false;
      return isCollectionPinned(userId, collectionId);
    },
    enabled: !!userId && !!collectionId && options.enabled !== false,
    staleTime: queryConfig.pinnedCollections.staleTime,
    gcTime: queryConfig.pinnedCollections.gcTime,
  });
}

/**
 * Hook to prefetch pinned collections data (useful for navigation)
 *
 * @example
 * ```tsx
 * const { prefetchPinnedCollections } = usePrefetchPinnedCollections();
 * // On hover over collection link
 * prefetchPinnedCollections(userId);
 * ```
 */
export function usePrefetchPinnedCollections() {
  const queryClient = useQueryClient();

  return {
    prefetchPinnedCollections: (userId: string) => {
      return queryClient.prefetchQuery({
        queryKey: pinnedCollectionsKeys.list(userId),
        queryFn: () => fetchPinnedCollections(userId),
        staleTime: queryConfig.pinnedCollections.staleTime,
      });
    },
    prefetchRecentCollections: (
      userId: string,
      pinnedCollectionIds: string[] = []
    ) => {
      return queryClient.prefetchQuery({
        queryKey: pinnedCollectionsKeys.recent(userId),
        queryFn: () => fetchRecentCollections(userId, pinnedCollectionIds),
        staleTime: queryConfig.pinnedCollections.staleTime,
      });
    },
  };
}
