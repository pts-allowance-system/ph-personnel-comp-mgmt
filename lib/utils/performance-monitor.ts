/**
 * Performance Monitoring Utilities
 * 
 * This module provides utilities for monitoring and logging performance metrics
 * for database queries and API request handling.
 */

// Default thresholds for performance warnings (in milliseconds)
const DEFAULT_THRESHOLDS = {
  DB_QUERY_SLOW: 500,    // Database queries taking longer than 500ms are considered slow
  API_REQUEST_SLOW: 1000 // API requests taking longer than 1s are considered slow
};

// Custom logger that can be replaced with a more sophisticated logging solution
let logger = {
  warn: (message: string, meta?: Record<string, any>) => {
    console.warn(`[PERFORMANCE WARNING] ${message}`, meta || '');
  },
  error: (message: string, meta?: Record<string, any>) => {
    console.error(`[PERFORMANCE ERROR] ${message}`, meta || '');
  },
  info: (message: string, meta?: Record<string, any>) => {
    console.info(`[PERFORMANCE INFO] ${message}`, meta || '');
  }
};

export interface PerformanceLogMeta {
  duration: number;
  operation?: string;
  source?: string;
  queryParams?: Record<string, any>;
  path?: string;
  method?: string;
  statusCode?: number;
  userId?: string;
  timestamp: string;
  threshold?: number;
}

/**
 * Set custom thresholds for performance warnings
 */
export function setPerformanceThresholds(thresholds: Partial<typeof DEFAULT_THRESHOLDS>) {
  Object.assign(DEFAULT_THRESHOLDS, thresholds);
}

/**
 * Set a custom logger implementation
 */
export function setLogger(customLogger: typeof logger) {
  logger = customLogger;
}

/**
 * Logs performance metrics for database operations
 * 
 * @param queryName - Name or description of the database operation
 * @param durationMs - Duration in milliseconds
 * @param meta - Additional metadata about the operation
 */
export function logDatabasePerformance(
  queryName: string, 
  durationMs: number, 
  meta: Partial<PerformanceLogMeta> = {}
) {
  const threshold = meta.threshold || DEFAULT_THRESHOLDS.DB_QUERY_SLOW;
  
  if (durationMs > threshold) {
    const logMeta: PerformanceLogMeta = {
      duration: durationMs,
      operation: queryName,
      source: 'database',
      timestamp: new Date().toISOString(),
      threshold,
      ...meta
    };
    
    logger.warn(`Slow database query: ${queryName} took ${durationMs}ms`, logMeta);
  }
}

/**
 * Logs performance metrics for API requests
 * 
 * @param path - API endpoint path
 * @param method - HTTP method
 * @param durationMs - Duration in milliseconds
 * @param meta - Additional metadata about the request
 */
export function logApiPerformance(
  path: string,
  method: string,
  durationMs: number,
  meta: Partial<PerformanceLogMeta> = {}
) {
  const threshold = meta.threshold || DEFAULT_THRESHOLDS.API_REQUEST_SLOW;
  
  if (durationMs > threshold) {
    const logMeta: PerformanceLogMeta = {
      duration: durationMs,
      path,
      method,
      source: 'api',
      timestamp: new Date().toISOString(),
      threshold,
      ...meta
    };
    
    logger.warn(`Slow API request: ${method} ${path} took ${durationMs}ms`, logMeta);
  }
}

/**
 * Higher-order function that wraps a database query with performance monitoring
 * 
 * @param queryFn - Database query function to measure
 * @param queryName - Name or description of the query
 * @param meta - Additional metadata
 * @returns The result of the query function
 */
export async function withQueryPerformance<T>(
  queryFn: () => Promise<T>,
  queryName: string,
  meta: Partial<PerformanceLogMeta> = {}
): Promise<T> {
  const startTime = performance.now();
  try {
    return await queryFn();
  } finally {
    const durationMs = Math.round(performance.now() - startTime);
    logDatabasePerformance(queryName, durationMs, meta);
  }
}

/**
 * Higher-order function that wraps an API request handler with performance monitoring
 * 
 * @param handlerFn - API handler function to measure
 * @param path - API endpoint path
 * @param method - HTTP method
 * @param meta - Additional metadata
 * @returns The result of the handler function
 */
export async function withApiPerformance<T>(
  handlerFn: () => Promise<T>,
  path: string,
  method: string,
  meta: Partial<PerformanceLogMeta> = {}
): Promise<T> {
  const startTime = performance.now();
  try {
    return await handlerFn();
  } finally {
    const durationMs = Math.round(performance.now() - startTime);
    logApiPerformance(path, method, durationMs, meta);
  }
}

/**
 * Create a middleware function for measuring API request performance
 * 
 * @returns Middleware function for Next.js API routes
 */
export function createPerformanceMiddleware() {
  return async function performanceMiddleware(
    req: Request,
    handler: (req: Request) => Promise<Response>
  ): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;
    const startTime = performance.now();
    
    let response: Response;
    
    try {
      response = await handler(req);
    } catch (error) {
      const durationMs = Math.round(performance.now() - startTime);
      logger.error(`API error: ${method} ${path} failed after ${durationMs}ms`, {
        path,
        method,
        duration: durationMs,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
      throw error;
    }
    
    const durationMs = Math.round(performance.now() - startTime);
    
    logApiPerformance(path, method, durationMs, {
      statusCode: response.status
    });
    
    return response;
  };
}
