"use client"

import { useEffect } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { th } from "date-fns/locale"
import { Eye } from "lucide-react"

import { useAuthStore } from "@/lib/store/auth-store"
import { useDataStore } from "@/lib/store/data-store"
import { formatToThb } from "@/lib/utils/currency-utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/status-badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export default function SupervisorHistoryPage() {
  const { user, token } = useAuthStore()
  const { requests, fetchRequestsByDepartment, loading, error, clearData } = useDataStore()

  useEffect(() => {
    if (token && user && user.department) {
      fetchRequestsByDepartment(user.department)
    }

    return () => {
      clearData()
    }
  }, [token, user, fetchRequestsByDepartment, clearData])

  if (loading) {
    return <div className="flex justify-center p-8">กำลังโหลดคำขอของแผนก...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ประวัติคำขอของแผนก</h1>
        <p className="text-gray-600">ดูคำขอทั้งหมดที่ส่งโดยสมาชิกในแผนกของคุณ</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>คำขอของแผนก</CardTitle>
          <CardDescription>บันทึกคำขอเบิกค่าใช้จ่ายทั้งหมดจากแผนกของคุณ</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">ไม่พบคำขอสำหรับแผนกของคุณ</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>พนักงาน</TableHead>
                  <TableHead>จำนวนเงิน</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>วันที่ยื่นเรื่อง</TableHead>
                  <TableHead>การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{request.employeeName}</TableCell>
                    <TableCell>{formatToThb(request.totalAmount)}</TableCell>
                    <TableCell>
                      <StatusBadge status={request.status} />
                    </TableCell>
                    <TableCell>{request.createdAt ? format(new Date(request.createdAt), "d MMM yy", { locale: th }) : "N/A"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/requests/${request.id}`}>
                          <Eye className="h-4 w-4" />
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
