import { useAuthStore } from '../store/auth-store';

/**
 * A wrapper around the native fetch API that automatically adds the
 * JWT Authorization header to requests and handles 401 Unauthorized errors.
 *
 * @param url The URL to fetch.
 * @param options The options for the fetch request.
 * @returns A Promise that resolves to the Response object.
 */
export const api = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = useAuthStore.getState().token;

  const headers = new Headers(options.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Set content type to JSON by default if a body is present
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Token is invalid or expired. Trigger a logout.
      // The authErrorCallback in the data store will handle this.
      throw new Error('Session expired');
    }

    return response;
  } catch (error) {
    // Re-throw the error to be caught by the calling function
    throw error;
  }
};
