import { type NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { NextRequestWithAuth } from './authorization'; // Import the augmented request type

// Create a new type that includes both user and parsedBody
export interface NextRequestWithExtras extends NextRequestWithAuth {
  parsedBody: any;
}

type ValidatedRouteHandler = (request: NextRequestWithExtras, context: any) => Promise<NextResponse>;

export function withValidation(schema: z.ZodSchema<any>, handler: ValidatedRouteHandler) {
  return async (request: NextRequestWithAuth, context: any) => { // Expects a request that might already have a user
    try {
      const body = await request.json();
      const parsedBody = await schema.parseAsync(body);

      const newRequest = request as NextRequestWithExtras;
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
