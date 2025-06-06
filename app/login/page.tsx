"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

const roleLandingPages = {
  employee: "/requests",
  supervisor: "/supervisor/requests",
  hr: "/hr/dashboard",
  finance: "/finance/dashboard",
  admin: "/admin/users",
}

export default function LoginPage() {
  const [nationalId, setNationalId] = useState("")
  const [password, setPassword] = useState("")
  const { login, loading, error, clearError } = useAuthStore()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    // Validate national ID (13 digits)
    if (!/^\d{13}$/.test(nationalId)) {
      return
    }

    const success = await login(nationalId, password)
    if (success) {
      const user = useAuthStore.getState().user
      if (user) {
        router.push(roleLandingPages[user.role])
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">P.T.S. System Login</CardTitle>
          <CardDescription className="text-center">
            Enter your National ID and password to access the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nationalId">National ID</Label>
              <Input
                id="nationalId"
                type="text"
                placeholder="Enter 13-digit National ID"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                maxLength={13}
                required
                disabled={loading}
              />
              {nationalId && !/^\d{13}$/.test(nationalId) && (
                <p className="text-sm text-red-600">National ID must be exactly 13 digits</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading || !/^\d{13}$/.test(nationalId) || !password}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
