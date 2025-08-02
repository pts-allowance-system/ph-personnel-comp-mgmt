import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { allowanceRequests } from "@/lib/db/schema";
import { withAuthorization, NextRequestWithAuth } from "@/lib/utils/authorization";
import { subMonths, format, startOfMonth, endOfMonth } from "date-fns";
import { sql, sum, count, avg, and, gte, lte } from "drizzle-orm";
import { handleApiError } from "@/lib/utils/error-handler";

async function getHandler(request: NextRequestWithAuth) {
  try {
    // Get overall statistics
    const [statsResult] = await db
      .select({
        totalDisbursements: sum(sql`CASE WHEN status = 'disbursed' THEN total_amount ELSE 0 END`.mapWith(Number)),
        pendingDisbursements: count(sql`CASE WHEN status = 'hr-checked' THEN 1 END`),
        totalPendingAmount: sum(sql`CASE WHEN status = 'hr-checked' THEN total_amount ELSE 0 END`.mapWith(Number)),
        averageDisbursementAmount: avg(sql`CASE WHEN status = 'disbursed' THEN total_amount ELSE NULL END`.mapWith(Number)),
        disbursementCount: count(sql`CASE WHEN status = 'disbursed' THEN 1 END`),
      })
      .from(allowanceRequests);

    // Get monthly data for the last 12 months in a single query
    const twelveMonthsAgo = startOfMonth(subMonths(new Date(), 11));
    const monthlyDataResult = await db
      .select({
        year: sql<number>`YEAR(created_at)`,
        month: sql<number>`MONTH(created_at)`,
        disbursed: sum(sql`CASE WHEN status = 'disbursed' THEN total_amount ELSE 0 END`.mapWith(Number)),
        pending: sum(sql`CASE WHEN status = 'hr-checked' THEN total_amount ELSE 0 END`.mapWith(Number)),
        count: count(sql`CASE WHEN status IN ('disbursed', 'hr-checked') THEN 1 END`),
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
        disbursed: result?.disbursed || 0,
        pending: result?.pending || 0,
        count: result?.count || 0,
      });
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
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuthorization(['finance'], getHandler);
