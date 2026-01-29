import { createClient } from "@/utils/supabase/client";
import type {
  PinnedCollectionWithGroup,
  CollectionWithLastAccessed,
} from "@/types/library";

const PIN_LIMIT = 6;

/**
 * Fetch all pinned collections for a user with ordering
 * @param userId - The user ID to fetch pinned collections for
 * @returns Array of pinned collections with collection details, ordered by position
 */
export async function fetchPinnedCollections(
  userId: string,
): Promise<PinnedCollectionWithGroup[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pinned_collections")
    .select(
      `
      id,
      user_id,
      collection_id,
      position,
      created_at,
      collections(id, name, description, user_id, created_at, updated_at, last_accessed_at)
    `,
    )
    .eq("user_id", userId)
    .order("position", { ascending: true });

  if (error) throw error;
  return data as PinnedCollectionWithGroup[];
}

/**
 * Fetch 5 most recently accessed collections, excluding pinned ones
 * @param userId - The user ID to fetch recent collections for
 * @param pinnedCollectionIds - Array of collection IDs that are pinned (to exclude from results)
 * @returns Array of recent collections with last_accessed_at, ordered by most recent
 */
export async function fetchRecentCollections(
  userId: string,
  pinnedCollectionIds: string[],
): Promise<CollectionWithLastAccessed[]> {
  const supabase = createClient();

  const query = supabase
    .from("collections")
    .select(
      "id, name, description, user_id, created_at, updated_at, last_accessed_at",
    )
    .eq("user_id", userId)
    .not("last_accessed_at", "is", null)
    .order("last_accessed_at", { ascending: false })
    .limit(5);

  // Exclude pinned collections if any exist
  if (pinnedCollectionIds.length > 0) {
    query.not(
      "id",
      "in",
      `(${pinnedCollectionIds.map((id) => `'${id}'`).join(",")})`,
    );
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as CollectionWithLastAccessed[];
}

/**
 * Check if a collection is pinned for a user
 * @param userId - The user ID to check for
 * @param collectionId - The collection ID to check
 * @returns Promise<boolean> - True if the collection is pinned, false otherwise
 */
export async function isCollectionPinned(
  userId: string,
  collectionId: string,
): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pinned_collections")
    .select("id")
    .eq("user_id", userId)
    .eq("collection_id", collectionId)
    .single();

  if (error && error.code !== "PGRST116") throw error; // PGRST116 = not found
  return !!data;
}

/**
 * Pin a collection for a user
 * @param userId - The user ID to pin the collection for
 * @param collectionId - The collection ID to pin
 * @throws Error with message "PIN_LIMIT_REACHED" if the pin limit is exceeded
 */
export async function pinCollection(
  userId: string,
  collectionId: string,
): Promise<void> {
  const supabase = createClient();

  // Check if already pinned
  const existing = await isCollectionPinned(userId, collectionId);
  if (existing) return;

  // Check pin limit
  const { count, error: countError } = await supabase
    .from("pinned_collections")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (countError) throw countError;
  if (count !== null && count >= PIN_LIMIT) {
    throw new Error("PIN_LIMIT_REACHED");
  }

  // Get current max position
  const { data: maxPos } = await supabase
    .from("pinned_collections")
    .select("position")
    .eq("user_id", userId)
    .order("position", { ascending: false })
    .limit(1)
    .single();

  const newPosition = (maxPos?.position || 0) + 1;

  // Insert new pinned collection
  const { error: insertError } = await supabase
    .from("pinned_collections")
    .insert({
      user_id: userId,
      collection_id: collectionId,
      position: newPosition,
    });

  if (insertError) throw insertError;

  // Update last_accessed_at
  await updateLastAccessedAt(userId, collectionId);
}

/**
 * Unpin a collection for a user
 * @param userId - The user ID to unpin the collection for
 * @param collectionId - The collection ID to unpin
 */
export async function unpinCollection(
  userId: string,
  collectionId: string,
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("pinned_collections")
    .delete()
    .eq("user_id", userId)
    .eq("collection_id", collectionId);

  if (error) throw error;
}

/**
 * Replace a pinned collection with another collection
 * The new collection is appended to the end of the pinned list
 * @param userId - The user ID to replace the pinned collection for
 * @param oldCollectionId - The collection ID to unpin
 * @param newCollectionId - The collection ID to pin
 */
export async function replacePinnedCollection(
  userId: string,
  oldCollectionId: string,
  newCollectionId: string,
): Promise<void> {
  const supabase = createClient();

  // Remove old pin
  const { error: deleteError } = await supabase
    .from("pinned_collections")
    .delete()
    .eq("user_id", userId)
    .eq("collection_id", oldCollectionId);

  if (deleteError) throw deleteError;

  // Add new pin at the end (get max position + 1)
  const { data: maxPos } = await supabase
    .from("pinned_collections")
    .select("position")
    .eq("user_id", userId)
    .order("position", { ascending: false })
    .limit(1)
    .single();

  const newPosition = (maxPos?.position || 0) + 1;

  const { error: insertError } = await supabase
    .from("pinned_collections")
    .insert({
      user_id: userId,
      collection_id: newCollectionId,
      position: newPosition,
    });

  if (insertError) throw insertError;

  // Update last_accessed_at for new collection
  await updateLastAccessedAt(userId, newCollectionId);
}

/**
 * Update pinned collection positions after drag-and-drop reordering
 * @param userId - The user ID to update positions for
 * @param pinnedCollections - Array of pinned collections with their new positions
 */
export async function updatePinnedPositions(
  userId: string,
  pinnedCollections: { id: string; position: number }[],
): Promise<void> {
  const supabase = createClient();

  const updates = pinnedCollections.map(({ id, position }) =>
    supabase
      .from("pinned_collections")
      .update({ position })
      .eq("id", id)
      .eq("user_id", userId),
  );

  await Promise.all(updates);
}

/**
 * Update last_accessed_at for a collection
 * @param userId - The user ID to update for
 * @param collectionId - The collection ID to update
 */
export async function updateLastAccessedAt(
  userId: string,
  collectionId: string,
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("collections")
    .update({ last_accessed_at: new Date().toISOString() })
    .eq("id", collectionId)
    .eq("user_id", userId);

  if (error) throw error;
}

/**
 * Get the pin limit constant
 * @returns The maximum number of collections a user can pin (6)
 */
export function getPinLimit(): number {
  return PIN_LIMIT;
}
