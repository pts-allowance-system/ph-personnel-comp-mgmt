import { LRUCache } from 'lru-cache';

type RateLimiterOptions = {
  // The number of requests to allow in the time window.
  limit: number;
  // The time window in milliseconds.
  windowMs: number;
};

export class RateLimiter {
  private store: LRUCache<string, number[]>;
  private limit: number;
  private windowMs: number;

  constructor(options: RateLimiterOptions) {
    this.limit = options.limit;
    this.windowMs = options.windowMs;

    this.store = new LRUCache({
      max: 5000, // Max number of IPs to track
      ttl: options.windowMs,
    });
  }

  public check(key: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const requests = this.store.get(key) || [];

    // Filter out requests that are outside the time window.
    const recentRequests = requests.filter(timestamp => now - timestamp < this.windowMs);

    if (recentRequests.length >= this.limit) {
      return { allowed: false, remaining: 0 };
    }

    // Add the current request timestamp to the store.
    this.store.set(key, [...recentRequests, now]);

    const remaining = this.limit - (recentRequests.length + 1);
    return { allowed: true, remaining };
  }
}
