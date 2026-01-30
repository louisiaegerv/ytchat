"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { getCachedUserId, setCachedUserId } from "@/utils/supabase/auth-cache";
import {
  fetchPinnedCollections,
  fetchRecentCollections,
  isCollectionPinned,
  pinCollection,
  unpinCollection,
  replacePinnedCollection,
  updatePinnedPositions,
  updateLastAccessedAt,
  getPinLimit,
} from "@/utils/supabase/pinned-collections";
import type {
  PinnedCollectionDetails,
  CollectionWithLastAccessed,
} from "@/types/library";

export function usePinnedCollections() {
  const [userId, setUserId] = useState<string | null>(null);
  const [pinnedCollections, setPinnedCollections] = useState<
    PinnedCollectionDetails[]
  >([]);
  const [recentCollections, setRecentCollections] = useState<
    CollectionWithLastAccessed[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncingCollectionId, setSyncingCollectionId] = useState<string | null>(
    null,
  );

  const supabase = createClient();

  // Store userId in ref to keep handleUpdateLastAccessed stable
  const userIdRef = useRef<string | null>(null);

  // Update ref when userId changes
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  // Fetch user ID on mount (with caching to avoid duplicate auth requests)
  useEffect(() => {
    const fetchUserId = async () => {
      // Check cache first to avoid duplicate /auth/v1/user requests
      const cachedUserId = getCachedUserId();
      if (cachedUserId) {
        setUserId(cachedUserId);
        return;
      }

      // Cache miss - fetch from Supabase
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setCachedUserId(user.id);
        setUserId(user.id);
      }
    };
    fetchUserId();
  }, [supabase]);

  // Fetch pinned and recent collections
  const fetchCollections = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const [pinned, recent] = await Promise.all([
        fetchPinnedCollections(userId),
        fetchRecentCollections(
          userId,
          pinnedCollections.map((p) => p.collection_id),
        ),
      ]);

      setPinnedCollections(pinned);
      setRecentCollections(recent);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Track if we've already fetched for this userId to prevent duplicate calls
  const hasFetchedRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Only fetch when userId changes, not when fetchCollections reference changes
    if (userId && userId !== lastUserIdRef.current) {
      lastUserIdRef.current = userId;
      hasFetchedRef.current = false;
    }

    if (userId && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchCollections();
    }
  }, [userId, fetchCollections]);

  // Check if a collection is pinned
  const checkIsPinned = useCallback(
    async (collectionId: string): Promise<boolean> => {
      if (!userId) return false;
      return await isCollectionPinned(userId, collectionId);
    },
    [userId],
  );

  // Pin a collection with optimistic UI update
  const handlePin = useCallback(
    async (collectionId: string): Promise<void> => {
      if (!userId) throw new Error("User not authenticated");

      // Set syncing state immediately
      setSyncingCollectionId(collectionId);

      // Store previous state for rollback
      const previousPinnedCollections = [...pinnedCollections];

      // Create optimistic pinned collection
      const optimisticPinnedCollection: PinnedCollectionDetails = {
        id: `optimistic-${Date.now()}`,
        user_id: userId,
        collection_id: collectionId,
        position: pinnedCollections.length + 1,
        created_at: new Date().toISOString(),
        collections: [],
      };

      // Optimistically update state IMMEDIATELY (before any async operations)
      setPinnedCollections([...pinnedCollections, optimisticPinnedCollection]);

      try {
        // Execute server operations in the background
        await pinCollection(userId, collectionId);
        // Refetch to get actual data from server
        await fetchCollections();
      } catch (err: any) {
        // Revert optimistic update on error
        setPinnedCollections(previousPinnedCollections);
        if (err.message === "PIN_LIMIT_REACHED") {
          throw err;
        }
        throw err;
      } finally {
        // Clear syncing state
        setSyncingCollectionId(null);
      }
    },
    [userId, pinnedCollections, fetchCollections],
  );

  // Unpin a collection with optimistic UI update
  const handleUnpin = useCallback(
    async (collectionId: string): Promise<void> => {
      if (!userId) throw new Error("User not authenticated");

      // Set syncing state immediately
      setSyncingCollectionId(collectionId);

      // Store previous state for rollback
      const previousPinnedCollections = [...pinnedCollections];

      // Optimistically remove collection from state IMMEDIATELY (before any async operations)
      setPinnedCollections(
        pinnedCollections.filter((p) => p.collection_id !== collectionId),
      );

      try {
        // Execute server operations in the background
        await unpinCollection(userId, collectionId);
        // Refetch to get actual data from server
        await fetchCollections();
      } catch (err: any) {
        // Revert optimistic update on error
        setPinnedCollections(previousPinnedCollections);
        throw err;
      } finally {
        // Clear syncing state
        setSyncingCollectionId(null);
      }
    },
    [userId, pinnedCollections, fetchCollections],
  );

  // Replace a pinned collection
  const handleReplace = useCallback(
    async (oldCollectionId: string, newCollectionId: string): Promise<void> => {
      if (!userId) throw new Error("User not authenticated");

      await replacePinnedCollection(userId, oldCollectionId, newCollectionId);
      await fetchCollections();
    },
    [userId, fetchCollections],
  );

  // Update positions after drag-and-drop
  const handleReorder = useCallback(
    async (newOrder: { id: string; position: number }[]): Promise<void> => {
      if (!userId) throw new Error("User not authenticated");

      await updatePinnedPositions(userId, newOrder);
      await fetchCollections();
    },
    [userId, fetchCollections],
  );

  // Update last accessed (without refetch - eliminates cascade of unnecessary requests)
  const handleUpdateLastAccessed = useCallback(
    async (collectionId: string): Promise<void> => {
      const currentUserId = userIdRef.current;
      if (!currentUserId) return;

      await updateLastAccessedAt(currentUserId, collectionId);
      // NO REFETCH HERE - optimistic update only
      // The timestamp update doesn't meaningfully change the data structure
      // so we don't need to refetch pinned/recent collections
    },
    [], // No dependencies - completely stable
  );

  return {
    userId,
    pinnedCollections,
    recentCollections,
    loading,
    error,
    pinLimit: getPinLimit(),
    syncingCollectionId,
    checkIsPinned,
    handlePin,
    handleUnpin,
    handleReplace,
    handleReorder,
    handleUpdateLastAccessed,
    refetch: fetchCollections,
  };
}
