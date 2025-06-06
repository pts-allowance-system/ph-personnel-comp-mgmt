import { type NextRequest, NextResponse } from "next/server"
import { Database } from "@/lib/database"
import { verifyToken } from "@/lib/auth-utils"
import { subMonths, format } from "date-fns"

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "hr") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get overall statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as totalRequests,
        SUM(CASE WHEN status IN ('approved', 'hr-checked', 'disbursed') THEN total_amount ELSE 0 END) as totalAmount,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as pendingRequests,
        COUNT(CASE WHEN status IN ('approved', 'hr-checked', 'disbursed') THEN 1 END) as approvedRequests,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejectedRequests,
        AVG(CASE WHEN status IN ('hr-checked', 'disbursed') 
            THEN DATEDIFF(updated_at, created_at) 
            ELSE NULL END) as averageProcessingTime
      FROM allowance_requests
    `

    const [statsResult] = await Database.query(statsQuery)

    // Get monthly data for the last 12 months
    const monthlyData = []
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(new Date(), i)
      const monthStart = format(date, "yyyy-MM-01")
      const monthEnd = format(new Date(date.getFullYear(), date.getMonth() + 1, 0), "yyyy-MM-dd")

      const monthlyQuery = `
        SELECT 
          COUNT(*) as requests,
          SUM(CASE WHEN status IN ('approved', 'hr-checked', 'disbursed') THEN total_amount ELSE 0 END) as amount,
          COUNT(CASE WHEN status IN ('approved', 'hr-checked', 'disbursed') THEN 1 END) as approved,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
        FROM allowance_requests
        WHERE created_at >= ? AND created_at <= ?
      `

      const [monthResult] = await Database.query(monthlyQuery, [monthStart, monthEnd + " 23:59:59"])

      monthlyData.push({
        month: format(date, "MMM yyyy"),
        requests: monthResult.requests || 0,
        amount: monthResult.amount || 0,
        approved: monthResult.approved || 0,
        rejected: monthResult.rejected || 0,
      })
    }

    return NextResponse.json({
      stats: {
        totalRequests: statsResult.totalRequests || 0,
        pendingRequests: statsResult.pendingRequests || 0,
        approvedRequests: statsResult.approvedRequests || 0,
        rejectedRequests: statsResult.rejectedRequests || 0,
        totalAmount: statsResult.totalAmount || 0,
        averageProcessingTime: Math.round(statsResult.averageProcessingTime || 0),
      },
      monthlyData,
    })
  } catch (error) {
    console.error("HR dashboard stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
