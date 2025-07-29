import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { allowanceRequests } from "@/lib/db/schema"
import { verifyToken } from "@/lib/utils/auth-utils"
import { subMonths, format, startOfMonth, endOfMonth } from "date-fns"
import { sql, sum, count, avg, and, gte, lte, inArray } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "hr") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get overall statistics
    const [statsResult] = await db
      .select({
        totalRequests: count(allowanceRequests.id),
        totalAmount: sum(sql`CASE WHEN status IN ('approved', 'hr-checked', 'disbursed') THEN total_amount ELSE 0 END`),
        pendingRequests: count(sql`CASE WHEN status = 'approved' THEN 1 END`),
        approvedRequests: count(sql`CASE WHEN status IN ('approved', 'hr-checked', 'disbursed') THEN 1 END`),
        rejectedRequests: count(sql`CASE WHEN status = 'rejected' THEN 1 END`),
        averageProcessingTime: avg(sql`CASE WHEN status IN ('hr-checked', 'disbursed') THEN DATEDIFF(updated_at, created_at) ELSE NULL END`),
      })
      .from(allowanceRequests);

    // Get monthly data for the last 12 months
    const monthlyData = []
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(new Date(), i)
      const monthStart = startOfMonth(date)
      const monthEnd = endOfMonth(date)

      const [monthResult] = await db
        .select({
          requests: count(allowanceRequests.id),
          amount: sum(sql`CASE WHEN status IN ('approved', 'hr-checked', 'disbursed') THEN total_amount ELSE 0 END`),
          approved: count(sql`CASE WHEN status IN ('approved', 'hr-checked', 'disbursed') THEN 1 END`),
          rejected: count(sql`CASE WHEN status = 'rejected' THEN 1 END`),
        })
        .from(allowanceRequests)
        .where(
          and(
            gte(allowanceRequests.createdAt, monthStart),
            lte(allowanceRequests.createdAt, monthEnd)
          )
        );

      monthlyData.push({
        month: format(date, "MMM yyyy"),
        requests: monthResult.requests || 0,
        amount: Number(monthResult.amount) || 0,
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
        totalAmount: Number(statsResult.totalAmount) || 0,
        averageProcessingTime: Math.round(Number(statsResult.averageProcessingTime) || 0),
      },
      monthlyData,
    })
  } catch (error) {
    console.error("HR dashboard stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
