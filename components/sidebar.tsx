"use client"

import { useAuthStore } from "@/lib/auth-store"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { FileText, Users, DollarSign, Settings, BarChart3, CheckSquare, UserCheck, CreditCard } from "lucide-react"

const roleMenus = {
  employee: [{ href: "/requests", label: "My Requests", icon: FileText }],
  supervisor: [{ href: "/supervisor/requests", label: "Review Requests", icon: UserCheck }],
  hr: [
    { href: "/hr/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/hr/requests", label: "HR Review", icon: CheckSquare },
  ],
  finance: [
    { href: "/finance/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/finance/requests", label: "Disbursements", icon: CreditCard },
  ],
  admin: [
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/rates", label: "Rates", icon: DollarSign },
    { href: "/admin/rules", label: "Rules", icon: Settings },
    { href: "/admin/logs", label: "Logs", icon: FileText },
    { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  ],
}

export function Sidebar() {
  const { user } = useAuthStore()
  const pathname = usePathname()

  if (!user) return null

  const menuItems = roleMenus[user.role] || []

  return (
    <aside className="w-64 bg-gray-50 border-r min-h-screen">
      <div className="p-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
