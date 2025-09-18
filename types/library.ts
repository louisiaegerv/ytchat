export type Video = {
  id: string;
  title: string | null;
  youtube_url: string;
  youtube_id: string;
  created_at: string;
  published_at: string;
  duration?: number;
  views?: number;
  likes?: number;
  comments?: number;
  channels?: { title: string | null } | null; // Updated to reflect actual data structure (object, not array)
  tags: string[] | null;
};

// Extended type for UI with summary/chat flags
export type VideoWithFlags = Video & {
  hasSummary?: boolean;
  hasChats?: boolean;
  description?: string | null;
  published_at?: string;
  duration?: number;
  views?: number;
  likes?: number;
  comments?: number;
  channel_title?: string | null;
  // Per-user UI flags
  blurThumbnail?: boolean;
};

export type Group = {
  id: string;
  name: string | null;
};

export type VideoGroup = {
  video_id: string;
  group_id: string;
};
