"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/lib/auth-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatusBadge } from "@/components/status-badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { FileText, Clock, DollarSign, Download, Eye, TrendingUp, Calendar } from "lucide-react"
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { th } from "date-fns/locale"
import { formatToThb } from "@/lib/currency-utils"
import type { AllowanceRequest } from "@/lib/types"

interface DashboardStats {
  totalRequests: number
  pendingRequests: number
  approvedRequests: number
  rejectedRequests: number
  totalAmount: number
  monthlyAmount: number
  averageProcessingTime: number
}

interface MonthlyData {
  month: string
  requests: number
  amount: number
  approved: number
  rejected: number
}

interface RequestWithApprover extends AllowanceRequest {
  approverName?: string
  approverRole?: string
  processingTime?: number
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export default function HrDashboardPage() {
  const { token } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [requests, setRequests] = useState<RequestWithApprover[]>([])
  const [selectedYear, setSelectedYear] = useState(format(new Date(), "yyyy"))
  const [selectedMonthValue, setSelectedMonthValue] = useState(format(new Date(), "MM"))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedRequest, setSelectedRequest] = useState<RequestWithApprover | null>(null)
  const [exporting, setExporting] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [selectedExportStatuses, setSelectedExportStatuses] = useState<string[]>([])

  const selectedDateString = `${selectedYear}-${selectedMonthValue}`

  useEffect(() => {
    if (token) {
      fetchDashboardData()
    }
  }, [token])

