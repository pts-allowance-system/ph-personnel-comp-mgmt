"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/lib/auth-store"
import { useDataStore } from "@/lib/data-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/status-badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Eye, Edit } from "lucide-react"
import Link from "next/link"

import { formatToThb } from "@/lib/currency-utils"
import { formatDateToThai } from "@/lib/date-utils"
import { RequestStatus } from "@/lib/types"




export default function RequestsPage() {
  const { user, token } = useAuthStore()
  const { requests, fetchRequests, loading, error, clearData } = useDataStore()

  useEffect(() => {
    if (token && user) {
      fetchRequests(token, { userId: user.id })
    }

    // Cleanup on unmount
    return () => {
      clearData()
    }
  }, [token, user, fetchRequests, clearData])

  if (loading) {
    return <div className="flex justify-center p-8">กำลังโหลดคำขอรับเงิน พ.ต.ส....</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">คำขอรับเงิน พ.ต.ส.</h1>
          <p className="text-gray-600">จัดการคำขอรับเงินเพิ่มสำหรับตำแหน่งที่มีเหตุพิเศษ (พ.ต.ส.)</p>
        </div>
        <Button asChild>
          <Link href="/requests/new">
            <Plus className="h-4 w-4 mr-2" />
            สร้างคำขอ พ.ต.ส. ใหม่
          </Link>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>ประวัติคำขอรับเงิน พ.ต.ส.</CardTitle>
          <CardDescription>ดูและจัดการคำขอรับเงิน พ.ต.ส. ทั้งหมดของคุณ</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">ไม่พบคำขอรับเงิน พ.ต.ส.</p>
              <Button asChild>
                <Link href="/requests/new">สร้างคำขอรับเงิน พ.ต.ส. แรกของคุณ</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ช่วงเวลา</TableHead>
                  <TableHead>กลุ่มอัตรา พ.ต.ส.</TableHead>
                  <TableHead>จำนวนเงิน</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>วันที่สร้าง</TableHead>
                  <TableHead>การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      {`${formatDateToThai(request.startDate)} - ${formatDateToThai(request.endDate)}`}
                    </TableCell>
                    <TableCell>
                      {request.group} / {request.tier}
                    </TableCell>
                    <TableCell>{formatToThb(request.totalAmount)}</TableCell>
                    <TableCell>
                      <StatusBadge status={request.status} />
                    </TableCell>
                    <TableCell>{formatDateToThai(request.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/requests/${request.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {request.status === RequestStatus.Draft && (
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/requests/${request.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                      </div>
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
