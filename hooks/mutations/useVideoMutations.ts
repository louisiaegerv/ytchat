"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { collectionsKeys, videosKeys } from "@/lib/queryKeys";
import type { Video, VideoWithFlags } from "@/types/library";

interface DeleteVideosVariables {
  userId: string;
  videoIds: string[];
}

interface SetBlurFlagVariables {
  videoIds: string[];
  blur: boolean;
}

interface UpdateVideoVariables {
  videoId: string;
  updates: Partial<Video>;
  userId: string;
}

/**
 * Hook for video mutations with optimistic updates
 *
 * @example
 * ```tsx
 * const { deleteVideos, setBlurFlag, isDeleting } = useVideoMutations();
 *
 * // Delete videos with optimistic update
 * await deleteVideos({ userId, videoIds: ['id1', 'id2'] });
 *
 * // Set blur flag with optimistic update
 * await setBlurFlag({ videoIds: ['id1', 'id2'], blur: true });
 * ```
 */
export function useVideoMutations() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  // Delete videos mutation with optimistic update
  const deleteMutation = useMutation({
    mutationFn: async (variables: DeleteVideosVariables) => {
      const { error } = await supabase
        .from("videos")
        .delete()
        .in("id", variables.videoIds);

      if (error) throw error;
      return variables;
    },
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: videosKeys.lists(),
      });

      // Snapshot previous values from all video queries
      const queryCache = queryClient.getQueryCache();
      const videoQueries = queryCache.findAll({ queryKey: videosKeys.all });
      
      const previousData = new Map();
      videoQueries.forEach((query) => {
        previousData.set(query.queryKey, query.state.data);
      });

      // Optimistically remove videos from all video queries
      videoQueries.forEach((query) => {
        const data = query.state.data;
        if (!data) return;

        // Handle infinite query data (pages)
        if (Array.isArray((data as any).pages)) {
          queryClient.setQueryData(query.queryKey, {
            ...data,
            pages: (data as any).pages.map((page: any) => ({
              ...page,
              videos: page.videos.filter(
                (v: Video) => !variables.videoIds.includes(v.id)
              ),
            })),
          });
        }
        // Handle regular array data
        else if (Array.isArray(data)) {
          queryClient.setQueryData(
            query.queryKey,
            (data as Video[]).filter(
              (v) => !variables.videoIds.includes(v.id)
            )
          );
        }
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback all video queries on error
      if (context?.previousData) {
        context.previousData.forEach((data, queryKey) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: (data, error, variables) => {
      // Invalidate all video and collection queries
      queryClient.invalidateQueries({
        queryKey: videosKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: collectionsKeys.all,
      });
    },
  });

  // Set blur flag mutation with optimistic update
  const blurFlagMutation = useMutation({
    mutationFn: async (variables: SetBlurFlagVariables) => {
      const { setBlurFlagForVideos } = await import("@/app/actions");
      await setBlurFlagForVideos(variables.videoIds, variables.blur);
      return variables;
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: videosKeys.all,
      });

      // Snapshot previous values
      const queryCache = queryClient.getQueryCache();
      const videoQueries = queryCache.findAll({ queryKey: videosKeys.all });
      
      const previousData = new Map();
      videoQueries.forEach((query) => {
        previousData.set(query.queryKey, query.state.data);
      });

      const videoIdSet = new Set(variables.videoIds);

      // Optimistically update blur flag in all video queries
      videoQueries.forEach((query) => {
        const data = query.state.data;
        if (!data) return;

        // Handle infinite query data (VideoWithFlags)
        if (Array.isArray((data as any).pages)) {
          queryClient.setQueryData(query.queryKey, {
            ...data,
            pages: (data as any).pages.map((page: any) => ({
              ...page,
              videos: page.videos.map((v: VideoWithFlags) =>
                videoIdSet.has(v.id)
                  ? { ...v, blurThumbnail: variables.blur }
                  : v
              ),
            })),
          });
        }
        // Handle regular array data
        else if (Array.isArray(data)) {
          queryClient.setQueryData(
            query.queryKey,
            (data as VideoWithFlags[]).map((v) =>
              videoIdSet.has(v.id)
                ? { ...v, blurThumbnail: variables.blur }
                : v
            )
          );
        }
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach((data, queryKey) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    // No need to refetch - the optimistic update is sufficient for this operation
  });

  return {
    // Mutation functions
    deleteVideos: deleteMutation.mutateAsync,
    setBlurFlag: blurFlagMutation.mutateAsync,

    // Pending states for UI
    isDeleting: deleteMutation.isPending,
    isSettingBlurFlag: blurFlagMutation.isPending,
  };
}
