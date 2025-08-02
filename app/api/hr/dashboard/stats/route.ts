import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { allowanceRequests } from "@/lib/db/schema";
import { withAuthorization, NextRequestWithAuth } from "@/lib/utils/authorization";
import { subMonths, format, startOfMonth } from "date-fns";
import { sql, sum, count, avg, and, gte } from "drizzle-orm";
import { handleApiError } from "@/lib/utils/error-handler";

async function getHandler(request: NextRequestWithAuth) {
  try {
    // Get overall statistics
    const [statsResult] = await db
      .select({
        totalRequests: count(allowanceRequests.id),
        totalAmount: sum(sql`CASE WHEN status IN ('approved', 'hr-checked', 'disbursed') THEN total_amount ELSE 0 END`.mapWith(Number)),
        pendingRequests: count(sql`CASE WHEN status = 'approved' THEN 1 END`),
        approvedRequests: count(sql`CASE WHEN status IN ('approved', 'hr-checked', 'disbursed') THEN 1 END`),
        rejectedRequests: count(sql`CASE WHEN status = 'rejected' THEN 1 END`),
        averageProcessingTime: avg(sql`CASE WHEN status IN ('hr-checked', 'disbursed') THEN DATEDIFF(updated_at, created_at) ELSE NULL END`.mapWith(Number)),
      })
      .from(allowanceRequests);

    // Get monthly data for the last 12 months in a single query
    const twelveMonthsAgo = startOfMonth(subMonths(new Date(), 11));
    const monthlyDataResult = await db
      .select({
        year: sql<number>`YEAR(created_at)`,
        month: sql<number>`MONTH(created_at)`,
        requests: count(allowanceRequests.id),
        amount: sum(sql`CASE WHEN status IN ('approved', 'hr-checked', 'disbursed') THEN total_amount ELSE 0 END`.mapWith(Number)),
        approved: count(sql`CASE WHEN status IN ('approved', 'hr-checked', 'disbursed') THEN 1 END`),
        rejected: count(sql`CASE WHEN status = 'rejected' THEN 1 END`),
      })
      .from(allowanceRequests)
      .where(gte(allowanceRequests.createdAt, twelveMonthsAgo))
      .groupBy(sql`YEAR(created_at)`, sql`MONTH(created_at)`)
      .orderBy(sql`YEAR(created_at)`, sql`MONTH(created_at)`);

    // Create a map for quick lookups
    const monthlyMap = new Map(monthlyDataResult.map(row => [`${row.year}-${row.month}`, row]));

    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const key = `${year}-${month}`;
      const result = monthlyMap.get(key);

      monthlyData.push({
        month: format(date, "MMM yyyy"),
        requests: result?.requests || 0,
        amount: Number(result?.amount || 0),
        approved: result?.approved || 0,
        rejected: result?.rejected || 0,
      });
    }

    return NextResponse.json({
      stats: {
        totalRequests: statsResult.totalRequests || 0,
        pendingRequests: statsResult.pendingRequests || 0,
        approvedRequests: statsResult.approvedRequests || 0,
        rejectedRequests: statsResult.rejectedRequests || 0,
        totalAmount: Number(statsResult.totalAmount || 0),
        averageProcessingTime: Math.round(Number(statsResult.averageProcessingTime || 0)),
      },
      monthlyData,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuthorization(['hr'], getHandler);
