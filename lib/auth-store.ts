import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User } from "./types"

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  login: (nationalId: string, password: string) => Promise<boolean>
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

          const data = await response.json()

          if (response.ok && data.success) {
            set({
              user: data.user,
              token: data.token,
              isAuthenticated: true,
              loading: false,
              error: null,
            })
            return true
          } else {
            set({
              error: data.error || "Login failed",
              loading: false,
            })
            return false
          }
        } catch (error) {
          set({
            error: "Network error. Please try again.",
            loading: false,
          })
          return false
        }
      },

      logout: () => {
        // Clear cookie
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
