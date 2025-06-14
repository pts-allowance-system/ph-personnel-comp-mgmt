"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store" // Ensure this path is correct
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Define the type for roles that have landing pages
type UserRole = "employee" | "supervisor" | "hr" | "finance" | "admin";

// Use a type assertion to ensure roleLandingPages keys match UserRole
const roleLandingPages: Record<UserRole, string> = {
  employee: "/requests",
  supervisor: "/supervisor/requests",
  hr: "/hr/dashboard",
  finance: "/finance/dashboard",
  admin: "/admin/users",
};

export default function LoginPage() {
  const [nationalId, setNationalId] = useState("")
  const [password, setPassword] = useState("")
  // Destructure 'user' directly if your useAuthStore updates it upon login
  const { login, loading, error, clearError } = useAuthStore()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    // Client-side validation: National ID must be exactly 13 digits
    if (!/^\d{13}$/.test(nationalId)) {
      // You might want to set a local error state here for this specific validation
      // if you want different messages for different client-side failures
      console.error("National ID must be exactly 13 digits.");
      return;
    }

    // You could add client-side password validation here too if needed
    if (!password) {
      console.error("Password cannot be empty.");
      // Potentially set an error state or display inline message
      return;
    }

    const user = await login(nationalId, password)

    if (user) {
      // The user object is now available directly from the login function.
      // We can use it for role-based redirection.
      const role = user.role as UserRole; // Cast role to UserRole
      if (role && role in roleLandingPages) {
        const destination = roleLandingPages[role];
        router.push(destination);
      } else {
        // Handle case where user exists but role is not recognized or missing
        console.warn(`User with role '${user.role}' logged in. Redirecting to default.`);
        router.push("/"); // Fallback to home page or a generic dashboard
      }
    }
    // No 'else' block needed here for `if (user)`, as the 'error' state from useAuthStore
    // will be automatically displayed if `login` returns null and sets an error.
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
                onChange={(e) => {
                  // Allow only digits and limit to 13 characters
                  const value = e.target.value.replace(/\D/g, '').slice(0, 13);
                  setNationalId(value);
                }}
                maxLength={13} // HTML maxLength is also useful
                required
                disabled={loading}
              />
              {nationalId.length > 0 && nationalId.length !== 13 && (
                <p className="text-sm text-red-600">National ID must be exactly 13 digits.</p>
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
              {/* Optional: Add client-side password validation feedback here */}
              {/* {password.length > 0 && password.length < 6 && (
                  <p className="text-sm text-red-600">Password must be at least 6 characters.</p>
              )} */}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || nationalId.length !== 13 || !password} // Ensure both are valid
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}