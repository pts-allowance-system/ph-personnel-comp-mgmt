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
import { th } from "date-fns/locale"
import { formatToThb } from "@/lib/currency-utils"
import type { AllowanceRequest } from "@/lib/types"

export default function SupervisorRequestsPage() {
  const { user, token } = useAuthStore()
  const [requests, setRequests] = useState<AllowanceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchRequests() {
      try {
        setLoading(true)
        const response = await fetch("/api/requests?status=submitted", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("ไม่สามารถดึงข้อมูลคำขอได้")
        }

        const data = await response.json()
        setRequests(data.requests)
      } catch (err) {
        setError("เกิดข้อผิดพลาดในการโหลดคำขอ")
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
    return <div className="flex justify-center p-8">กำลังโหลดคำขอ...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ตรวจสอบคำขอ</h1>
        <p className="text-gray-600">ตรวจสอบและอนุมัติคำขอเบี้ยเลี้ยงจากทีมของคุณ</p>
      </div>

      {error && <div className="text-red-500">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle>คำขอที่รอดำเนินการ</CardTitle>
          <CardDescription>คำขอที่รอการอนุมัติจากหัวหน้างาน</CardDescription>
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
                  <TableHead>กลุ่ม/ระดับ</TableHead>
                  <TableHead>ช่วงเวลา</TableHead>
                  <TableHead>จำนวนเงิน</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.employeeName}</TableCell>
                    <TableCell>
                      {request.group} / {request.tier}
                    </TableCell>
                    <TableCell>
                      {format(new Date(request.startDate), "d MMM", { locale: th })} -{" "}
                      {format(new Date(request.endDate), "d MMM yyyy", { locale: th })}
                    </TableCell>
                    <TableCell>{formatToThb(request.totalAmount)}</TableCell>
                    <TableCell>
                      <StatusBadge status={request.status} />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/supervisor/requests/${request.id}`}>
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
