"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/lib/store/auth-store"
import { useDataStore } from "@/lib/store/data-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/status-badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, Download, CreditCard, DollarSign } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { th } from "date-fns/locale"
import { formatToThb } from "@/lib/utils/currency-utils"

export default function FinanceRequestsPage() {
  const { user } = useAuthStore()
  const { requests, fetchRequests, loading, error, clearData } = useDataStore()

  useEffect(() => {
    if (user) {
      fetchRequests({ status: "hr-checked" })
    }

    return () => {
      clearData()
    }
  }, [user, fetchRequests, clearData])

  const totalPending = requests.length
  const totalAmount = requests.reduce((sum, req) => sum + req.totalAmount, 0)

  const handleExportExcel = () => {
    // In a real app, this would call an API endpoint to generate an Excel file
    alert("Export Excel functionality would be implemented here")
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading requests...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance Disbursements</h1>
          <p className="text-gray-600">Process payments for approved allowance requests</p>
        </div>
        <Button onClick={handleExportExcel}>
          <Download className="h-4 w-4 mr-2" />
          Export Excel
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รอการเบิกจ่าย</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPending}</div>
            <p className="text-xs text-muted-foreground">คำขอที่รอการดำเนินการเบิกจ่าย</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ยอดรวมที่รอการเบิกจ่าย</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatToThb(totalAmount)}</div>
            <p className="text-xs text-muted-foreground">ผลรวมของคำขอที่รอการเบิกจ่ายทั้งหมด</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายการเบิกจ่าย</CardTitle>
          <CardDescription>Requests ready for payment processing</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No pending disbursements</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Group/Tier</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.employeeName}</TableCell>
                    <TableCell>
                      {request.allowanceGroup} / {request.tier}
                    </TableCell>
                    <TableCell>{formatToThb(request.totalAmount)}</TableCell>
                    <TableCell>
                      <StatusBadge status={request.status} />
                    </TableCell>
                    <TableCell>{request.createdAt ? format(new Date(request.createdAt), "d MMM yy", { locale: th }) : "N/A"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/finance/requests/${request.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Process
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
