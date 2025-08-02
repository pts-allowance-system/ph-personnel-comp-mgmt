import { type NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { NextRequestWithAuth } from './authorization'; // Import the augmented request type

// Create a new type that includes both user and parsedBody using a generic type parameter
export interface NextRequestWithExtras<T = unknown> extends NextRequestWithAuth {
  parsedBody: T;
}

// Define a generic route context type to replace 'any'
export type RouteContext<T extends Record<string, string> = Record<string, string>> = {
  params: T;
  searchParams?: Record<string, string>;
};

// Use generics for the handler type
type ValidatedRouteHandler<T, C extends Record<string, string>> = (
  request: NextRequestWithExtras<T>, 
  context: RouteContext<C>
) => Promise<NextResponse>;

export function withValidation<T, C extends Record<string, string> = Record<string, string>>(
  schema: z.ZodSchema<T>, 
  handler: ValidatedRouteHandler<T, C>
) {
  return async (request: NextRequestWithAuth, context: RouteContext<C>) => { // Expects a request that might already have a user
    try {
      const body = await request.json();
      const parsedBody = await schema.parseAsync(body);

      const newRequest = request as NextRequestWithExtras<T>;
      newRequest.parsedBody = parsedBody;

      return handler(newRequest, context);
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
      }
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
  };
}
