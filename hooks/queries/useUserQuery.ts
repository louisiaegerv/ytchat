"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { userKeys } from "@/lib/queryKeys";
import { queryConfig } from "@/lib/queryClient";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";

interface UseUserQueryOptions {
  enabled?: boolean;
}

/**
 * Hook to fetch the current authenticated user
 * Prevents duplicate auth requests across components
 *
 * @example
 * ```tsx
 * const { data: user, isLoading } = useUserQuery();
 * if (user) console.log(user.id, user.email);
 * ```
 */
export function useUserQuery(options: UseUserQueryOptions = {}) {
  const supabase = createClient();

  return useQuery({
    queryKey: userKeys.current(),
    queryFn: async (): Promise<User | null> => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    },
    enabled: options.enabled !== false,
    staleTime: queryConfig.user.staleTime,
    gcTime: queryConfig.user.gcTime,
  });
}

/**
 * Hook to get just the user ID (convenience wrapper)
 *
 * @example
 * ```tsx
 * const { userId, isLoading } = useUserId();
 * ```
 */
export function useUserId() {
  const { data: user, isLoading, error } = useUserQuery();

  return {
    userId: user?.id ?? null,
    isLoading,
    error,
  };
}

/**
 * Hook to prefetch user data
 * Useful for routes that require authentication
 *
 * @example
 * ```tsx
 * const { prefetchUser } = usePrefetchUser();
 * // On route preload
 * prefetchUser();
 * ```
 */
export function usePrefetchUser() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return {
    prefetchUser: () => {
      return queryClient.prefetchQuery({
        queryKey: userKeys.current(),
        queryFn: async () => {
          const { data, error } = await supabase.auth.getUser();
          if (error) throw error;
          return data.user;
        },
        staleTime: queryConfig.user.staleTime,
      });
    },
  };
}
