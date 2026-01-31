/**
 * Type-safe query key factory for React Query
 *
 * Query keys follow a hierarchical pattern: ['entity', 'filter', 'id']
 * This enables precise cache invalidation and prefetching.
 *
 * Example usage:
 * - queryClient.invalidateQueries({ queryKey: queryKeys.collections.lists() })
 * - queryClient.prefetchQuery({ queryKey: queryKeys.videos.list({ userId }), queryFn: fetchVideos })
 */

// ============================================================================
// USER KEYS
// ============================================================================

export const userKeys = {
  all: ['user'] as const,
  current: () => [...userKeys.all, 'current'] as const,
} as const;

// ============================================================================
// COLLECTION KEYS
// ============================================================================

export const collectionsKeys = {
  all: ['collections'] as const,
  lists: () => [...collectionsKeys.all, 'list'] as const,
  list: (userId: string) => [...collectionsKeys.lists(), { userId }] as const,
  details: () => [...collectionsKeys.all, 'detail'] as const,
  detail: (collectionId: string) =>
    [...collectionsKeys.details(), collectionId] as const,
  videos: (collectionId: string) =>
    [...collectionsKeys.detail(collectionId), 'videos'] as const,
} as const;

// ============================================================================
// PINNED COLLECTION KEYS
// ============================================================================

export const pinnedCollectionsKeys = {
  all: ['pinnedCollections'] as const,
  lists: () => [...pinnedCollectionsKeys.all, 'list'] as const,
  list: (userId: string) =>
    [...pinnedCollectionsKeys.lists(), { userId }] as const,
  recent: (userId: string) =>
    [...pinnedCollectionsKeys.all, 'recent', { userId }] as const,
  status: (userId: string, collectionId: string) =>
    [...pinnedCollectionsKeys.all, 'status', { userId, collectionId }] as const,
} as const;

// ============================================================================
// VIDEO KEYS
// ============================================================================

interface VideoListFilters {
  userId: string;
  search?: string;
  tags?: string[];
  collections?: string[];
}

export const videosKeys = {
  all: ['videos'] as const,
  lists: () => [...videosKeys.all, 'list'] as const,
  list: (filters: VideoListFilters) =>
    [...videosKeys.lists(), filters] as const,
  details: () => [...videosKeys.all, 'detail'] as const,
  detail: (videoId: string) => [...videosKeys.details(), videoId] as const,
  infinite: (filters: Omit<VideoListFilters, 'page'>) =>
    [...videosKeys.all, 'infinite', filters] as const,
} as const;

// ============================================================================
// AGGREGATED QUERY KEYS (for cache invalidation)
// ============================================================================

/**
 * Helper to invalidate all collection-related queries
 * Use after mutations that might affect multiple collection queries
 */
export const getAllCollectionsKeys = () => [collectionsKeys.all];

/**
 * Helper to invalidate all pinned collection queries
 */
export const getAllPinnedCollectionsKeys = () => [pinnedCollectionsKeys.all];

/**
 * Helper to invalidate all video queries
 */
export const getAllVideosKeys = () => [videosKeys.all];
