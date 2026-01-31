"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  pinCollection,
  unpinCollection,
  replacePinnedCollection,
  updatePinnedPositions,
} from "@/utils/supabase/pinned-collections";
import { pinnedCollectionsKeys } from "@/lib/queryKeys";
import type { PinnedCollectionDetails } from "@/types/library";

interface PinCollectionVariables {
  userId: string;
  collectionId: string;
}

interface UnpinCollectionVariables {
  userId: string;
  collectionId: string;
}

interface ReplacePinnedVariables {
  userId: string;
  oldCollectionId: string;
  newCollectionId: string;
}

interface ReorderPinnedVariables {
  userId: string;
  newOrder: { id: string; position: number }[];
}

/**
 * Hook for pinned collection mutations with optimistic updates
 * No polling needed - user is the only one who can modify their pinned collections
 *
 * @example
 * ```tsx
 * const { pinCollection, unpinCollection, handleReorder, isPinning } = usePinnedCollectionMutations();
 *
 * // Pin with optimistic update
 * await pinCollection({ userId, collectionId });
 *
 * // Unpin with optimistic update
 * await unpinCollection({ userId, collectionId });
 *
 * // Reorder with optimistic update
 * await handleReorder({ userId, newOrder: [{ id: '1', position: 1 }, { id: '2', position: 2 }] });
 * ```
 */
