"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/lib/auth-store"
import { useDataStore } from "@/lib/data-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/status-badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { formatToThb } from "@/lib/currency-utils"
import { format } from "date-fns"
import { th } from "date-fns/locale"


export default function HistoryPage() {
  const { user, token } = useAuthStore()
  const { requests, fetchRequests, loading, error, clearData } = useDataStore()

  useEffect(() => {
    if (token && user) {
      fetchRequests(token, { userId: user.id, fetchAll: true })
    }

    return () => {
      clearData()
    }
  }, [token, user, fetchRequests, clearData])

  if (loading) {
    return <div className="flex justify-center p-8">กำลังโหลดประวัติ...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ประวัติคำขอของฉัน</h1>
        <p className="text-gray-600">ดูคำขอเบี้ยเลี้ยงในอดีตและปัจจุบันทั้งหมดของคุณ</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>ประวัติคำขอทั้งหมด</CardTitle>
          <CardDescription>บันทึกคำขอเบี้ยเลี้ยงทั้งหมดของคุณ</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">ไม่พบประวัติคำขอ</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ช่วงเวลา</TableHead>
                  <TableHead>กลุ่ม/ระดับ</TableHead>
                  <TableHead>จำนวนเงิน</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>วันที่ส่ง</TableHead>
                  <TableHead>การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      {format(new Date(request.startDate), "d MMM yy", { locale: th })} -{" "}
                      {format(new Date(request.endDate), "d MMM yy", { locale: th })}
                    </TableCell>
                    <TableCell>
                      {request.group} / {request.tier}
                    </TableCell>
                    <TableCell>{formatToThb(request.totalAmount)}</TableCell>

                    <TableCell>
                      <StatusBadge status={request.status} />
                    </TableCell>
                    <TableCell>{format(new Date(request.createdAt), "d MMM yyyy", { locale: th })}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/requests/${request.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          ดูรายละเอียด
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
