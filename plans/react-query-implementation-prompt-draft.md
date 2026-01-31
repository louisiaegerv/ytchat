Create a detailed React Query (TanStack Query) migration implementation plan document at `plans/react-query-migration-plan.md`.

## Context

This is a Next.js App Router application using:

- Supabase as the database
- Current context providers: `GlobalDataContext.tsx`, `PinnedCollectionsContext.tsx`, `VideoContext.tsx`
- Current custom hooks: `useCollections.ts`, `usePinnedCollections.ts`, `useVideoQuery.ts`
- Target scale: 1000 users initially, 10k+ users eventually
- Will need to support Teams feature and Automated scans (backend cron job updates)

## Required Plan Structure

### 1. Overview Section

- Brief summary of why React Query is being adopted
- Goals of the migration (eliminate duplicate requests, improve data passing, better caching)
- What will be kept as Context vs migrated to React Query

### 2. Phase-by-Phase Implementation (7 Phases)

**Phase 1: Foundation Setup**

- Install `@tanstack/react-query` and `@tanstack/react-query-devtools`
- Create `lib/queryClient.ts` with default configuration
- Create `app/providers.tsx` with QueryClientProvider
- Update `app/layout.tsx` to use the new providers
- Include specific file changes with complete code examples

**Phase 2: Query Keys and Types**

- Create `lib/queryKeys.ts` with type-safe query key factory
- Define query key patterns for: collections, videos, pinned collections, user data, etc.
- Create types for query responses

**Phase 3: Core Query Hooks**

- Create `hooks/queries/useCollectionsQuery.ts` - migrate from `useCollections.ts`
- Create `hooks/queries/usePinnedCollectionsQuery.ts` - migrate from `usePinnedCollections.ts`
- Create `hooks/queries/useVideosQuery.ts` - migrate from `useVideoQuery.ts`
- Create `hooks/queries/useUserQuery.ts` - for user authentication data
- Each hook should include: query function, staleTime/gcTime settings, error handling, loading states

**Phase 4: Mutation Hooks**

- Create `hooks/mutations/useCollectionMutations.ts` (create, rename, delete)
- Create `hooks/mutations/usePinnedCollectionMutations.ts` (pin, unpin, reorder)
- Create `hooks/mutations/useVideoMutations.ts` (add to collection, remove, etc.)
- Each mutation should include: optimistic updates, cache invalidation on success, rollback on error

**Phase 5: Component Migration**
List all components to be updated with priority order:

- `app/library/page.tsx`
- `app/library/collections/[id]/page.tsx`
- `app/videos/[id]/page.tsx`
- `components/library/CollectionManager.tsx`
- `components/sidebar/app-sidebar.tsx`
- `components/nav-collections.tsx`

For each, specify: current pattern, new pattern, what to remove, what to add

**Phase 6: Context Provider Cleanup**

- Keep: `GlobalDataContext.tsx` (for existingTags), `VideoContext.tsx` (for current video state)
- Refactor/Remove: `PinnedCollectionsContext.tsx` - can be simplified since React Query handles data

**Phase 7: Polling and Real-time Setup**

- Configure polling intervals for team data
- Configure polling intervals for automated scan updates
- Document how to add Supabase Realtime integration later

### 3. File Structure

- Show new file/folder structure after migration
- List all new files to be created
- List all files to be modified
- List any files to be deleted

### 4. Testing Strategy

- How to verify each phase works correctly
- Key scenarios to test (duplicate request elimination, cache invalidation, optimistic updates)

### 5. Rollback Plan

- How to revert if issues arise
- Git branch strategy recommendation

### 6. Code Examples

Include complete code examples for:

- `lib/queryClient.ts`
- `lib/queryKeys.ts`
- `app/providers.tsx`
- At least one complete query hook example
- At least one complete mutation hook example with optimistic updates

## Critical Requirements

- Be very specific and detailed - this plan will be used by an LLM to implement changes
- Include exact file paths
- Include complete, working code examples (not snippets)
- Each phase should result in a working application (no breaking changes mid-phase)
- The plan should be executable step-by-step

Save the complete plan to `plans/react-query-migration-plan.md`.
