import { create } from "zustand"
import { api } from "../utils/storage"
import type { AllowanceRequest, Rate, Comment, Rule } from "../models"

interface DataState {
  requests: AllowanceRequest[];
  currentRequest: AllowanceRequest | null; // To hold the currently viewed/edited request
  rates: Rate[];
  rules: Rule[];
  loading: boolean;
  error: string | null;
  authErrorCallback: (() => void) | null;
  setAuthErrorCallback: (callback: (() => void) | null) => void;
  fetchRequests: (options?: { userId?: string; fetchAll?: boolean }) => Promise<void>;
  fetchRequestById: (id: string) => Promise<AllowanceRequest | null>;
  fetchRates: () => Promise<void>;
  fetchRules: () => Promise<void>;
  addRequest: (request: Partial<AllowanceRequest>) => Promise<AllowanceRequest | null>;
  updateRequest: (id: string, updates: Partial<AllowanceRequest>) => Promise<boolean>;
  addComment: (requestId: string, commentData: { message: string }) => Promise<void>;
  fetchRequestsByDepartment: (department: string) => Promise<void>;
  clearCurrentRequest: () => void;
  clearData: () => void;
}

export const useDataStore = create<DataState>((set, get) => ({
  requests: [],
  currentRequest: null,
  rates: [],
  rules: [],
  loading: false,
  error: null,
  authErrorCallback: null,

  setAuthErrorCallback: (callback) => set({ authErrorCallback: callback }),

  fetchRequests: async (options: { userId?: string; fetchAll?: boolean } = {}) => {
    const { userId, fetchAll = false } = options;
    try {
      set({ loading: true, error: null })
      let url = "/api/requests"
      const params = new URLSearchParams()
      if (userId) params.append("userId", userId)
      params.append("fetchAll", String(fetchAll))
      if (params.toString()) url += `?${params.toString()}`

      const response = await api(url)

      if (!response.ok) throw new Error(`Failed to fetch requests: ${response.statusText}`)

      const data = await response.json()
      set({ requests: data.requests, loading: false })
    } catch (error) {
      if (error instanceof Error && error.message.includes("Session expired")) {
        get().authErrorCallback?.()
      }
      set({ error: error instanceof Error ? error.message : "Failed to fetch requests", loading: false })
    }
  },

  fetchRequestById: async (id) => {
    try {
      set({ loading: true, error: null })
      const response = await api(`/api/requests/${id}`)

      if (!response.ok) throw new Error("Failed to fetch request")

      const data = await response.json()
      const request = data.request as AllowanceRequest
      set(state => {
        let newRequests = [...state.requests];
        const existingRequestIndex = newRequests.findIndex(r => r && r.id === id);

        if (request) {
          // If request was found, update or add it
          if (existingRequestIndex > -1) {
            newRequests[existingRequestIndex] = request;
          } else {
            newRequests.unshift(request);
          }
        } else {
          // If request was not found (is null), do nothing to the requests list
        }

        return {
          requests: newRequests.filter(Boolean), // Final safeguard
          currentRequest: request,
          loading: false,
        };
      });
      return request
    } catch (error) {
      if (error instanceof Error && error.message.includes("Session expired")) {
        get().authErrorCallback?.()
      }
      set({ error: error instanceof Error ? error.message : "Failed to fetch request", loading: false })
      return null
    }
  },

  fetchRules: async () => {
    try {
      set({ loading: true, error: null })
      const response = await api("/api/admin/rules")

      if (!response.ok) throw new Error(`Failed to fetch rules: ${response.statusText}`)
      const data = await response.json()
      set({ rules: data.rules, loading: false })
    } catch (error) {
      if (error instanceof Error && error.message.includes("Session expired")) {
        get().authErrorCallback?.()
      }
      set({ error: error instanceof Error ? error.message : "Failed to fetch rules", loading: false })
    }
  },

  fetchRates: async () => {
    try {
      set({ loading: true, error: null })
      const response = await api("/api/rates")

      if (!response.ok) throw new Error(`Failed to fetch rates: ${response.statusText}`)
      const data = await response.json()
      set({ rates: data.rates, loading: false })
    } catch (error) {
      if (error instanceof Error && error.message.includes("Session expired")) {
        get().authErrorCallback?.()
      }
      set({ error: error instanceof Error ? error.message : "Failed to fetch rates", loading: false })
    }
  },

  addRequest: async (requestData) => {
    try {
      set({ loading: true, error: null })
      const response = await api("/api/requests", {
        method: "POST",
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to create request" }))
        throw new Error(errorData.error || "Failed to create request")
      }
      const data = await response.json()
      const newRequest = data.request as AllowanceRequest
      set(state => ({
        requests: [newRequest, ...state.requests],
        currentRequest: newRequest, // Set the new request as the current one
        loading: false,
        error: null,
      }));
      return newRequest
    } catch (error) {
      if (error instanceof Error && error.message.includes("Session expired")) {
        get().authErrorCallback?.()
      }
      set({ error: error instanceof Error ? error.message : "Failed to create request", loading: false })
      return null
    }
  },

  updateRequest: async (id, updates) => {
    try {
      set({ loading: true, error: null })
      const response = await api(`/api/requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      })

      if (!response.ok) throw new Error("Failed to update request")
      // After updating, fetch the updated request to have the latest data
      const updatedRequest = (await response.json()).request as AllowanceRequest
      set(state => ({
        requests: state.requests.map(r => r.id === id ? updatedRequest : r),
        loading: false,
      }))
      return true
    } catch (error) {
      if (error instanceof Error && error.message.includes("Session expired")) {
        get().authErrorCallback?.()
      }
      set({ error: error instanceof Error ? error.message : "Failed to update request", loading: false })
      return false
    }
  },

    addComment: async (requestId, commentData) => {
    // The API expects a `message` field, but the frontend might pass `content`.
    // We handle both here to be safe, prioritizing `message`.
        try {
      set({ loading: true, error: null });
      const response = await api(`/api/requests/${requestId}/comments`, {
        method: "POST",
        body: JSON.stringify({ message: commentData.message }),
      });

      if (!response.ok) throw new Error("Failed to add comment");

      const newComment = (await response.json()).comment as Comment;

      // Ensure local state is updated consistently
      set((state) => {
        const updatedRequests = state.requests.map((r) => {
          if (r.id === requestId) {
            // The API returns the full comment object, which should have 'content'.
            // We add it to the existing comments.
            const updatedComments = [...(r.comments || []), newComment];
            return { ...r, comments: updatedComments };
          }
          return r;
        });

        // Also update the currentRequest if it's the one being commented on
        const updatedCurrentRequest = state.currentRequest?.id === requestId
          ? { ...state.currentRequest, comments: [...(state.currentRequest.comments || []), newComment] }
          : state.currentRequest;

        return {
          requests: updatedRequests,
          currentRequest: updatedCurrentRequest,
          loading: false,
        };
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("Session expired")) {
        get().authErrorCallback?.()
      }
      set({ error: error instanceof Error ? error.message : "Failed to add comment", loading: false })
    }
  },

  fetchRequestsByDepartment: async (department: string) => {
    try {
      set({ loading: true, error: null })
      const response = await api(`/api/requests?department=${department}`)

      if (!response.ok) throw new Error(`Failed to fetch requests: ${response.statusText}`)
      const data = await response.json()
      set({ requests: data.requests, loading: false })
    } catch (error) {
      if (error instanceof Error && error.message.includes("Session expired")) {
        get().authErrorCallback?.()
      }
      set({ error: error instanceof Error ? error.message : "Failed to fetch requests", loading: false })
    }
  },

  clearCurrentRequest: () => {
    set({ currentRequest: null });
  },

  clearData: () => {
    set({ requests: [], rates: [], rules: [], currentRequest: null, loading: false, error: null })
  },
}))
