import NodeCache from "node-cache";

/**
 * Cache configuration with different TTLs for different types of data
 */
const TTL_CONFIG = {
  requests: 3600, // 1 hour for request lists
  request: 3600,  // 1 hour for individual requests
  user: 7200,     // 2 hours for user data
  stats: 1800,    // 30 minutes for dashboard stats
  default: 3600   // Default 1 hour
};

// Base cache instance with checkperiod for automatic deletion
const cache = new NodeCache({ stdTTL: TTL_CONFIG.default, checkperiod: 600 });

// Enhanced cache wrapper with type-aware TTL and invalidation methods
const enhancedCache = {
  /**
   * Get a value from cache
   */
  get: <T>(key: string): T | undefined => {
    return cache.get<T>(key);
  },

  /**
   * Set a value in cache with appropriate TTL based on key prefix
   */
  set: <T>(key: string, value: T): boolean => {
    // Extract the prefix to determine the appropriate TTL
    const prefix = key.split(':')[0];
    const ttl = TTL_CONFIG[prefix as keyof typeof TTL_CONFIG] || TTL_CONFIG.default;
    return cache.set(key, value, ttl);
  },

  /**
   * Delete a value or values from cache
   */
  del: (key: string | string[]): number => {
    return cache.del(key);
  },

  /**
   * Get all cache keys
   */
  keys: (): string[] => {
    return cache.keys();
  },

  /**
   * Invalidate all cache entries related to requests
   * This should be called when any request data changes
   */
  invalidateRequestCache: (requestId?: string): void => {
    // Clear specific request if ID is provided
    if (requestId) {
      cache.del(`request:${requestId}`);
    }
    
    // Clear all list caches that contain requests
    const listKeys = cache.keys().filter(k => k.startsWith('requests:'));
    if (listKeys.length > 0) {
      cache.del(listKeys);
    }
    
    // Also clear any dashboard stats that might depend on request data
    const statsKeys = cache.keys().filter(k => k.startsWith('stats:'));
    if (statsKeys.length > 0) {
      cache.del(statsKeys);
    }
  },

  /**
   * Invalidate user-related cache entries
   */
  invalidateUserCache: (userId?: string): void => {
    if (userId) {
      cache.del(`user:${userId}`);
      cache.del(`profile:${userId}`);
    }
    
    // Clear user lists
    const userKeys = cache.keys().filter(k => 
      k.startsWith('users:') || 
      (userId && k.includes(`userId=${userId}`))
    );
    
    if (userKeys.length > 0) {
      cache.del(userKeys);
    }
  }
};

export default enhancedCache;
