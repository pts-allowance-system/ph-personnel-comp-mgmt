import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { allowanceRequests } from "@/lib/db/schema"
import { verifyToken } from "@/lib/utils/auth-utils"
import { subMonths, format, startOfMonth, endOfMonth } from "date-fns"
import { sql, sum, count, avg, and, gte, lte, inArray, eq } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "finance") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get overall statistics
    const [statsResult] = await db
      .select({
        totalDisbursements: sum(sql`CASE WHEN status = 'disbursed' THEN total_amount ELSE 0 END`),
        pendingDisbursements: count(sql`CASE WHEN status = 'hr-checked' THEN 1 END`),
        totalPendingAmount: sum(sql`CASE WHEN status = 'hr-checked' THEN total_amount ELSE 0 END`),
        averageDisbursementAmount: avg(sql`CASE WHEN status = 'disbursed' THEN total_amount ELSE NULL END`),
        disbursementCount: count(sql`CASE WHEN status = 'disbursed' THEN 1 END`),
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
          disbursed: sum(sql`CASE WHEN status = 'disbursed' THEN total_amount ELSE 0 END`),
          pending: sum(sql`CASE WHEN status = 'hr-checked' THEN total_amount ELSE 0 END`),
          count: count(sql`CASE WHEN status IN ('disbursed', 'hr-checked') THEN 1 END`),
        })
        .from(allowanceRequests)
        .where(and(
          gte(allowanceRequests.createdAt, monthStart),
          lte(allowanceRequests.createdAt, monthEnd)
        ));

      monthlyData.push({
        month: format(date, "MMM yyyy"),
        disbursed: Number(monthResult.disbursed) || 0,
        pending: Number(monthResult.pending) || 0,
        count: monthResult.count || 0,
      })
    }

    return NextResponse.json({
      stats: {
        totalDisbursements: Number(statsResult.totalDisbursements) || 0,
        pendingDisbursements: statsResult.pendingDisbursements || 0,
        totalPendingAmount: Number(statsResult.totalPendingAmount) || 0,
        averageDisbursementAmount: Math.round(Number(statsResult.averageDisbursementAmount) || 0),
        disbursementCount: statsResult.disbursementCount || 0,
      },
      monthlyData,
    })
  } catch (error) {
    console.error("Finance dashboard stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
