"use client";

// lib/auth-store.ts
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User } from "../lib/types" // Ensure your User type is correctly defined here

// Define the shape of your authentication state
interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  
  // New: For the AuthProvider to register a callback
  authErrorCallback: (() => void) | null; 
  setAuthErrorCallback: (callback: () => void) => void;

  login: (nationalId: string, password: string) => Promise<boolean>
  logout: () => void
  setUser: (user: User, token: string) => void
  clearError: () => void
}



// Props for the AuthProvider
interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { isAuthenticated, loading, setAuthErrorCallback } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const handleAuthError = () => {
      console.log("Authentication error occurred, handled by AuthProvider.");
      // Example: router.push('/login'); 
    };

    setAuthErrorCallback(handleAuthError);

    return () => {
      setAuthErrorCallback(() => {}); 
    };
  }, [setAuthErrorCallback, router]);

  // Optional: Add logic here for loading states or redirects
  // if (loading) return <div>Loading...</div>;
  // if (!isAuthenticated && typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) { 
  //   router.push('/login'); 
  //   return null; 
  // }

  return <>{children}</>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      authErrorCallback: null, // Initialize it

      // Action to set the callback for AuthProvider
      setAuthErrorCallback: (callback: () => void) => {
        set({ authErrorCallback: callback });
      },

      login: async (nationalId: string, password: string) => {
        try {
          set({ loading: true, error: null })

          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ nationalId, password }),
          })

          const data = await response.json() // Parse JSON once

          if (response.ok && data.success) { // <-- Expects data.success: true
            set({
              user: data.user,    // <-- EXPECTS data.user
              token: data.token,  // <-- EXPECTS data.token
              isAuthenticated: true,
              loading: false,
              error: null,
            })
            return true
          } else {
            // Server responded, but login was not successful (e.g., invalid credentials)
            set({
              error: data.error || "Login failed. Please check your credentials.",
              loading: false,
              user: null, // Ensure user and token are cleared on failed login
              token: null,
              isAuthenticated: false,
            })
            get().authErrorCallback?.();
            return false
          }
        } catch (error: any) { // Catch block for network errors or parsing issues
          console.error("Login network/parsing error:", error);
          set({
            error: error.message || "Network error. Please try again.",
            loading: false,
            user: null,
            token: null,
            isAuthenticated: false,
          })
          get().authErrorCallback?.();
          return false
        }
      },

      logout: () => {
        document.cookie = "auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
        set({ user: null, token: null, isAuthenticated: false, error: null })
      },

      setUser: (user: User, token: string) => {
        set({ user, token, isAuthenticated: true, error: null })
      },

      clearError: () => {
        set({ error: null })
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)