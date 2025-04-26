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
      let query = supabase
        .from("videos")
        .select(
          "id, title, youtube_url, youtube_id, created_at, channel_id, published_at,description,duration,view_count, like_count, comment_count"
        )
        .eq("user_id", userId);

      if (debouncedSearchQuery) {
        query = query.ilike("title", `%${debouncedSearchQuery}%`);
      }
      // Tag filtering is handled in-memory in app/library/page.tsx
      if (selectedGroups.length > 0) {
        const videosInSelectedGroups = new Set<string>();
        videoGroupLinks.forEach((link) => {
          if (selectedGroups.includes(link.group_id)) {
            videosInSelectedGroups.add(link.video_id);
          }
        });
        if (videosInSelectedGroups.size > 0) {
          query = query.in("id", Array.from(videosInSelectedGroups));
        } else {
          query = query.in("id", []);
        }
      }
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
