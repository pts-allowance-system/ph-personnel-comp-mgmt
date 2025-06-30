import { create } from "zustand"
import type { AllowanceRequest, Rate, Rule } from "./types"

interface DataState {
  requests: AllowanceRequest[]
  rates: Rate[]
  rules: Rule[]
  fetchRules: (token: string) => Promise<void>
  loading: boolean
  error: string | null
  authErrorCallback: (() => void) | null // Added for auth error handling
  setAuthErrorCallback: (callback: (() => void) | null) => void // Added to set the callback
  fetchRequests: (token: string, options?: { userId?: string; fetchAll?: boolean }) => Promise<void>
  fetchRates: (token: string) => Promise<void>
  addRequest: (request: Omit<AllowanceRequest, "id" | "createdAt" | "updatedAt">, token: string) => Promise<AllowanceRequest | null>
  updateRequest: (id: string, updates: Partial<AllowanceRequest>, token: string) => Promise<boolean>
  fetchRequestsByDepartment: (token: string, department: string) => Promise<void>
  clearData: () => void
}

export const useDataStore = create<DataState>((set, get) => ({
  requests: [],
  rates: [],
  rules: [],
  loading: false,
  error: null,
  authErrorCallback: null, // Initialize authErrorCallback

  setAuthErrorCallback: (callback) => set({ authErrorCallback: callback }), // Implement setAuthErrorCallback

  fetchRequests: async (token: string, options: { userId?: string; fetchAll?: boolean } = {}) => {
    const { userId, fetchAll = false } = options;
    try {
      if (!token) {
        set({ error: "Authentication token is required", loading: false })
        return
      }

      set({ loading: true, error: null })

      let url = "/api/requests"
      const params = new URLSearchParams()

      if (userId) {
        params.append("userId", userId)
      }
      // Always pass fetchAll to the API
      params.append("fetchAll", String(fetchAll))

      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.status === 401) {
        set({ error: "Session expired. Please login again.", loading: false })
        get().authErrorCallback?.() // Call the auth error callback
        return
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch requests: ${response.statusText}`)
      }

      const data = await response.json()
      set({ requests: data.requests, loading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to fetch requests", loading: false })
    }
  },

  fetchRules: async (token: string) => {
    try {
      if (!token) {
        set({ error: "Authentication token is required", loading: false })
        return
      }

      set({ loading: true, error: null })

      const response = await fetch("/api/admin/rules", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.status === 401) {
        set({ error: "Session expired. Please login again.", loading: false })
        get().authErrorCallback?.()
        return
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch rules: ${response.statusText}`)
      }

      const data = await response.json()
      set({ rules: data.rules, loading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to fetch rules", loading: false })
    }
  },

  fetchRates: async (token: string) => {
    try {
      if (!token) {
        set({ error: "Authentication token is required", loading: false })
        return
      }

      set({ loading: true, error: null })

      const response = await fetch("/api/rates", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.status === 401) {
        set({ error: "Session expired. Please login again.", loading: false })
        get().authErrorCallback?.() // Call the auth error callback
        return
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch rates: ${response.statusText}`)
      }

      const data = await response.json()
      set({ rates: data.rates, loading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to fetch rates", loading: false })
    }
  },

  addRequest: async (requestData: Omit<AllowanceRequest, "id" | "createdAt" | "updatedAt">, token: string): Promise<AllowanceRequest | null> => {
    try {
      if (!token) {
        set({ error: "Authentication token is required", loading: false })
        return null
      }

      set({ loading: true, error: null })

      const response = await fetch("/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      })

      if (response.status === 401) {
        set({ error: "Session expired. Please login again.", loading: false })
        get().authErrorCallback?.() // Call the auth error callback
        return null
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to create request" }));
        throw new Error(errorData.error || "Failed to create request");
      }

      const data = await response.json();
      const newRequest = data.request as AllowanceRequest;

      set(state => ({
        requests: [newRequest, ...state.requests],
        loading: false,
        error: null
      }));
      return newRequest;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to create request", loading: false })
      return null
    }
  },

  updateRequest: async (id: string, updates: Partial<AllowanceRequest>, token: string) => {
    try {
      if (!token) {
        set({ error: "Authentication token is required", loading: false })
        return false
      }

      set({ loading: true, error: null })

      const response = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      })

      if (response.status === 401) {
        set({ error: "Session expired. Please login again.", loading: false })
        get().authErrorCallback?.() // Call the auth error callback
        return false
      }

      if (!response.ok) {
        throw new Error("Failed to update request")
      }

      set({ loading: false })
      return true
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to update request", loading: false })
      return false
    }
  },

  fetchRequestsByDepartment: async (token: string, department: string) => {
    try {
      if (!token) {
        set({ error: "Authentication token is required", loading: false })
        return
      }

      set({ loading: true, error: null })

      const response = await fetch(`/api/requests?department=${department}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.status === 401) {
        set({ error: "Session expired. Please login again.", loading: false })
        get().authErrorCallback?.()
        return
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch requests: ${response.statusText}`)
      }

      const data = await response.json()
      set({ requests: data.requests, loading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to fetch requests", loading: false })
    }
  },

  clearData: () => {
    set({ requests: [], rates: [], rules: [], loading: false, error: null })
  },
}))