export function usePinnedCollectionMutations() {
  const queryClient = useQueryClient();

  // Pin collection mutation with optimistic update
  const pinMutation = useMutation({
    mutationFn: async (variables: PinCollectionVariables) => {
      await pinCollection(variables.userId, variables.collectionId);
      return variables;
    },
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: pinnedCollectionsKeys.list(variables.userId),
      });

      // Snapshot previous value
      const previousPinned = queryClient.getQueryData<PinnedCollectionDetails[]>(
        pinnedCollectionsKeys.list(variables.userId)
      );

      // Optimistically add to pinned list
      // Note: We don't have full collection details here, so we'll add a placeholder
      // and let the background refetch populate the details
      queryClient.setQueryData<PinnedCollectionDetails[]>(
        pinnedCollectionsKeys.list(variables.userId),
        (old) => {
          if (!old) return old;
          
          // Check if already pinned
          if (old.some((p) => p.collection_id === variables.collectionId)) {
            return old;
          }

          // Create optimistic pinned collection
          const optimisticPinned: PinnedCollectionDetails = {
            id: `optimistic-${Date.now()}`,
            user_id: variables.userId,
            collection_id: variables.collectionId,
            position: old.length + 1,
            created_at: new Date().toISOString(),
            collections: [], // Will be populated by refetch
          };

          return [...old, optimisticPinned];
        }
      );

      // Also update the status query for this collection
      queryClient.setQueryData(
        pinnedCollectionsKeys.status(variables.userId, variables.collectionId),
        true
      );

      return { previousPinned };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousPinned) {
        queryClient.setQueryData(
          pinnedCollectionsKeys.list(variables.userId),
          context.previousPinned
        );
      }
      // Revert status
      queryClient.setQueryData(
        pinnedCollectionsKeys.status(variables.userId, variables.collectionId),
        false
      );
      
      // Re-throw PIN_LIMIT_REACHED error so UI can handle it
      if ((err as Error).message === "PIN_LIMIT_REACHED") {
        throw err;
      }
    },
    onSettled: (data, error, variables) => {
      // Always refetch to get accurate data from server
      queryClient.invalidateQueries({
        queryKey: pinnedCollectionsKeys.list(variables.userId),
      });
      queryClient.invalidateQueries({
        queryKey: pinnedCollectionsKeys.status(variables.userId, variables.collectionId),
      });
      // Recent collections may have changed
      queryClient.invalidateQueries({
        queryKey: pinnedCollectionsKeys.recent(variables.userId),
      });
    },
  });

  // Unpin collection mutation with optimistic update
  const unpinMutation = useMutation({
    mutationFn: async (variables: UnpinCollectionVariables) => {
      await unpinCollection(variables.userId, variables.collectionId);
      return variables;
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: pinnedCollectionsKeys.list(variables.userId),
      });

      const previousPinned = queryClient.getQueryData<PinnedCollectionDetails[]>(
        pinnedCollectionsKeys.list(variables.userId)
      );

      // Optimistically remove from pinned list
      queryClient.setQueryData<PinnedCollectionDetails[]>(
        pinnedCollectionsKeys.list(variables.userId),
        (old) => {
          if (!old) return old;
          return old.filter((p) => p.collection_id !== variables.collectionId);
        }
      );

      // Update status query
      queryClient.setQueryData(
        pinnedCollectionsKeys.status(variables.userId, variables.collectionId),
        false
      );

      return { previousPinned };
    },
    onError: (err, variables, context) => {
      if (context?.previousPinned) {
        queryClient.setQueryData(
          pinnedCollectionsKeys.list(variables.userId),
          context.previousPinned
        );
      }
      // Revert status
      queryClient.setQueryData(
        pinnedCollectionsKeys.status(variables.userId, variables.collectionId),
        true
      );
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: pinnedCollectionsKeys.list(variables.userId),
      });
      queryClient.invalidateQueries({
        queryKey: pinnedCollectionsKeys.status(variables.userId, variables.collectionId),
      });
      queryClient.invalidateQueries({
        queryKey: pinnedCollectionsKeys.recent(variables.userId),
      });
    },
  });

  // Replace pinned collection (used when pin limit reached)
  const replaceMutation = useMutation({
    mutationFn: async (variables: ReplacePinnedVariables) => {
      await replacePinnedCollection(
        variables.userId,
        variables.oldCollectionId,
        variables.newCollectionId
      );
      return variables;
    },
    onSuccess: (variables) => {
      // Invalidate all pinned collection queries
      queryClient.invalidateQueries({
        queryKey: pinnedCollectionsKeys.list(variables.userId),
      });
      queryClient.invalidateQueries({
        queryKey: pinnedCollectionsKeys.status(variables.userId, variables.oldCollectionId),
      });
      queryClient.invalidateQueries({
        queryKey: pinnedCollectionsKeys.status(variables.userId, variables.newCollectionId),
      });
      queryClient.invalidateQueries({
        queryKey: pinnedCollectionsKeys.recent(variables.userId),
      });
    },
  });

  // Reorder pinned collections mutation with optimistic update
  const reorderMutation = useMutation({
    mutationFn: async (variables: ReorderPinnedVariables) => {
      await updatePinnedPositions(variables.userId, variables.newOrder);
      return variables;
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: pinnedCollectionsKeys.list(variables.userId),
      });

      const previousPinned = queryClient.getQueryData<PinnedCollectionDetails[]>(
        pinnedCollectionsKeys.list(variables.userId)
      );

      // Optimistically reorder
      queryClient.setQueryData<PinnedCollectionDetails[]>(
        pinnedCollectionsKeys.list(variables.userId),
        (old) => {
          if (!old) return old;
          
          const positionMap = new Map(
            variables.newOrder.map((item) => [item.id, item.position])
          );

          return [...old]
            .map((item) => ({
              ...item,
              position: positionMap.get(item.id) ?? item.position,
            }))
            .sort((a, b) => a.position - b.position);
        }
      );

      return { previousPinned };
    },
    onError: (err, variables, context) => {
      if (context?.previousPinned) {
        queryClient.setQueryData(
          pinnedCollectionsKeys.list(variables.userId),
          context.previousPinned
        );
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: pinnedCollectionsKeys.list(variables.userId),
      });
    },
  });

  return {
    // Mutation functions
    pinCollection: pinMutation.mutateAsync,
    unpinCollection: unpinMutation.mutateAsync,
    replacePinnedCollection: replaceMutation.mutateAsync,
    handleReorder: reorderMutation.mutateAsync,

    // Pending states for UI
    isPinning: pinMutation.isPending,
    isUnpinning: unpinMutation.isPending,
    isReplacing: replaceMutation.isPending,
    isReordering: reorderMutation.isPending,

    // For PinLimitDialog handling
    pinError: pinMutation.error,
  };
}
