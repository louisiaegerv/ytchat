"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createCollection,
  renameCollection,
  deleteCollection,
  addVideosToCollection,
  removeVideosFromCollection,
} from "@/app/actions";
import { collectionsKeys, pinnedCollectionsKeys } from "@/lib/queryKeys";
import type { CollectionWithVideoCount } from "@/types/library";

interface CreateCollectionVariables {
  userId: string;
  name: string;
  description?: string;
}

interface RenameCollectionVariables {
  collectionId: string;
  newName: string;
  userId: string;
}

interface DeleteCollectionVariables {
  collectionId: string;
  userId: string;
}

interface AddVideosVariables {
  collectionId: string;
  videoIds: string[];
  userId: string;
}

interface RemoveVideosVariables {
  collectionId: string;
  videoIds: string[];
  userId: string;
}

/**
 * Hook for collection mutations with optimistic updates
 *
 * @example
 * ```tsx
 * const { createCollection, renameCollection, deleteCollection, isCreating } = useCollectionMutations();
 *
 * // Create with optimistic update
 * await createCollection({ userId, name: "My Collection" });
 *
 * // Rename with optimistic update
 * await renameCollection({ collectionId, newName: "New Name", userId });
 * ```
 */
export function useCollectionMutations() {
  const queryClient = useQueryClient();

  // Create collection mutation
  const createMutation = useMutation({
    mutationFn: async (variables: CreateCollectionVariables) => {
      const result = await createCollection(
        variables.userId,
        variables.name,
        variables.description
      );
      return { ...result, variables };
    },
    onSuccess: (result) => {
      // Invalidate the collections list to refetch with new collection
      queryClient.invalidateQueries({
        queryKey: collectionsKeys.list(result.variables.userId),
      });
    },
  });

  // Rename collection mutation with optimistic update
  const renameMutation = useMutation({
    mutationFn: async (variables: RenameCollectionVariables) => {
      await renameCollection(variables.collectionId, variables.newName);
      return variables;
    },
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: collectionsKeys.list(variables.userId),
      });

      // Snapshot the previous value
      const previousCollections = queryClient.getQueryData<CollectionWithVideoCount[]>(
        collectionsKeys.list(variables.userId)
      );

      // Optimistically update to the new value
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

      // Return a context object with the snapshotted value
      return { previousCollections };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousCollections) {
        queryClient.setQueryData(
          collectionsKeys.list(variables.userId),
          context.previousCollections
        );
      }
    },
    onSettled: (data, error, variables) => {
      // Always refetch after error or success to sync with server
      queryClient.invalidateQueries({
        queryKey: collectionsKeys.list(variables.userId),
      });
    },
  });

  // Delete collection mutation with optimistic update
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

      // Optimistically remove from cache
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
      // Invalidate collections list
      queryClient.invalidateQueries({
        queryKey: collectionsKeys.list(variables.userId),
      });
      // Also invalidate pinned collections (deleted one might be pinned)
      queryClient.invalidateQueries({
        queryKey: pinnedCollectionsKeys.lists(),
      });
    },
  });

  // Add videos to collection mutation
  const addVideosMutation = useMutation({
    mutationFn: async (variables: AddVideosVariables) => {
      const result = await addVideosToCollection(
        variables.collectionId,
        variables.videoIds
      );
      return { ...result, variables };
    },
    onSuccess: (result) => {
      // Invalidate both collections and specific collection videos
      queryClient.invalidateQueries({
        queryKey: collectionsKeys.list(result.variables.userId),
      });
      queryClient.invalidateQueries({
        queryKey: collectionsKeys.videos(result.variables.collectionId),
      });
    },
  });

  // Remove videos from collection mutation
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
    // Mutation functions
    createCollection: createMutation.mutateAsync,
    renameCollection: renameMutation.mutateAsync,
    deleteCollection: deleteMutation.mutateAsync,
    addVideosToCollection: addVideosMutation.mutateAsync,
    removeVideosFromCollection: removeVideosMutation.mutateAsync,

    // Pending states for UI
    isCreating: createMutation.isPending,
    isRenaming: renameMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isAddingVideos: addVideosMutation.isPending,
    isRemovingVideos: removeVideosMutation.isPending,
  };
}
