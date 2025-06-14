"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Correctly import the single source of truth for the auth store
import { useAuthStore } from '../lib/auth-store';

// Props for the AuthProvider
interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { setAuthErrorCallback } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const handleAuthError = () => {
      console.log("Authentication error occurred, handled by AuthProvider. Redirecting to login.");
      // When an auth error is triggered (e.g., from a failed API call),
      // we can log the user out and redirect them.
      useAuthStore.getState().logout();
      router.push('/login');
    };

    // Register the global error handler with the store.
    setAuthErrorCallback(handleAuthError);

    // Cleanup: remove the callback when the provider unmounts.
    return () => {
      setAuthErrorCallback(() => {});
    };
  }, [setAuthErrorCallback, router]);

  // This component's purpose is to wrap the application and provide
  // the global auth error handling logic. It renders its children.
  return <>{children}</>;
};

export default AuthProvider;