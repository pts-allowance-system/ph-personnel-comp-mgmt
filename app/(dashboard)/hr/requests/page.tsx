"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/lib/store/auth-store"
import { useDataStore } from "@/lib/store/data-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/status-badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, CheckSquare, DollarSign } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { th } from "date-fns/locale"
import { formatToThb } from "@/lib/utils/currency-utils"

export default function HrRequestsPage() {
  const { user } = useAuthStore()
  const { requests, fetchRequests, loading, error, clearData } = useDataStore()

  useEffect(() => {
    if (user) {
      fetchRequests({ status: "approved" })
    }

    return () => {
      clearData()
    }
  }, [user, fetchRequests, clearData])

  const totalPending = requests.length
  const totalAmount = requests.reduce((sum, req) => sum + req.totalAmount, 0)

  if (loading) {
    return <div className="flex justify-center p-8">กำลังโหลดคำขอ...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ตรวจสอบโดยฝ่ายบุคคล</h1>
        <p className="text-gray-600">ตรวจสอบคุณสมบัติตามกฎสำหรับคำขอที่ได้รับอนุมัติ</p>
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
            <CardTitle className="text-sm font-medium">รอการตรวจสอบโดยฝ่ายบุคคล</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPending}</div>
            <p className="text-xs text-muted-foreground">คำขอที่รอการตรวจสอบคุณสมบัติ</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ยอดรวมที่รอดำเนินการ</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatToThb(totalAmount)}</div>
            <p className="text-xs text-muted-foreground">ผลรวมของคำขอที่รอการตรวจสอบทั้งหมด</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายการคำขอ</CardTitle>
          <CardDescription>คำขอที่รอการตรวจสอบจากฝ่ายบุคคล</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">ไม่มีคำขอที่รอดำเนินการ</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>พนักงาน</TableHead>
                  <TableHead>ตำแหน่ง</TableHead>
                  <TableHead>กลุ่ม/ระดับ</TableHead>
                  <TableHead>จำนวนเงิน</TableHead>
                                    <TableHead>สถานะ</TableHead>
                  <TableHead>วันที่ยื่นเรื่อง</TableHead>
                  <TableHead>การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.employeeName}</TableCell>
                    <TableCell>ตำแหน่งพนักงาน</TableCell>
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
                        <Link href={`/hr/requests/${request.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          ตรวจสอบ
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
