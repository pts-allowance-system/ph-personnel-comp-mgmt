import { NextRequest, NextResponse } from 'next/server';
import { createPerformanceMiddleware } from '../utils/performance-monitor';

/**
 * Factory function to create a middleware that monitors API route performance
 * 
 * @example
 * // In an API route file:
 * import { withPerformanceMonitoring } from '@/lib/middleware/performance-middleware';
 * 
 * export const GET = withPerformanceMonitoring(async (req: NextRequest) => {
 *   // Your handler code
 *   return NextResponse.json({ data });
 * });
 */
export function withPerformanceMonitoring(handler: (req: NextRequest) => Promise<Response>) {
  const performanceMiddleware = createPerformanceMiddleware();
  
  return async function monitoredHandler(req: NextRequest): Promise<Response> {
    return performanceMiddleware(req, handler);
  };
}

/**
 * Middleware that adds both validation and performance monitoring to API routes
 * 
 * @example
 * // In an API route file:
 * import { withValidationAndPerformance } from '@/lib/middleware/performance-middleware';
 * import { z } from 'zod';
 * 
 * const schema = z.object({ ... });
 * 
 * export const POST = withValidationAndPerformance(schema, async (req) => {
 *   // Your handler code with typed parsedBody
 *   const { parsedBody } = req;
 *   return NextResponse.json({ success: true });
 * });
 */
export function withValidationAndPerformance<T>(
  schema: any,
  handler: (req: any) => Promise<Response>
) {
  // Import here to avoid circular dependencies
  const { withValidation } = require('../utils/validation');
  
  // Apply validation first, then performance monitoring
  return withPerformanceMonitoring(withValidation(schema)(handler));
}
