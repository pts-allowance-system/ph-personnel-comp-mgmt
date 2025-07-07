import { create } from "zustand"
import type { AllowanceRequest, Rate, Comment, Rule } from "./types"

interface DataState {
  requests: AllowanceRequest[]
  rates: Rate[]
  rules: Rule[]
  loading: boolean
  error: string | null
  authErrorCallback: (() => void) | null
  setAuthErrorCallback: (callback: (() => void) | null) => void
  fetchRequests: (token: string, options?: { userId?: string; fetchAll?: boolean }) => Promise<void>
  fetchRequestById: (id: string, token: string) => Promise<AllowanceRequest | null>
  fetchRates: (token: string) => Promise<void>
  fetchRules: (token: string) => Promise<void>
  addRequest: (request: Partial<AllowanceRequest>, token: string) => Promise<AllowanceRequest | null>
  updateRequest: (id: string, updates: Partial<AllowanceRequest>, token: string) => Promise<boolean>
  addComment: (requestId: string, commentData: { content: string }, token: string) => Promise<void>
  fetchRequestsByDepartment: (token: string, department: string) => Promise<void>
  clearData: () => void
}

export const useDataStore = create<DataState>((set, get) => ({
  requests: [],
  rates: [],
  rules: [],
  loading: false,
  error: null,
  authErrorCallback: null,

  setAuthErrorCallback: (callback) => set({ authErrorCallback: callback }),

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
      if (userId) params.append("userId", userId)
      params.append("fetchAll", String(fetchAll))
      if (params.toString()) url += `?${params.toString()}`

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.status === 401) {
        set({ error: "Session expired. Please login again.", loading: false })
        get().authErrorCallback?.()
        return
      }
      if (!response.ok) throw new Error(`Failed to fetch requests: ${response.statusText}`)

      const data = await response.json()
      set({ requests: data.requests, loading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to fetch requests", loading: false })
    }
  },

  fetchRequestById: async (id, token) => {
    try {
      set({ loading: true, error: null })
      const response = await fetch(`/api/requests/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.status === 401) {
        set({ error: "Session expired. Please login again.", loading: false })
        get().authErrorCallback?.()
        return null
      }
      if (!response.ok) throw new Error("Failed to fetch request")

      const data = await response.json()
      const request = data.request as AllowanceRequest
      set(state => ({
        requests: state.requests.some(r => r.id === id) 
          ? state.requests.map(r => r.id === id ? request : r)
          : [request, ...state.requests],
        loading: false,
      }))
      return request
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to fetch request", loading: false })
      return null
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
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.status === 401) {
        set({ error: "Session expired. Please login again.", loading: false })
        get().authErrorCallback?.()
        return
      }
      if (!response.ok) throw new Error(`Failed to fetch rules: ${response.statusText}`)
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
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.status === 401) {
        set({ error: "Session expired. Please login again.", loading: false })
        get().authErrorCallback?.()
        return
      }
      if (!response.ok) throw new Error(`Failed to fetch rates: ${response.statusText}`)
      const data = await response.json()
      set({ rates: data.rates, loading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to fetch rates", loading: false })
    }
  },

  addRequest: async (requestData, token) => {
    try {
      if (!token) {
        set({ error: "Authentication token is required", loading: false })
        return null
      }
      set({ loading: true, error: null })
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(requestData),
      })
      if (response.status === 401) {
        set({ error: "Session expired. Please login again.", loading: false })
        get().authErrorCallback?.()
        return null
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to create request" }))
        throw new Error(errorData.error || "Failed to create request")
      }
      const data = await response.json()
      const newRequest = data.request as AllowanceRequest
      set(state => ({ requests: [newRequest, ...state.requests], loading: false, error: null }))
      return newRequest
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to create request", loading: false })
      return null
    }
  },

  updateRequest: async (id, updates, token) => {
    try {
      if (!token) {
        set({ error: "Authentication token is required", loading: false })
        return false
      }
      set({ loading: true, error: null })
      const response = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(updates),
      })
      if (response.status === 401) {
        set({ error: "Session expired. Please login again.", loading: false })
        get().authErrorCallback?.()
        return false
      }
      if (!response.ok) throw new Error("Failed to update request")
      // After updating, fetch the updated request to have the latest data
      const updatedRequest = (await response.json()).request as AllowanceRequest
      set(state => ({
        requests: state.requests.map(r => r.id === id ? updatedRequest : r),
        loading: false,
      }))
      return true
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to update request", loading: false })
      return false
    }
  },

  addComment: async (requestId, commentData, token) => {
    try {
      if (!token) {
        set({ error: "Authentication token is required", loading: false })
        return
      }
      set({ loading: true, error: null })
      const response = await fetch(`/api/requests/${requestId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(commentData),
      })
      if (response.status === 401) {
        set({ error: "Session expired. Please login again.", loading: false })
        get().authErrorCallback?.()
        return
      }
      if (!response.ok) throw new Error("Failed to add comment")
      const newComment = (await response.json()).comment as Comment
      set(state => ({
        requests: state.requests.map(r =>
          r.id === requestId ? { ...r, comments: [...(r.comments || []), newComment] } : r
        ),
        loading: false,
      }))
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to add comment", loading: false })
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
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.status === 401) {
        set({ error: "Session expired. Please login again.", loading: false })
        get().authErrorCallback?.()
        return
      }
      if (!response.ok) throw new Error(`Failed to fetch requests: ${response.statusText}`)
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
