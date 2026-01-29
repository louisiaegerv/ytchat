export type Video = {
  id: string;
  title: string | null;
  youtube_url: string;
  youtube_id: string;
  created_at: string;
  published_at: string;
  duration?: string | null; // Stored as text in database (e.g., "PT10M30S" or "10:30")
  views?: number | null;
  likes?: number | null;
  comments?: number | null;
  channels?: { title: string | null }[] | null; // Supabase returns related data as arrays
  tags: string[] | null;
};

// Extended type for UI with summary/chat flags
export type VideoWithFlags = Video & {
  hasSummary?: boolean;
  hasChats?: boolean;
  description?: string | null;
  channel_title?: string | null;
  // Per-user UI flags
  blurThumbnail?: boolean;
};

// Collection types
export type Collection = {
  id: string;
  name: string | null;
  description?: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
};

// Collection with video count for UI display
export type CollectionWithVideoCount = Collection & {
  video_count: number;
};

// Collection with videos for detailed view
export type CollectionWithVideos = Collection & {
  videos: Video[];
};

// Pinned collection types
export type PinnedCollection = {
  id: string;
  user_id: string;
  collection_id: string;
  position: number;
  created_at: string;
};

// Pinned collection with collection details (note: name kept for compatibility)
// Note: Supabase returns collections as an array, so we use Collection[] here
export type PinnedCollectionWithGroup = PinnedCollection & {
  collections: Collection[];
};

// Collection with last accessed timestamp
export type CollectionWithLastAccessed = Collection & {
  last_accessed_at: string | null;
};
