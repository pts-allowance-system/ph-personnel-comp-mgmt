import { type NextRequest, NextResponse } from "next/server"
import { Database } from "@/lib/database"
import { verifyToken } from "@/lib/auth-utils"
import { subMonths, format } from "date-fns"

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "finance") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get overall statistics
    const statsQuery = `
      SELECT 
        SUM(CASE WHEN status = 'disbursed' THEN total_amount ELSE 0 END) as totalDisbursements,
        COUNT(CASE WHEN status = 'hr-checked' THEN 1 END) as pendingDisbursements,
        SUM(CASE WHEN status = 'hr-checked' THEN total_amount ELSE 0 END) as totalPendingAmount,
        AVG(CASE WHEN status = 'disbursed' THEN total_amount ELSE NULL END) as averageDisbursementAmount,
        COUNT(CASE WHEN status = 'disbursed' THEN 1 END) as disbursementCount
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
          SUM(CASE WHEN status = 'disbursed' THEN total_amount ELSE 0 END) as disbursed,
          SUM(CASE WHEN status = 'hr-checked' THEN total_amount ELSE 0 END) as pending,
          COUNT(CASE WHEN status IN ('disbursed', 'hr-checked') THEN 1 END) as count
        FROM allowance_requests
        WHERE created_at >= ? AND created_at <= ?
      `

      const [monthResult] = await Database.query(monthlyQuery, [monthStart, monthEnd + " 23:59:59"])

      monthlyData.push({
        month: format(date, "MMM yyyy"),
        disbursed: monthResult.disbursed || 0,
        pending: monthResult.pending || 0,
        count: monthResult.count || 0,
      })
    }

    return NextResponse.json({
      stats: {
        totalDisbursements: statsResult.totalDisbursements || 0,
        pendingDisbursements: statsResult.pendingDisbursements || 0,
        totalPendingAmount: statsResult.totalPendingAmount || 0,
        averageDisbursementAmount: Math.round(statsResult.averageDisbursementAmount || 0),
        disbursementCount: statsResult.disbursementCount || 0,
      },
      monthlyData,
    })
  } catch (error) {
    console.error("Finance dashboard stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
