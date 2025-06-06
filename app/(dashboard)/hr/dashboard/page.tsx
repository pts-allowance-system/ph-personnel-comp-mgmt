"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/lib/auth-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  const { user, token } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [requests, setRequests] = useState<RequestWithApprover[]>([])
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedRequest, setSelectedRequest] = useState<RequestWithApprover | null>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [token])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch dashboard statistics
      const statsResponse = await fetch("/api/hr/dashboard/stats", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.stats)
        setMonthlyData(statsData.monthlyData)
      }

      // Fetch all requests for detailed view
      const requestsResponse = await fetch("/api/hr/dashboard/requests", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json()
        setRequests(requestsData.requests)
      }
    } catch (err) {
      setError("Error loading dashboard data")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format: "csv" | "excel") => {
    try {
      setExporting(true)

      const response = await fetch(`/api/hr/export?month=${selectedMonth}&format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error("Export failed")
      }

      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `hr-report-${selectedMonth}.${format === "excel" ? "xlsx" : "csv"}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError("Export failed")
      console.error(err)
    } finally {
      setExporting(false)
    }
  }

  const getStatusData = () => {
    if (!stats) return []

    return [
      { name: "Pending", value: stats.pendingRequests, color: "#FFBB28" },
      { name: "Approved", value: stats.approvedRequests, color: "#00C49F" },
      { name: "Rejected", value: stats.rejectedRequests, color: "#FF8042" },
    ]
  }

  const filteredRequests = requests.filter((request) => {
    const requestDate = new Date(request.createdAt)
    const selectedDate = new Date(selectedMonth + "-01")
    return requestDate >= startOfMonth(selectedDate) && requestDate <= endOfMonth(selectedDate)
  })

  if (loading) {
    return <div className="flex justify-center p-8">Loading dashboard...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HR Dashboard</h1>
          <p className="text-gray-600">Overview of allowance requests and system activity</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const date = subMonths(new Date(), i)
                const value = format(date, "yyyy-MM")
                const label = format(date, "MMMM yyyy")
                return (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          <Button onClick={() => handleExport("csv")} disabled={exporting}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => handleExport("excel")} disabled={exporting}>
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRequests || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingRequests || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting HR review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">฿{(stats?.totalAmount || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All approved requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Processing</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.averageProcessingTime || 0}d</div>
            <p className="text-xs text-muted-foreground">Average days to process</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
            <CardDescription>Request volume and amounts over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="requests" fill="#8884d8" name="Requests" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Request Status Distribution</CardTitle>
            <CardDescription>Current status breakdown</CardDescription>
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
            <span>Requests for {format(new Date(selectedMonth + "-01"), "MMMM yyyy")}</span>
          </CardTitle>
          <CardDescription>
            Detailed view of all requests for the selected month ({filteredRequests.length} requests)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Approved By</TableHead>
                <TableHead>Processing Time</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.employeeName}</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>฿{request.totalAmount.toLocaleString()}</TableCell>
                  <TableCell>
                    <StatusBadge status={request.status} />
                  </TableCell>
                  <TableCell>{request.approverName || "-"}</TableCell>
                  <TableCell>{request.processingTime ? `${request.processingTime}d` : "-"}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedRequest(request)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Request Details - {selectedRequest?.employeeName}</DialogTitle>
                          <DialogDescription>Complete information for request {selectedRequest?.id}</DialogDescription>
                        </DialogHeader>
                        {selectedRequest && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium text-gray-500">Employee</label>
                                <p className="text-sm">{selectedRequest.employeeName}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500">Amount</label>
                                <p className="text-sm">฿{selectedRequest.totalAmount.toLocaleString()}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500">Period</label>
                                <p className="text-sm">
                                  {format(new Date(selectedRequest.startDate), "MMM dd")} -{" "}
                                  {format(new Date(selectedRequest.endDate), "MMM dd, yyyy")}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500">Status</label>
                                <StatusBadge status={selectedRequest.status} />
                              </div>
                            </div>

                            {selectedRequest.comments.length > 0 && (
                              <div>
                                <label className="text-sm font-medium text-gray-500">Comments History</label>
                                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                                  {selectedRequest.comments.map((comment) => (
                                    <div key={comment.id} className="border-l-4 border-blue-200 pl-3 py-2">
                                      <div className="flex justify-between text-xs text-gray-500">
                                        <span>{comment.userName}</span>
                                        <span>{format(new Date(comment.createdAt), "MMM dd, yyyy HH:mm")}</span>
                                      </div>
                                      <p className="text-sm mt-1">{comment.message}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div>
                              <label className="text-sm font-medium text-gray-500">Documents</label>
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
              <p className="text-gray-500">No requests found for the selected month</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
