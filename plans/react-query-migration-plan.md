# React Query (TanStack Query) Migration Plan

## Table of Contents

1. [Overview](#1-overview)
2. [Phase-by-Phase Implementation](#2-phase-by-phase-implementation)
3. [File Structure](#3-file-structure)
4. [Testing Strategy](#4-testing-strategy)
5. [Rollback Plan](#5-rollback-plan)
6. [Code Examples](#6-code-examples)

---

## 1. Overview

### Why React Query is Being Adopted

The current application uses a combination of React Context and custom hooks for state management. As the application scales toward 10k+ users and adds features like Teams and Automated scans, several issues have emerged:

1. **Duplicate Requests**: Multiple components fetching the same data independently
2. **Manual Caching**: No built-in caching mechanism - each component manages its own cache
3. **Complex Data Passing**: Props drilling through multiple component layers
4. **Stale Data**: No automatic background refetching when data changes
5. **Optimistic Updates**: Manual implementation with complex rollback logic

### Goals of the Migration

1. **Eliminate Duplicate Requests**: React Query's cache ensures data is fetched once and shared across components
2. **Improve Data Passing**: Components directly access data via hooks instead of prop drilling
3. **Better Caching**: Automatic caching with configurable stale times
4. **Optimistic Updates**: Instant UI feedback with automatic rollback on errors (primary pattern)
5. **Prepare for Future Polling**: Architecture ready for Teams and Automated Scans features
6. **DevTools**: Visual debugging with React Query DevTools

**Note**: Background polling is deferred until Teams/Automated Scans features are implemented. All data is currently user-generated with manual refresh.

### What Will Be Kept vs Migrated

**Keep as Context (Client State):**
- `GlobalDataContext.tsx` - For `existingTags` (UI state, not server data)
- `VideoContext.tsx` - For current video workflow state (temporary form state)

**Migrate to React Query (Server State):**
- Collections data fetching and mutations
- Pinned collections data fetching and mutations
- Video queries with filtering/pagination
- User authentication data

---

## 2. Phase-by-Phase Implementation

### Phase 1: Foundation Setup

**Goal**: Install dependencies and set up the QueryClient provider without breaking existing functionality.

#### 1.1 Install Dependencies

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

#### 1.2 Create `lib/queryClient.ts`

Create a new file for the QueryClient configuration with sensible defaults for the application scale.

#### 1.3 Create `app/providers.tsx`

Create a providers component that wraps the application with QueryClientProvider.

#### 1.4 Update `app/layout.tsx`

Integrate the providers into the root layout while maintaining existing providers.

**Verification**: App should start without errors, React Query DevTools should be visible in development.

---

### Phase 2: Query Keys and Types

**Goal**: Establish type-safe query key patterns that will be used throughout the application.

#### 2.1 Create `lib/queryKeys.ts`

Define query key factories for all data types with proper typing.

#### 2.2 Update `types/library.ts`

Add any additional types needed for React Query responses.

**Verification**: TypeScript compilation passes without errors.

---

### Phase 3: Core Query Hooks

**Goal**: Create React Query hooks that parallel the existing custom hooks, then migrate components.

#### 3.1 Create `hooks/queries/useCollectionsQuery.ts`

Migrate from `useCollections.ts` to use React Query for:
- Fetching collections list
- Caching with appropriate stale time
- Error handling

#### 3.2 Create `hooks/queries/usePinnedCollectionsQuery.ts`

Migrate from `usePinnedCollections.ts` data fetching to React Query for:
- Fetching pinned collections
- Fetching recent collections
- Maintaining separate cache keys

#### 3.3 Create `hooks/queries/useVideosQuery.ts`

Replace `useVideoQuery.ts` with a proper React Query implementation for:
- Video list with pagination
- Search filtering
- Tag and collection filtering

#### 3.4 Create `hooks/queries/useUserQuery.ts`

New hook for user authentication data to prevent duplicate auth requests.

**Verification**: Each hook can be tested independently in a test component.

---

### Phase 4: Mutation Hooks

**Goal**: Create mutation hooks with optimistic updates and proper cache invalidation.

#### 4.1 Create `hooks/mutations/useCollectionMutations.ts`

Implement mutations for:
- `createCollection` - Invalidate collections cache
- `renameCollection` - Optimistic update + invalidate
- `deleteCollection` - Optimistic update + invalidate

#### 4.2 Create `hooks/mutations/usePinnedCollectionMutations.ts`

Implement mutations for:
- `pinCollection` - Optimistic update with position handling
- `unpinCollection` - Optimistic update
- `reorderPinned` - Optimistic update with position recalculation
- `replacePinned` - Combined unpin + pin operation

#### 4.3 Create `hooks/mutations/useVideoMutations.ts`

Implement mutations for:
- `addVideosToCollection` - Invalidate both videos and collections
- `removeVideosFromCollection` - Optimistic update
- `deleteVideos` - Optimistic update

**Verification**: Test each mutation with success and error scenarios.

---

### Phase 5: Component Migration

**Goal**: Update components to use the new React Query hooks.

#### 5.1 `app/library/page.tsx`

**Current Pattern:**
- Uses `useState` for videos, filters, pagination
- Manual `useEffect` for data fetching
- Custom `useVideoQuery` hook that returns a query builder

**New Pattern:**
- Use `useVideosQuery` hook with React Query
- Remove manual state management for data
- Keep UI state (search query, selected filters) in `useState`

**Changes:**
- Remove `useVideoQuery` import
- Add `useVideosQuery` import
- Remove `videos`, `hasMore`, `loading`, `error` states
- Remove `fetchVideos` callback
- Use `useInfiniteQuery` for pagination

#### 5.2 `app/library/collections/[id]/page.tsx`

**Current Pattern:**
- Likely fetches collection and videos separately
- Manual loading/error states

**New Pattern:**
- Use `useCollection` query
- Use `useCollectionVideos` query
- Parallel fetching with `useQueries` if needed

#### 5.3 `app/videos/[id]/page.tsx`

**Current Pattern:**
- Fetches individual video data
- Related videos/chats/summaries

**New Pattern:**
- Use `useVideo` query
- Use `useVideoChats` query
- Use `useVideoSummary` query

#### 5.4 `components/library/CollectionManager.tsx`

**Current Pattern:**
- Uses `usePinnedCollections` context
- Manual `fetchCollections` with `useEffect`
- Local state for collections and pinned status

**New Pattern:**
- Use `useCollectionsQuery` for collections data
- Use `usePinnedCollectionsQuery` for pinned data
- Use mutation hooks for CRUD operations
- Remove `isFetchingRef` duplicate prevention (React Query handles this)

**Changes:**
- Remove `usePinnedCollections` context import
- Add `useCollectionsQuery` and `usePinnedCollectionsQuery` imports
- Add mutation hooks imports
- Remove `collections`, `loading`, `error` states
- Remove `fetchCollections` callback
- Remove `isFetchingRef`

#### 5.5 `components/sidebar/app-sidebar.tsx`

**Current Pattern:**
- Uses `usePinnedCollections` context
- Directly accesses `pinnedCollections`, `recentCollections`, mutation handlers

**New Pattern:**
- Use `usePinnedCollectionsQuery` hook
- Use mutation hooks for pin/unpin/reorder

**Changes:**
- Replace context import with query hooks
- Destructure data from React Query hooks

#### 5.6 `components/nav-collections.tsx`

**Current Pattern:**
- Receives data via props from `app-sidebar`
- No direct data fetching

**New Pattern:**
- Can optionally use hooks directly if prop drilling is an issue
- For Phase 5, keep props pattern but update parent

**Changes:**
- No changes needed in Phase 5 (props interface remains same)
- Optional Phase 6: Use hooks directly

**Verification**: Each page/component should work identically to before.

---

### Phase 6: Context Provider Cleanup

**Goal**: Simplify or remove context providers that are no longer needed.

#### 6.1 Keep `GlobalDataContext.tsx`

**Reason**: `existingTags` is client-side UI state derived from server data, not server state itself. React Query is for server state.

**Changes**: None

#### 6.2 Simplify `PinnedCollectionsContext.tsx`

**Current State**: Provides `pinnedCollections`, `recentCollections`, and all mutation handlers.

**New State**: Can be removed entirely if all consumers use hooks directly, OR simplified to only provide computed values.

**Decision**: Remove entirely - components will use hooks directly.

**Migration Steps:**
1. Update all imports from `usePinnedCollections` (context) to use the new query hooks
2. Remove `PinnedCollectionsProvider` from `app/layout.tsx`
3. Delete `components/PinnedCollectionsContext.tsx`

#### 6.3 Keep `VideoContext.tsx`

**Reason**: This holds temporary form state during video capture workflow, not server data.

**Changes**: None

**Verification**: App works without `PinnedCollectionsProvider` in the tree.

---

### Phase 7: Future Polling Setup (Deferred)

**Goal**: Document patterns for future polling when Teams and Automated Scans features are added.

**Current Decision**: No polling for any data. Rationale:
- All data is user-generated (no external updates during session)
- Pinned collections: Only editable by current user (use optimistic updates)
- Collections: Only editable by current user (use optimistic updates)
- Videos: User manually triggers all changes

**When to add polling:**
- Teams feature: When other users can modify shared collections
- Automated scans: When backend cron jobs process videos asynchronously

#### 7.1 Future: Polling for Team Data (NOT IMPLEMENTED)

When Teams features are added:
- Stale time: 30 seconds
- Refetch interval: 60 seconds when window is focused
- Invalidate on mutation

#### 7.2 Future: Polling for Automated Scans (NOT IMPLEMENTED)

When automated "streams" feature is added (backend cron jobs processing videos):
- Stale time: 10 seconds
- Refetch interval: 30 seconds for "processing" videos
- Exponential backoff for completed videos

#### 7.3 Document Manual Refresh Pattern

For now, users manually trigger data updates. Document pattern for:
- Manual refresh button that calls `queryClient.invalidateQueries()`
- Pull-to-refresh implementation
- When to add polling in the future

**Verification**: Manual refresh triggers refetch, no automatic polling occurs.

---

## 3. File Structure

### New Files to Create

```
lib/
  └── queryClient.ts          # QueryClient configuration
  └── queryKeys.ts            # Type-safe query key factory

app/
  └── providers.tsx           # QueryClientProvider wrapper

hooks/
  └── queries/
      └── useCollectionsQuery.ts
      └── usePinnedCollectionsQuery.ts
      └── useVideosQuery.ts
      └── useUserQuery.ts
  └── mutations/
      └── useCollectionMutations.ts
      └── usePinnedCollectionMutations.ts
      └── useVideoMutations.ts
```

### Files to Modify

```
package.json                  # Add @tanstack/react-query dependencies
app/layout.tsx               # Add QueryClientProvider
app/library/page.tsx         # Use React Query hooks
app/library/collections/[id]/page.tsx  # Use React Query hooks
app/videos/[id]/page.tsx     # Use React Query hooks
components/library/CollectionManager.tsx  # Use React Query hooks
components/sidebar/app-sidebar.tsx        # Use React Query hooks
```

### Files to Delete (After Migration)

```
components/PinnedCollectionsContext.tsx    # Replaced by React Query
hooks/usePinnedCollections.ts              # Replaced by query hooks
hooks/useCollections.ts                    # Replaced by query hooks
hooks/useVideoQuery.ts                     # Replaced by query hooks
```

---

## 4. Testing Strategy

### Phase 1-2 Testing

- [ ] App starts without errors
- [ ] React Query DevTools visible in development
- [ ] TypeScript compilation passes

### Phase 3-4 Testing

- [ ] Query hooks return correct data
- [ ] Loading states work correctly
- [ ] Error states work correctly
- [ ] Cache is shared between components
- [ ] Stale time respects configuration

### Phase 5 Testing (Per Component)

**Library Page:**
- [ ] Videos load on initial render
- [ ] Search filtering works
- [ ] Tag filtering works
- [ ] Collection filtering works
- [ ] Infinite scroll loads more videos
- [ ] No duplicate requests in Network tab

**Collection Manager:**
- [ ] Collections load on initial render
- [ ] Create collection works
- [ ] Rename collection works
- [ ] Delete collection works
- [ ] Pin/unpin works
- [ ] Optimistic updates reflect immediately

**App Sidebar:**
- [ ] Pinned collections display
- [ ] Recent collections display
- [ ] Drag-and-drop reorder works
- [ ] Pin/unpin from sidebar works

### Phase 6 Testing

- [ ] App works without PinnedCollectionsProvider
- [ ] No console errors
- [ ] All imports updated correctly

### Phase 7 Testing (Future)

- [ ] Polling patterns documented for Teams feature
- [ ] Polling patterns documented for Automated Scans
- [ ] Manual refresh works correctly (invalidateQueries)

### Key Scenarios to Test

1. **Duplicate Request Elimination**: Open two components that need the same data, verify only one request in Network tab
2. **Cache Invalidation**: Create a collection, verify it appears in list without manual refresh
3. **Optimistic Updates**: Pin a collection, verify it moves immediately before server confirms
4. **Rollback on Error**: Simulate network error during pin, verify UI reverts
5. **Race Conditions**: Rapidly pin/unpin, verify state remains consistent

---

## 5. Rollback Plan

### Git Branch Strategy

1. **Create feature branch**: `git checkout -b feature/react-query-migration`
2. **Commit after each phase**: Make atomic commits for easy rollback
3. **Keep branch updated**: Regularly rebase on main

### Rollback Scenarios

#### Scenario 1: Issue During Development

```bash
# Discard changes in specific file
git checkout HEAD -- path/to/file

# Or discard entire phase
git reset --hard HEAD~1
```

#### Scenario 2: Issue After Merge

```bash
# Revert entire merge commit
git revert -m 1 <merge-commit-hash>

# Or revert specific phase by reverting multiple commits
git revert <commit-hash-1> <commit-hash-2>
```

#### Scenario 3: Production Issue

1. Immediate: Revert the merge commit
2. Investigate: Use feature branch to reproduce and fix
3. Re-merge: After fix is verified

### Data Compatibility

- No database schema changes
- No API changes
- Rollback only affects client-side caching behavior

---

## 6. Code Examples

### 6.1 `lib/queryClient.ts`

```typescript
"use client";

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep inactive data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 3 times with exponential backoff
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // No automatic refetching on window focus (manual refresh only)
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      // No polling - user-generated data only
      refetchInterval: false,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
});

// Query client configuration for different data types
export const queryConfig = {
  collections: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  },
  pinnedCollections: {
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 2 * 60 * 1000, // 2 minutes
  },
  videos: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  },
  user: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  },
} as const;
```

### 6.2 `lib/queryKeys.ts`

```typescript
/**
 * Type-safe query key factory for React Query
 * 
 * Query keys should be arrays that follow a hierarchical pattern:
 * ['entity', 'filter', 'id']
 * 
 * Example:
 * - ['collections', 'list', { userId }]
 * - ['collections', 'detail', collectionId]
 * - ['videos', 'list', { userId, search, tags, collections }]
 */

// Base key segments
export const queryKeys = {
  // User authentication
  user: {
    all: ['user'] as const,
    current: () => [...queryKeys.user.all, 'current'] as const,
  },

  // Collections
  collections: {
    all: ['collections'] as const,
    lists: () => [...queryKeys.collections.all, 'list'] as const,
    list: (filters: { userId: string }) => 
      [...queryKeys.collections.lists(), filters] as const,
    details: () => [...queryKeys.collections.all, 'detail'] as const,
    detail: (collectionId: string) => 
      [...queryKeys.collections.details(), collectionId] as const,
    videos: (collectionId: string) => 
      [...queryKeys.collections.detail(collectionId), 'videos'] as const,
  },

  // Pinned collections
  pinnedCollections: {
    all: ['pinnedCollections'] as const,
    lists: () => [...queryKeys.pinnedCollections.all, 'list'] as const,
    list: (filters: { userId: string }) => 
      [...queryKeys.pinnedCollections.lists(), filters] as const,
    recent: (filters: { userId: string }) => 
      [...queryKeys.pinnedCollections.all, 'recent', filters] as const,
    status: (filters: { userId: string; collectionId: string }) => 
      [...queryKeys.pinnedCollections.all, 'status', filters] as const,
  },

  // Videos
  videos: {
    all: ['videos'] as const,
    lists: () => [...queryKeys.videos.all, 'list'] as const,
    list: (filters: { 
      userId: string; 
      search?: string; 
      tags?: string[]; 
      collections?: string[];
    }) => [...queryKeys.videos.lists(), filters] as const,
    details: () => [...queryKeys.videos.all, 'detail'] as const,
    detail: (videoId: string) => 
      [...queryKeys.videos.details(), videoId] as const,
    infinite: (filters: {
      userId: string;
      search?: string;
      tags?: string[];
      collections?: string[];
    }) => [...queryKeys.videos.all, 'infinite', filters] as const,
  },
} as const;

// Helper type for query key inference
export type QueryKeys = typeof queryKeys;
```

### 6.3 `app/providers.tsx`

```typescript
"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@/lib/queryClient";
import { GlobalDataProvider } from "@/components/GlobalDataContext";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <GlobalDataProvider>
        {children}
      </GlobalDataProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### 6.4 `hooks/queries/useCollectionsQuery.ts`

```typescript
"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { queryConfig } from "@/lib/queryClient";
import { getCollections, getCollectionVideos } from "@/app/actions";
import type { CollectionWithVideoCount, Video } from "@/types/library";

// Query key factory helper
const collectionsKeys = {
  all: ['collections'] as const,
  lists: () => [...collectionsKeys.all, 'list'] as const,
  list: (userId: string) => [...collectionsKeys.lists(), { userId }] as const,
  details: () => [...collectionsKeys.all, 'detail'] as const,
  detail: (collectionId: string) => [...collectionsKeys.details(), collectionId] as const,
  videos: (collectionId: string) => [...collectionsKeys.detail(collectionId), 'videos'] as const,
};

interface UseCollectionsQueryOptions {
  enabled?: boolean;
}

/**
 * Hook to fetch all collections for a user
 * Uses React Query for caching and automatic refetching
 */
export function useCollectionsQuery(
  userId: string | null,
  options: UseCollectionsQueryOptions = {}
) {
  return useQuery({
    queryKey: userId ? collectionsKeys.list(userId) : ['collections', 'list', 'empty'],
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
 */
export function useCollectionVideosQuery(
  collectionId: string | null,
  options: UseCollectionVideosQueryOptions = {}
) {
  return useQuery({
    queryKey: collectionId 
      ? collectionsKeys.videos(collectionId) 
      : ['collections', 'detail', 'empty', 'videos'],
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
```

### 6.5 `hooks/mutations/useCollectionMutations.ts`

```typescript
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createCollection,
  renameCollection,
  deleteCollection,
  addVideosToCollection,
  removeVideosFromCollection,
} from "@/app/actions";
import type { CollectionWithVideoCount } from "@/types/library";

// Query key factory (should be shared with queries)
const collectionsKeys = {
  all: ['collections'] as const,
  lists: () => [...collectionsKeys.all, 'list'] as const,
  list: (userId: string) => [...collectionsKeys.lists(), { userId }] as const,
  details: () => [...collectionsKeys.all, 'detail'] as const,
  detail: (collectionId: string) => [...collectionsKeys.details(), collectionId] as const,
  videos: (collectionId: string) => [...collectionsKeys.detail(collectionId), 'videos'] as const,
};

interface CreateCollectionVariables {
  userId: string;
  name: string;
  description?: string;
}

interface RenameCollectionVariables {
  collectionId: string;
  newName: string;
  userId: string; // For cache invalidation
}

interface DeleteCollectionVariables {
  collectionId: string;
  userId: string; // For cache invalidation
}

interface AddVideosVariables {
  collectionId: string;
  videoIds: string[];
  userId: string; // For cache invalidation
}

interface RemoveVideosVariables {
  collectionId: string;
  videoIds: string[];
  userId: string; // For cache invalidation
}

/**
 * Hook for collection mutations with optimistic updates
 */
export function useCollectionMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (variables: CreateCollectionVariables) => {
      const { collectionId } = await createCollection(
        variables.userId,
        variables.name,
        variables.description
      );
      return { collectionId, variables };
    },
    onSuccess: (result) => {
      // Invalidate the collections list to refetch
      queryClient.invalidateQueries({
        queryKey: collectionsKeys.list(result.variables.userId),
      });
    },
  });

  const renameMutation = useMutation({
    mutationFn: async (variables: RenameCollectionVariables) => {
      await renameCollection(variables.collectionId, variables.newName);
      return variables;
    },
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: collectionsKeys.list(variables.userId),
      });

      // Snapshot previous value
      const previousCollections = queryClient.getQueryData<CollectionWithVideoCount[]>(
        collectionsKeys.list(variables.userId)
      );

      // Optimistically update
      queryClient.setQueryData<CollectionWithVideoCount[]>(
        collectionsKeys.list(variables.userId),
        (old) => {
          if (!old) return old;
          return old.map((collection) =>
            collection.id === variables.collectionId
              ? { ...collection, name: variables.newName }
              : collection
          );
        }
      );

      return { previousCollections };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousCollections) {
        queryClient.setQueryData(
          collectionsKeys.list(variables.userId),
          context.previousCollections
        );
      }
    },
    onSettled: (data, error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({
        queryKey: collectionsKeys.list(variables.userId),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (variables: DeleteCollectionVariables) => {
      await deleteCollection(variables.collectionId);
      return variables;
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: collectionsKeys.list(variables.userId),
      });

      const previousCollections = queryClient.getQueryData<CollectionWithVideoCount[]>(
        collectionsKeys.list(variables.userId)
      );

      queryClient.setQueryData<CollectionWithVideoCount[]>(
        collectionsKeys.list(variables.userId),
        (old) => {
          if (!old) return old;
          return old.filter((collection) => collection.id !== variables.collectionId);
        }
      );

      return { previousCollections };
    },
    onError: (err, variables, context) => {
      if (context?.previousCollections) {
        queryClient.setQueryData(
          collectionsKeys.list(variables.userId),
          context.previousCollections
        );
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: collectionsKeys.list(variables.userId),
      });
      // Also invalidate any pinned collections since the deleted one might be pinned
      queryClient.invalidateQueries({
        queryKey: ['pinnedCollections'],
      });
    },
  });

  const addVideosMutation = useMutation({
    mutationFn: async (variables: AddVideosVariables) => {
      const result = await addVideosToCollection(
        variables.collectionId,
        variables.videoIds
      );
      return { ...result, variables };
    },
    onSuccess: (result) => {
      // Invalidate both the collection list and the specific collection videos
      queryClient.invalidateQueries({
        queryKey: collectionsKeys.list(result.variables.userId),
      });
      queryClient.invalidateQueries({
        queryKey: collectionsKeys.videos(result.variables.collectionId),
      });
    },
  });

  const removeVideosMutation = useMutation({
    mutationFn: async (variables: RemoveVideosVariables) => {
      const result = await removeVideosFromCollection(
        variables.collectionId,
        variables.videoIds
      );
      return { ...result, variables };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: collectionsKeys.list(result.variables.userId),
      });
      queryClient.invalidateQueries({
        queryKey: collectionsKeys.videos(result.variables.collectionId),
      });
    },
  });

  return {
    createCollection: createMutation.mutateAsync,
    renameCollection: renameMutation.mutateAsync,
    deleteCollection: deleteMutation.mutateAsync,
    addVideosToCollection: addVideosMutation.mutateAsync,
    removeVideosFromCollection: removeVideosMutation.mutateAsync,
    // Expose pending states for UI
    isCreating: createMutation.isPending,
    isRenaming: renameMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isAddingVideos: addVideosMutation.isPending,
    isRemovingVideos: removeVideosMutation.isPending,
  };
}
```

---

## Summary

This migration plan provides a structured approach to adopting React Query in the Slipstream application. Each phase builds upon the previous one, ensuring the application remains functional throughout the migration.

### Key Principles

1. **No Polling**: All data is user-generated; polling deferred until Teams/Automated Scans features
2. **Optimistic Updates**: Primary pattern for UI feedback - update locally first, sync in background
3. **Deduplication**: Shared cache eliminates duplicate requests across components
4. **Manual Refresh**: Users control when data refreshes via navigation or explicit refresh

### Migration Outcomes

- **Elimination of duplicate network requests** via shared cache
- **Optimistic updates** with automatic rollback for instant UI feedback
- **Simplified component code** - no manual loading/error state management
- **Prepared for future polling** when Teams and Automated Scans features are added
- **Improved debugging** with React Query DevTools

### Cost Optimization

With no polling and optimized stale times:
- ~12 requests/user/hour maximum
- ~288K requests/day for 1000 users
- Fits comfortably within Supabase Pro tier ($25/mo)

### Future Enhancements

When implementing:
- **Teams feature**: Add polling for shared collections
- **Automated Scans**: Add polling for video processing status
- **Supabase Realtime**: Subscribe to changes instead of polling

Estimated timeline: 1-2 weeks for complete migration (simplified without polling logic), with each phase being independently deployable.
