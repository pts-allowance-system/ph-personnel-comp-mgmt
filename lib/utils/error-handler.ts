import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

// A custom error class for handling specific API errors (e.g., Not Found, Forbidden)
export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: unknown): NextResponse {
  // It's good practice to log the actual error for debugging purposes
  console.error("[API Error Handler]:", error);

  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode });
  }

  if (error instanceof ZodError) {
    // This case might be redundant if withValidation handles it, but it's good for robustness
    return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
  }

  // Handle MySQL duplicate entry errors
  if (error instanceof Error && 'code' in error) {
    const dbErrorCode = (error as any).code;
    if (dbErrorCode === 'ER_DUP_ENTRY') {
      // This is a generic message. More specific messages are handled in the route handlers.
      return NextResponse.json({ error: 'A record with one of the provided unique values already exists.' }, { status: 409 });
    }
  }

  // For any other unhandled errors, return a generic 500 response
  return NextResponse.json({ error: 'An unexpected internal server error occurred.' }, { status: 500 });
}
