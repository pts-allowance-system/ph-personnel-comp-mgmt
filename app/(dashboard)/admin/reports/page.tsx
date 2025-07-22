"use client"

import { useState } from "react"
import { useAuthStore } from "@/lib/store/auth-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"

interface ReportData {
  totalRequests: number
  totalAmount: number
  requestsByStatus: { status: string; count: number }[]
  requestsByGroup: { group: string; count: number; totalAmount: number }[]
}

export default function ReportsPage() {
  const { token } = useAuthStore()
  const [date, setDate] = useState<DateRange | undefined>()
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleGenerateReport = async () => {
    if (!date?.from || !date?.to) {
      setError("Please select a date range.")
      return
    }

    setLoading(true)
    setError("")
    setReportData(null)

    try {
      const response = await fetch(
        `/api/admin/reports?startDate=${date.from.toISOString()}&endDate=${date.to.toISOString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to generate report")
      }

      const data = await response.json()
      setReportData(data.reportData)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600">Generate and view system reports</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Allowance Summary Report</CardTitle>
          <CardDescription>Select a date range to generate a summary of allowance requests.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className="w-[300px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>{format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}</>
                    ) : (
                      format(date.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            <Button onClick={handleGenerateReport} disabled={loading}>
              {loading ? "Generating..." : "Generate Report"}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {reportData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Total Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{reportData.totalRequests}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Total Disbursed</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    ${reportData.totalAmount.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Requests by Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {reportData.requestsByStatus.map((item) => (
                      <li key={item.status} className="flex justify-between">
                        <span className="capitalize">{item.status}</span>
                        <span className="font-medium">{item.count}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>Breakdown by Group</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {reportData.requestsByGroup.map((item) => (
                      <li key={item.group} className="grid grid-cols-3 gap-4">
                        <span className="capitalize font-medium">{item.group}</span>
                        <span>{item.count} requests</span>
                        <span>
                          ${item.totalAmount.toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
