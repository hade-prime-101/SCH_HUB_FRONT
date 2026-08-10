/**
 * Base service class — shared functionality for all map services
 * Handles error handling, caching, request deduplication
 */

/**
 * Cache entry with TTL
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

export class MapServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public originalError?: Error,
  ) {
    super(message);
    this.name = 'MapServiceError';
  }
}

/**
 * Base service class with caching and deduplication
 */
export abstract class BaseMapService {
  protected cache = new Map<string, CacheEntry<unknown>>();
  protected pendingRequests = new Map<string, Promise<unknown>>();

  /**
   * Get from cache if valid
   */
  protected getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttlMs;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Store in cache
   */
  protected setCache<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttlMs,
    });
  }

  /**
   * Deduplicate requests — if the same request is in-flight, return the existing promise
   */
  protected async deduplicate<T>(key: string, fn: () => Promise<T>): Promise<T> {
    // Check if request is already in-flight
    const pending = this.pendingRequests.get(key);
    if (pending) {
      return pending as Promise<T>;
    }

    // Create new request
    const promise = fn();

    // Store pending request
    this.pendingRequests.set(key, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      // Clean up pending request
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Clear all caches
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear cache for a specific key pattern
   */
  public clearCachePattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Invalidate cache for a specific key
   */
  public invalidateCache(key: string): void {
    this.cache.delete(key);
    this.pendingRequests.delete(key);
  }
}
