import { type NextRequest, NextResponse } from "next/server";
import { RateLimiter } from "@/lib/utils/rate-limiter";

/**
 * Rate limiting configuration for different route types
 */
export const RATE_LIMIT_CONFIGS = {
  // Authentication routes (login, password reset)
  auth: {
    limit: 10,        // 10 requests
    windowMs: 60000,  // 1 minute
  },
  
  // Form submissions (new requests, documents)
  submissions: {
    limit: 20,         // 20 requests
    windowMs: 60000,   // 1 minute
  },
  
  // Profile updates and other sensitive actions
  userActions: {
    limit: 30,         // 30 requests
    windowMs: 60000,   // 1 minute
  },
  
  // Default rate limit for protected routes
  default: {
    limit: 60,         // 60 requests
    windowMs: 60000,   // 1 minute
  }
};

// Create limiter instances
const limiters = {
  auth: new RateLimiter(RATE_LIMIT_CONFIGS.auth),
  submissions: new RateLimiter(RATE_LIMIT_CONFIGS.submissions),
  userActions: new RateLimiter(RATE_LIMIT_CONFIGS.userActions),
  default: new RateLimiter(RATE_LIMIT_CONFIGS.default)
};

/**
 * Higher order function that returns a middleware function with the specified rate limiter
 * @param limiterType - The type of rate limiter to use
 * @returns A middleware function that applies rate limiting
 */
export function withRateLimit(limiterType: keyof typeof limiters = 'default') {
  return function rateLimit(handler: Function) {
    return async function (request: NextRequest, ...args: any[]) {
      // Get client IP address
      const ip = request.headers.get("x-forwarded-for") || 
                 request.headers.get("x-real-ip") || 
                 "127.0.0.1";
      
      // Get appropriate limiter
      const limiter = limiters[limiterType];
      
      // Check if request is allowed
      const { allowed, remaining } = limiter.check(ip);
      
      // Return error response if limit exceeded
      if (!allowed) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." }, 
          { 
            status: 429,
            headers: {
              "Retry-After": Math.ceil(RATE_LIMIT_CONFIGS[limiterType].windowMs / 1000).toString(),
              "X-RateLimit-Limit": RATE_LIMIT_CONFIGS[limiterType].limit.toString(),
              "X-RateLimit-Remaining": "0"
            }
          }
        );
      }
      
      // Add rate limit headers to response after handler is executed
      const response = await handler(request, ...args);
      
      // Ensure we have a Response object
      if (response instanceof NextResponse) {
        response.headers.set("X-RateLimit-Limit", RATE_LIMIT_CONFIGS[limiterType].limit.toString());
        response.headers.set("X-RateLimit-Remaining", remaining.toString());
      }
      
      return response;
    };
  };
}
