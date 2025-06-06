"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useDataStore } from "@/lib/data-store"

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter()
  const { setAuthErrorCallback } = useDataStore()

  useEffect(() => {
    // Set up the callback to redirect to login on auth errors
    setAuthErrorCallback(() => {
      console.log("Authentication error detected, redirecting to login.")
      router.push("/login")
    })

    // Clear the callback on component unmount to prevent memory leaks
    return () => {
      setAuthErrorCallback(() => {})
    }
  }, [setAuthErrorCallback, router])

  return <>{children}</>
}
