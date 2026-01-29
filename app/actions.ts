"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email and password are required",
    );
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error(error.code + " " + error.message);
    return encodedRedirect("error", "/sign-up", error.message);
  } else {
    return encodedRedirect(
      "success",
      "/sign-up",
      "Thanks for signing up! Please check your email for a verification link.",
    );
  }
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/login", error.message);
  }

  return redirect("/capture");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password update failed",
    );
  }

  encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/login");
};

/**
 * Persist per-user blur flag for a set of videos.
 */
export async function setBlurFlagForVideos(
  videoIds: string[],
  value: boolean,
): Promise<{ updatedIds: string[] }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("Not authenticated");
  }

  // Deduplicate IDs
  const uniqueIds = Array.from(new Set(videoIds.filter(Boolean)));
  if (uniqueIds.length === 0) {
    return { updatedIds: [] };
  }

  // Chunking to avoid payload limits
  const chunkSize = 200;
  const chunks: string[][] = [];
  for (let i = 0; i < uniqueIds.length; i += chunkSize) {
    chunks.push(uniqueIds.slice(i, i + chunkSize));
  }

  for (const chunk of chunks) {
    const rows = chunk.map((id) => ({
      user_id: user.id,
      video_id: id,
      blur_thumbnail: value,
    }));

    const { error } = await supabase
      .from("user_video_flags")
      .upsert(rows, { onConflict: "user_id,video_id" });

    if (error) {
      throw new Error(`Failed to persist blur flags: ${error.message}`);
    }
  }

  return { updatedIds: uniqueIds };
}

/**
 * Create a new collection for a user.
 */
