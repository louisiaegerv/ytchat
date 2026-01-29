/**
 * Simple in-memory cache for user authentication data
 * Eliminates duplicate /auth/v1/user requests
 */
class AuthCache {
  private static instance: AuthCache;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): AuthCache {
    if (!AuthCache.instance) {
      AuthCache.instance = new AuthCache();
    }
    return AuthCache.instance;
  }

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }
}

export const authCache = AuthCache.getInstance();

/**
 * Get cached user ID
 * @returns Cached user ID or null if not found/expired
 */
export function getCachedUserId(): string | null {
  return authCache.get("userId");
}

/**
 * Set cached user ID
 * @param userId - The user ID to cache
 */
export function setCachedUserId(userId: string): void {
  authCache.set("userId", userId);
}

/**
 * Clear auth cache
 * Call this on logout to clear cached authentication data
 */
export function clearAuthCache(): void {
  authCache.clear();
}
