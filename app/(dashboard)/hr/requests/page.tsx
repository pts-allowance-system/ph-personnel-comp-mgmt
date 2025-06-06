"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/lib/auth-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/status-badge"
import { Eye } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import type { AllowanceRequest } from "@/lib/types"

export default function HrRequestsPage() {
  const { user, token } = useAuthStore()
  const [requests, setRequests] = useState<AllowanceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchRequests() {
      try {
        setLoading(true)
        const response = await fetch("/api/requests?status=approved", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch requests")
        }

        const data = await response.json()
        setRequests(data.requests)
      } catch (err) {
        setError("Error loading requests")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      fetchRequests()
    }
  }, [token])

  if (loading) {
    return <div className="flex justify-center p-8">Loading requests...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">HR Review</h1>
        <p className="text-gray-600">Verify eligibility rules for approved requests</p>
      </div>

      {error && <div className="text-red-500">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle>Pending Requests</CardTitle>
          <CardDescription>Requests waiting for HR verification</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No pending requests</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Group/Tier</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.employeeName}</TableCell>
                    <TableCell>Staff Position</TableCell>
                    <TableCell>
                      {request.group} / {request.tier}
                    </TableCell>
                    <TableCell>
                      {format(new Date(request.startDate), "MMM dd")} -{" "}
                      {format(new Date(request.endDate), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>฿{request.totalAmount.toLocaleString()}</TableCell>
                    <TableCell>
                      <StatusBadge status={request.status} />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/hr/requests/${request.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Review
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