export async function createCollection(
  userId: string,
  name: string,
  description?: string,
): Promise<{ collectionId: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("Not authenticated");
  }

  if (!name || name.trim() === "") {
    throw new Error("Collection name cannot be empty");
  }

  const { data, error } = await supabase
    .from("collections")
    .insert({
      user_id: userId,
      name: name.trim(),
      description: description?.trim() || null,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to create collection: ${error.message}`);
  }

  return { collectionId: data.id };
}

/**
 * Rename an existing collection.
 */
export async function renameCollection(
  collectionId: string,
  newName: string,
): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("Not authenticated");
  }

  if (!newName || newName.trim() === "") {
    throw new Error("Collection name cannot be empty");
  }

  // Verify user ownership
  const { data: collection, error: fetchError } = await supabase
    .from("collections")
    .select("user_id")
    .eq("id", collectionId)
    .single();

  if (fetchError || !collection) {
    throw new Error("Collection not found");
  }

  if (collection.user_id !== user.id) {
    throw new Error("Not authorized to modify this collection");
  }

  const { error } = await supabase
    .from("collections")
    .update({ name: newName.trim() })
    .eq("id", collectionId);

  if (error) {
    throw new Error(`Failed to rename collection: ${error.message}`);
  }

  return { success: true };
}

/**
 * Delete a collection and its associated video_collections records.
 */
export async function deleteCollection(
  collectionId: string,
): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("Not authenticated");
  }

  // Verify user ownership
  const { data: collection, error: fetchError } = await supabase
    .from("collections")
    .select("user_id")
    .eq("id", collectionId)
    .single();

  if (fetchError || !collection) {
    throw new Error("Collection not found");
  }

  if (collection.user_id !== user.id) {
    throw new Error("Not authorized to delete this collection");
  }

  // Delete the collection (cascade will handle video_collections)
  const { error } = await supabase
    .from("collections")
    .delete()
    .eq("id", collectionId);

  if (error) {
    throw new Error(`Failed to delete collection: ${error.message}`);
  }

  return { success: true };
}

/**
 * Add videos to a collection.
 */
export async function addVideosToCollection(
  collectionId: string,
  videoIds: string[],
): Promise<{ addedCount: number }> {
  console.log("🔍 [addVideosToCollection] Function called");
  console.log("🔍 [addVideosToCollection] collectionId:", collectionId);
  console.log("🔍 [addVideosToCollection] videoIds:", videoIds);
  console.log("🔍 [addVideosToCollection] videoIds.length:", videoIds.length);

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("Not authenticated");
  }

  // Verify user ownership
  const { data: collection, error: fetchError } = await supabase
    .from("collections")
    .select("user_id")
    .eq("id", collectionId)
    .single();

  if (fetchError || !collection) {
    throw new Error("Collection not found");
  }

  if (collection.user_id !== user.id) {
    throw new Error("Not authorized to modify this collection");
  }

  // Deduplicate video IDs
  const uniqueIds = Array.from(new Set(videoIds.filter(Boolean)));
  if (uniqueIds.length === 0) {
    return { addedCount: 0 };
  }

  // Create video_collections records (upsert to handle duplicates)
  const rows = uniqueIds.map((videoId) => ({
    video_id: videoId,
    group_id: collectionId,
  }));

  const { error } = await supabase
    .from("video_collections")
    .upsert(rows, { onConflict: "video_id,group_id", ignoreDuplicates: true });

  if (error) {
    throw new Error(`Failed to add videos to collection: ${error.message}`);
  }

  return { addedCount: uniqueIds.length };
}

/**
 * Remove videos from a collection.
 */
export async function removeVideosFromCollection(
  collectionId: string,
  videoIds: string[],
): Promise<{ removedCount: number }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("Not authenticated");
  }

  // Verify user ownership
  const { data: collection, error: fetchError } = await supabase
    .from("collections")
    .select("user_id")
    .eq("id", collectionId)
    .single();

  if (fetchError || !collection) {
    throw new Error("Collection not found");
  }

  if (collection.user_id !== user.id) {
    throw new Error("Not authorized to modify this collection");
  }

  // Deduplicate video IDs
  const uniqueIds = Array.from(new Set(videoIds.filter(Boolean)));
  if (uniqueIds.length === 0) {
    return { removedCount: 0 };
  }

  const { error } = await supabase
    .from("video_collections")
    .delete()
    .eq("group_id", collectionId)
    .in("video_id", uniqueIds);

  if (error) {
    throw new Error(
      `Failed to remove videos from collection: ${error.message}`,
    );
  }

  return { removedCount: uniqueIds.length };
}

/**
 * Get all collections for a user with video count.
 */
export async function getCollections(
  userId: string,
): Promise<import("@/types/library").CollectionWithVideoCount[]> {
  console.log("🔍 [getCollections] Server action called with userId:", userId);
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("Not authenticated");
  }

  // Fetch collections with video count using a join
  const { data, error } = await supabase
    .from("collections")
    .select(
      `
      id,
      name,
      description,
      user_id,
      created_at,
      updated_at,
      video_collections(count)
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch collections: ${error.message}`);
  }

  // Transform the data to match CollectionWithVideoCount type
  return (data || []).map((collection) => ({
    id: collection.id,
    name: collection.name,
    description: collection.description,
    user_id: collection.user_id,
    created_at: collection.created_at,
    updated_at: collection.updated_at,
    video_count: Array.isArray(collection.video_collections)
      ? collection.video_collections[0]?.count || 0
      : 0,
  }));
}

/**
 * Get all videos in a collection.
 */
export async function getCollectionVideos(
  collectionId: string,
): Promise<import("@/types/library").Video[]> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("Not authenticated");
  }

  // Verify user ownership
  const { data: collection, error: fetchError } = await supabase
    .from("collections")
    .select("user_id")
    .eq("id", collectionId)
    .single();

  if (fetchError || !collection) {
    throw new Error("Collection not found");
  }

  if (collection.user_id !== user.id) {
    throw new Error("Not authorized to view this collection");
  }

  // Fetch videos in the collection
  const { data, error } = await supabase
    .from("video_collections")
    .select(
      `
      videos (
        id,
        title,
        youtube_url,
        youtube_id,
        created_at,
        published_at,
        duration,
        view_count,
        like_count,
        comment_count,
        channels (title),
        video_tags (tags (name))
      )
    `,
    )
    .eq("collection_id", collectionId);

  if (error) {
    throw new Error(`Failed to fetch collection videos: ${error.message}`);
  }

  // Transform the data to match Video type
  return (data || []).map((vg) => {
    // Supabase returns related data as arrays, so we need to extract the first element
    const video = Array.isArray(vg.videos) ? vg.videos[0] : vg.videos;
    return {
      id: video.id,
      title: video.title,
      youtube_url: video.youtube_url,
      youtube_id: video.youtube_id,
      created_at: video.created_at,
      published_at: video.published_at,
      duration: video.duration as string | null, // duration is stored as text in database
      views: video.view_count,
      likes: video.like_count,
      comments: video.comment_count,
      channels: video.channels || null, // Supabase returns related data as arrays
      tags: video.video_tags
        ? video.video_tags.flatMap((vt: { tags: { name: string }[] }) =>
            vt.tags.map((t) => t.name),
          )
        : null,
    };
  });
}
