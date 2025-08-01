"use client"

import { useEffect, ReactNode } from "react"
import { useAuthStore } from "@/lib/store/auth-store"
import { useDataStore } from "@/lib/store/data-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import type { AllowanceRequest, User } from "@/lib/models"

interface RequestListViewProps {
  title: string;
  description: string;
  fetchFilters: (user: User) => Record<string, any>;
  tableColumns: { key: string; header: string }[];
  renderCell: (request: AllowanceRequest, columnKey: string) => ReactNode;
  renderActions: (request: AllowanceRequest) => ReactNode;
  summaryCards?: (requests: AllowanceRequest[]) => ReactNode;
  emptyState: ReactNode;
  headerButton?: ReactNode;
}

export function RequestListView({
  title,
  description,
  fetchFilters,
  tableColumns,
  renderCell,
  renderActions,
  summaryCards,
  emptyState,
  headerButton,
}: RequestListViewProps) {
  const { user, token } = useAuthStore()
  const { requests, fetchRequests, loading, error, clearData } = useDataStore()

  useEffect(() => {
    if (token && user) {
      const filters = fetchFilters(user);
      fetchRequests(filters)
    }
    return () => {
      clearData()
    }
  }, [token, user, fetchRequests, clearData, fetchFilters])

  if (loading) {
    return <div className="flex justify-center p-8">Loading requests...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600">{description}</p>
        </div>
        {headerButton}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {summaryCards && summaryCards(requests)}

      <Card>
        <CardHeader>
          <CardTitle>Request List</CardTitle>
          <CardDescription>A list of requests based on your role and filters.</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            emptyState
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {tableColumns.map((col) => (
                    <TableHead key={col.key}>{col.header}</TableHead>
                  ))}
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    {tableColumns.map((col) => (
                      <TableCell key={col.key}>{renderCell(request, col.key)}</TableCell>
                    ))}
                    <TableCell>{renderActions(request)}</TableCell>
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
