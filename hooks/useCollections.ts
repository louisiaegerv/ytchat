import { useState, useEffect, useCallback } from "react";
import {
  getCollections,
  getCollectionVideos,
  createCollection,
  renameCollection,
  deleteCollection,
  addVideosToCollection,
  removeVideosFromCollection,
} from "@/app/actions";
import type {
  CollectionWithVideoCount,
  Video,
  CollectionWithVideos,
} from "@/types/library";

interface UseCollectionsResult {
  collections: CollectionWithVideoCount[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createCollection: (name: string, description?: string) => Promise<void>;
  renameCollection: (collectionId: string, newName: string) => Promise<void>;
  deleteCollection: (collectionId: string) => Promise<void>;
  addVideosToCollection: (
    collectionId: string,
    videoIds: string[],
  ) => Promise<void>;
  removeVideosFromCollection: (
    collectionId: string,
    videoIds: string[],
  ) => Promise<void>;
  getCollectionVideos: (collectionId: string) => Promise<Video[]>;
}

export function useCollections(userId: string): UseCollectionsResult {
  const [collections, setCollections] = useState<CollectionWithVideoCount[]>(
    [],
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch collections on mount
  const fetchCollections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCollections(userId);
      setCollections(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch collections",
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  // Create a new collection and refresh the list
  const handleCreateCollection = useCallback(
    async (name: string, description?: string) => {
      try {
        setError(null);
        await createCollection(userId, name, description);
        await fetchCollections();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create collection";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [userId, fetchCollections],
  );

  // Rename a collection and refresh the list
  const handleRenameCollection = useCallback(
    async (collectionId: string, newName: string) => {
      try {
        setError(null);
        await renameCollection(collectionId, newName);
        await fetchCollections();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to rename collection";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [fetchCollections],
  );

  // Delete a collection and refresh the list
  const handleDeleteCollection = useCallback(
    async (collectionId: string) => {
      try {
        setError(null);
        await deleteCollection(collectionId);
        await fetchCollections();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete collection";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [fetchCollections],
  );

  // Add videos to a collection
  const handleAddVideosToCollection = useCallback(
    async (collectionId: string, videoIds: string[]) => {
      try {
        setError(null);
        await addVideosToCollection(collectionId, videoIds);
        await fetchCollections();
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to add videos to collection";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [fetchCollections],
  );

  // Remove videos from a collection
  const handleRemoveVideosFromCollection = useCallback(
    async (collectionId: string, videoIds: string[]) => {
      try {
        setError(null);
        await removeVideosFromCollection(collectionId, videoIds);
        await fetchCollections();
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to remove videos from collection";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [fetchCollections],
  );

  // Get videos in a collection
  const handleGetCollectionVideos = useCallback(
    async (collectionId: string): Promise<Video[]> => {
      try {
        setError(null);
        const videos = await getCollectionVideos(collectionId);
        return videos;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to fetch collection videos";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [],
  );

  return {
    collections,
    loading,
    error,
    refetch: fetchCollections,
    createCollection: handleCreateCollection,
    renameCollection: handleRenameCollection,
    deleteCollection: handleDeleteCollection,
    addVideosToCollection: handleAddVideosToCollection,
    removeVideosFromCollection: handleRemoveVideosFromCollection,
    getCollectionVideos: handleGetCollectionVideos,
  };
}
