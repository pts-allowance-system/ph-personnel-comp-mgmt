"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/lib/store/auth-store"
import { useDataStore } from "@/lib/store/data-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatusBadge } from "@/components/status-badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from "recharts"
import { Download, TrendingUp, Calendar, CreditCard, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns"

export default function FinanceDashboardPage() {
  const { token } = useAuthStore()
  const { financeDashboardData, fetchFinanceDashboardData, loading, error, clearData } = useDataStore()
  const { stats, monthlyData, disbursements } = financeDashboardData
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"))
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (token) {
      fetchFinanceDashboardData()
    }
    return () => {
      clearData()
    }
  }, [token, fetchFinanceDashboardData, clearData])

  const handleExportSummary = async (format: "csv" | "excel") => {
    try {
      setExporting(true)

      const response = await fetch(`/api/finance/export?month=${selectedMonth}&format=${format}`, {
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
      a.download = `disbursement-summary-${selectedMonth}.${format === "excel" ? "xlsx" : "csv"}`
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

  const filteredDisbursements = disbursements.filter((disbursement) => {
    const dueDate = new Date(disbursement.dueDate)
    const selectedDate = new Date(selectedMonth + "-01")
    return dueDate >= startOfMonth(selectedDate) && dueDate <= endOfMonth(selectedDate)
  })

  const totalPendingForMonth = filteredDisbursements
    .filter((d) => d.status === "hr-checked")
    .reduce((sum, d) => sum + d.amount, 0)

  if (loading) {
    return <div className="flex justify-center p-8">Loading dashboard...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance Dashboard</h1>
          <p className="text-gray-600">Disbursement overview and payment management</p>
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
          <Button onClick={() => handleExportSummary("csv")} disabled={exporting}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => handleExportSummary("excel")} disabled={exporting}>
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
            <CardTitle className="text-sm font-medium">Total Disbursed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">฿{(stats?.totalDisbursements || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time disbursements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">฿{(stats?.totalPendingAmount || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Awaiting disbursement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Total</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">฿{totalPendingForMonth.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">For {format(new Date(selectedMonth + "-01"), "MMMM yyyy")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Amount</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">฿{(stats?.averageDisbursementAmount || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Per disbursement</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Disbursement Trends</CardTitle>
            <CardDescription>Disbursement amounts over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`฿${Number(value).toLocaleString()}`, "Amount"]} />
                <Area
                  type="monotone"
                  dataKey="disbursed"
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                  name="Disbursed"
                />
                <Area type="monotone" dataKey="pending" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Pending" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Disbursement Volume</CardTitle>
            <CardDescription>Number of disbursements per month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} name="Count" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Disbursement Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Disbursement Summary - {format(new Date(selectedMonth + "-01"), "MMMM yyyy")}</span>
            </div>
            <div className="text-sm text-gray-500">
              {filteredDisbursements.length} disbursements • ฿{totalPendingForMonth.toLocaleString()} total
            </div>
          </CardTitle>
          <CardDescription>Summary of all disbursements for the selected month</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Priority</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDisbursements.map((disbursement, index) => {
                const dueDate = new Date(disbursement.dueDate)
                const isOverdue = dueDate < new Date() && disbursement.status !== "disbursed"
                const isUrgent =
                  dueDate <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && disbursement.status !== "disbursed"

                return (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{disbursement.employeeName}</TableCell>
                    <TableCell>{disbursement.department}</TableCell>
                    <TableCell className="font-mono">฿{disbursement.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <StatusBadge status={disbursement.status} />
                    </TableCell>
                    <TableCell>
                      <div className={`${isOverdue ? "text-red-600" : isUrgent ? "text-amber-600" : ""}`}>
                        {format(dueDate, "MMM dd, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell>
                      {isOverdue && (
                        <div className="flex items-center text-red-600">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          Overdue
                        </div>
                      )}
                      {!isOverdue && isUrgent && (
                        <div className="flex items-center text-amber-600">
                          <Clock className="h-4 w-4 mr-1" />
                          Urgent
                        </div>
                      )}
                      {!isOverdue && !isUrgent && <div className="text-green-600">Normal</div>}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {filteredDisbursements.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No disbursements found for the selected month</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ready for Disbursement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {filteredDisbursements.filter((d) => d.status === "hr-checked").length}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              ฿
              {filteredDisbursements
                .filter((d) => d.status === "hr-checked")
                .reduce((sum, d) => sum + d.amount, 0)
                .toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Already Disbursed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {filteredDisbursements.filter((d) => d.status === "disbursed").length}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              ฿
              {filteredDisbursements
                .filter((d) => d.status === "disbursed")
                .reduce((sum, d) => sum + d.amount, 0)
                .toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Overdue Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {
                filteredDisbursements.filter((d) => {
                  const dueDate = new Date(d.dueDate)
                  return dueDate < new Date() && d.status !== "disbursed"
                }).length
              }
            </div>
            <p className="text-sm text-gray-600 mt-2">Require immediate attention</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
