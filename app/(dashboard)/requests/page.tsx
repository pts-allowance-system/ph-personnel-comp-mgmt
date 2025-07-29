"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/lib/store/auth-store"
import { useDataStore } from "@/lib/store/data-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/status-badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Eye, Edit, FileEdit, Clock, CheckCircle } from "lucide-react"
import Link from "next/link"

import { formatToThb } from "@/lib/utils/currency-utils"
import { format } from "date-fns"
import { th } from "date-fns/locale"




export default function RequestsPage() {
  const { user, token } = useAuthStore()
  const { requests, fetchRequests, loading, error, clearData } = useDataStore()

  useEffect(() => {
    if (token && user) {
      fetchRequests({ userId: user.id })
    }

    // Cleanup on unmount
    return () => {
      clearData()
    }
  }, [token, user, fetchRequests, clearData])

  const draftRequests = requests.filter(r => r.status === 'draft').length;
  const pendingRequests = requests.filter(r => ['pending', 'submitted', 'processing'].includes(r.status)).length;
  const approvedRequests = requests.filter(r => r.status === 'approved').length;

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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ฉบับร่าง</CardTitle>
            <FileEdit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftRequests}</div>
            <p className="text-xs text-muted-foreground">คำขอที่ยังไม่ได้ส่ง</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">กำลังดำเนินการ</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests}</div>
            <p className="text-xs text-muted-foreground">คำขอที่รอการอนุมัติ</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">อนุมัติแล้ว</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedRequests}</div>
            <p className="text-xs text-muted-foreground">คำขอที่ได้รับการอนุมัติแล้ว</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>คำขอทั้งหมดของคุณ</CardTitle>
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
                  <TableHead>กลุ่มอัตรา พ.ต.ส.</TableHead>
                  <TableHead>จำนวนเงิน</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>วันที่ยื่นเรื่อง</TableHead>
                  <TableHead>การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      {request.allowanceGroup} / {request.tier}
                    </TableCell>
                    <TableCell>{formatToThb(request.totalAmount)}</TableCell>
                    <TableCell>
                      <StatusBadge status={request.status} />
                    </TableCell>
                    <TableCell>{request.createdAt ? format(new Date(request.createdAt), "d MMM yy", { locale: th }) : "N/A"}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/requests/${request.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {request.status === 'draft' && (
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
