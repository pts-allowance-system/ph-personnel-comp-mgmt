"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
// Correctly import the single source of truth for the auth store
import { useAuthStore } from '@/lib/store/auth-store';

// Props for the AuthProvider
interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { setAuthErrorCallback, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // This effect runs once on mount to indicate we are on the client.
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // This callback is now stable and will not cause re-renders.
  const handleAuthError = useCallback(() => {
    console.log("Authentication error occurred, handled by AuthProvider. Redirecting to login.");
    useAuthStore.getState().logout();
    router.push('/login');
  }, [router]);

  // Register the global error handler with the store, only once.
  useEffect(() => {
    setAuthErrorCallback(handleAuthError);

    return () => {
      setAuthErrorCallback(() => {}); // Cleanup on unmount
    };
  }, [setAuthErrorCallback, handleAuthError]);

  // Until the component is mounted, we don't know if the user is authenticated.
  // We can show a loader or null.
  if (!isMounted) {
    return null;
  }

  return <>{children}</>;
};

export default AuthProvider;