  useEffect(() => {
    setSelectedExportStatuses(filteredRequests.map((r) => r.status).filter((v, i, a) => a.indexOf(v) === i))
  }, [requests, selectedDateString])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      const statsResponse = await fetch("/api/hr/dashboard/stats", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.stats)
        setMonthlyData(statsData.monthlyData)
      }

      const requestsResponse = await fetch("/api/hr/dashboard/requests", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json()
        setRequests(requestsData.requests)
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูลแดชบอร์ด")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (formatType: "csv" | "excel") => {
    try {
      setExporting(true)
      const statusQuery = selectedExportStatuses.join(",")
      const response = await fetch(
        `/api/hr/export?month=${selectedDateString}&format=${formatType}&statuses=${statusQuery}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (!response.ok) {
        throw new Error("การส่งออกล้มเหลว")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `รายงาน HR-${selectedDateString}.${formatType === "excel" ? "xlsx" : "csv"}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setIsExportDialogOpen(false)
    } catch (err) {
      setError("การส่งออกล้มเหลว")
      console.error(err)
    } finally {
      setExporting(false)
    }
  }

  const getStatusData = () => {
    if (!stats) return []

    return [
      { name: "รอดำเนินการ", value: stats.pendingRequests, color: "#FFBB28" },
      { name: "อนุมัติ", value: stats.approvedRequests, color: "#00C49F" },
      { name: "ปฏิเสธ", value: stats.rejectedRequests, color: "#FF8042" },
    ]
  }

  const filteredRequests = requests.filter((request) => {
    const requestDate = new Date(request.createdAt)
    const selectedDate = new Date(selectedDateString + "-01")
    return requestDate >= startOfMonth(selectedDate) && requestDate <= endOfMonth(selectedDate)
  })

  const exportPreviewRequests = filteredRequests.filter((req) =>
    selectedExportStatuses.includes(req.status)
  )

  const availableStatuses = [...new Set(filteredRequests.map((req) => req.status))]

  const monthlyTotalAmount = filteredRequests.reduce((total, req) => total + req.totalAmount, 0)

  if (loading) {
    return <div className="flex justify-center p-8">กำลังโหลดแดชบอร์ด...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">แดชบอร์ดฝ่ายบุคคล</h1>
          <p className="text-gray-600">ภาพรวมของคำขอเบี้ยเลี้ยงและกิจกรรมในระบบ</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Select value={selectedMonthValue} onValueChange={setSelectedMonthValue}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="เดือน" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => {
                  const month = i + 1
                  const value = month.toString().padStart(2, "0")
                  const label = format(new Date(2000, i, 1), "MMMM", { locale: th })
                  return (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-24">
                <SelectValue placeholder="ปี" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - i
                  const value = year.toString()
                  return (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
          <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                ส่งออกข้อมูล
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>ส่งออกคำขอ</DialogTitle>
                <DialogDescription>
                  ดูตัวอย่างและส่งออกคำขอสำหรับ {format(new Date(selectedDateString + "-01"), "MMMM yyyy", { locale: th })}.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 border rounded-md">
                  <h4 className="font-semibold mb-2">กรองตามสถานะ</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {availableStatuses.map((status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={`export-${status}`}
                          checked={selectedExportStatuses.includes(status)}
                          onCheckedChange={(checked) => {
                            setSelectedExportStatuses((prev) =>
                              checked ? [...prev, status] : prev.filter((s) => s !== status)
                            )
                          }}
                        />
                        <label
                          htmlFor={`export-${status}`}
                          className="text-sm font-medium capitalize"
                        >
                          {status.replace("-", " ")}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle>ตัวอย่าง</CardTitle>
                    <CardDescription>
                      แสดง {exportPreviewRequests.length} จาก {filteredRequests.length} คำขอ
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="max-h-64 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>พนักงาน</TableHead>
                          <TableHead>จำนวนเงิน</TableHead>
                          <TableHead>สถานะ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {exportPreviewRequests.map((req) => (
                          <TableRow key={req.id}>
                            <TableCell>{req.employeeName}</TableCell>
                            <TableCell>{formatToThb(req.totalAmount)}</TableCell>
                            <TableCell>
                              <StatusBadge status={req.status} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Button
                  onClick={() => handleExport("csv")}
                  disabled={exporting || exportPreviewRequests.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  onClick={() => handleExport("excel")}
                  disabled={exporting || exportPreviewRequests.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  ส่งออกเป็น Excel
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">คำขอทั้งหมด</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              ใน {format(new Date(selectedDateString + "-01"), "MMMM yyyy", { locale: th })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รอการตรวจสอบ</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingRequests || 0}</div>
            <p className="text-xs text-muted-foreground">รอการตรวจสอบจากฝ่ายบุคคล</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ยอดรวมทั้งหมด</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatToThb(monthlyTotalAmount)}</div>
            <p className="text-xs text-muted-foreground">สำหรับทุกคำขอในเดือนนี้</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>แนวโน้มรายเดือน</CardTitle>
            <CardDescription>ปริมาณคำขอและจำนวนเงินในช่วงเวลาต่างๆ</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="requests" fill="#8884d8" name="คำขอ" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>การกระจายสถานะคำขอ</CardTitle>
            <CardDescription>รายละเอียดสถานะปัจจุบัน</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getStatusData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getStatusData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>คำขอสำหรับ {format(new Date(selectedDateString + "-01"), "MMMM yyyy", { locale: th })}</span>
          </CardTitle>
          <CardDescription>
            มุมมองโดยละเอียดของคำขอทั้งหมดสำหรับเดือนที่เลือก ({filteredRequests.length} คำขอ)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>พนักงาน</TableHead>
                <TableHead>แผนก</TableHead>
                <TableHead>จำนวนเงิน</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>อนุมัติโดย</TableHead>
                <TableHead>เวลาดำเนินการ</TableHead>
                <TableHead>การดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.employeeName}</TableCell>
                  <TableCell>แผนก</TableCell>
                  <TableCell>{formatToThb(request.totalAmount)}</TableCell>
                  <TableCell>
                    <StatusBadge status={request.status} />
                  </TableCell>
                  <TableCell>{request.approverName || "-"}</TableCell>
                  <TableCell>{request.processingTime ? `${request.processingTime} วัน` : "-"}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedRequest(request)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>รายละเอียดคำขอ - {selectedRequest?.employeeName}</DialogTitle>
                          <DialogDescription>ข้อมูลฉบับสมบูรณ์สำหรับคำขอ {selectedRequest?.id}</DialogDescription>
                        </DialogHeader>
                        {selectedRequest && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium text-gray-500">พนักงาน</label>
                                <p className="text-sm">{selectedRequest.employeeName}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500">จำนวนเงิน</label>
                                <p className="text-sm">{formatToThb(selectedRequest.totalAmount)}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500">ช่วงเวลา</label>
                                <p className="text-sm">
                                  {format(new Date(selectedRequest.startDate), "d MMM", { locale: th })} -{" "}
                                  {format(new Date(selectedRequest.endDate), "d MMM yyyy", { locale: th })}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500">สถานะ</label>
                                <StatusBadge status={selectedRequest.status} />
                              </div>
                            </div>

                            {selectedRequest.comments.length > 0 && (
                              <div>
                                <label className="text-sm font-medium text-gray-500">ประวัติความคิดเห็น</label>
                                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                                  {selectedRequest.comments.map((comment) => (
                                    <div key={comment.id} className="border-l-4 border-blue-200 pl-3 py-2">
                                      <div className="flex justify-between text-xs text-gray-500">
                                        <span>{comment.userName}</span>
                                        <span>{format(new Date(comment.createdAt), "d MMM yyyy HH:mm", { locale: th })}</span>
                                      </div>
                                      <p className="text-sm mt-1">{comment.message}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div>
                              <label className="text-sm font-medium text-gray-500">เอกสาร</label>
                              <div className="mt-2 grid grid-cols-2 gap-2">
                                {selectedRequest.documents.map((doc) => (
                                  <div key={doc.id} className="border rounded p-2">
                                    <p className="text-sm font-medium truncate">{doc.name}</p>
                                    <p className="text-xs text-gray-500">{(doc.size / 1024).toFixed(1)} KB</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredRequests.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">ไม่พบคำขอสำหรับเดือนที่เลือก</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
