import type React from "react"
import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { AlertTriangle } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <ErrorBoundary 
          componentName="Dashboard Content"
          onError={(error, errorInfo) => {
            // In production, send to error tracking service
            console.error("Dashboard error:", error, errorInfo);
          }}
        >
          <main className="flex-1 p-6">{children}</main>
        </ErrorBoundary>
      </div>
    </div>
  )
}
