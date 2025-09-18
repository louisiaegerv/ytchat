import { useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import type { VideoGroup } from "@/types/library";

const PAGE_SIZE = 12;

interface UseVideoQueryParams {
  debouncedSearchQuery: string;
  selectedTags: string[];
  selectedGroups: string[];
  videoGroupLinks: VideoGroup[];
}

export function useVideoQuery({
  debouncedSearchQuery,
  selectedTags,
  selectedGroups,
  videoGroupLinks,
}: UseVideoQueryParams) {
  const supabase = createClient();

  return useCallback(
    (userId: string, page: number) => {
      let baseQuery = supabase
        .from("videos")
        .select(
          `id, title, youtube_url, youtube_id, created_at, channel_id, published_at,description,duration,view_count, like_count, comment_count, channels(title)`
        );

      let query;

      if (debouncedSearchQuery) {
        query = supabase
          .rpc("search_videos_by_title_or_channel", {
            p_user_id: userId,
            p_search_query: debouncedSearchQuery,
          })
          .select(
            `id, title, youtube_url, youtube_id, created_at, channel_id, published_at,description,duration,view_count, like_count, comment_count, channels(title)`
          );
      } else {
        query = baseQuery.eq("user_id", userId);
      }

      // Apply common filters (order, range)
      query = query.order("created_at", { ascending: false });
      const start = page * PAGE_SIZE;
      const end = start + PAGE_SIZE - 1;
      query = query.range(start, end);
      return query;
    },
    [
      debouncedSearchQuery,
      selectedTags,
      selectedGroups,
      videoGroupLinks,
      supabase,
    ]
  );
}
