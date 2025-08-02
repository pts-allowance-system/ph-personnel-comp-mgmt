// lib/auth-store.ts
import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { User } from "../models" // Ensure your User type is correctly defined here

// Define the shape of your authentication state
export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  
  // New: For the AuthProvider to register a callback
  authErrorCallback: (() => void) | null; 
  setAuthErrorCallback: (callback: () => void) => void;

  login: (nationalId: string, password: string) => Promise<User | null>
  logout: () => void
  setUser: (user: User, token: string) => void
  clearError: () => void
}

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

      login: async (nationalId: string, password: string): Promise<User | null> => {
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

          if (response.ok && data.success) {
            set({
              user: data.user,
              token: data.token, // Assuming token is returned in JSON
              isAuthenticated: true,
              loading: false,
              error: null,
            })
            return data.user
          } else {
            // Server responded, but login was not successful (e.g., invalid credentials)
            set({
              error: data.error || "Login failed. Please check your credentials.",
              loading: false,
              user: null, // Ensure user and token are cleared on failed login
              token: null,
              isAuthenticated: false,
            })
            return null
          }
        } catch (error: unknown) { // Catch block for network errors or parsing issues
          console.error("Login network/parsing error:", error);
          
          // Safe error message extraction with type narrowing
          let errorMessage = "Network error. Please try again.";
          if (error instanceof Error) {
            errorMessage = error.message;
          } else if (typeof error === 'object' && error !== null && 'message' in error) {
            errorMessage = String(error.message);
          }
          
          set({
            error: errorMessage,
            loading: false,
            user: null,
            token: null,
            isAuthenticated: false,
          })
          return null
        }
      },

      logout: () => {
        // **CRITICAL: Purge the persisted state from localStorage.**
        // This is necessary to clear out old, corrupted user objects.
        localStorage.removeItem("auth-storage");

        // Clear cookie if you're managing it client-side.
        // For HttpOnly cookies, this isn't strictly necessary as the backend
        // should handle session invalidation or cookie expiry.
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
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)