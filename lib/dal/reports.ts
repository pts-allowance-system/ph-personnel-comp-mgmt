import { db } from "@/lib/db"
import { allowanceRequests } from "@/lib/db/schema"
import { and, between, count, eq, sum } from "drizzle-orm"

export interface AllowanceSummaryReport {
  totalRequests: number
  totalAmount: number
  requestsByStatus: { status: string; count: number }[]
  requestsByGroup: { group: string; count: number; totalAmount: number }[]
}

export class ReportsDAL {
  static async getAllowanceSummary(startDate: Date, endDate: Date): Promise<AllowanceSummaryReport> {
    const totalRequestsQuery = db
      .select({ count: count() })
      .from(allowanceRequests)
      .where(between(allowanceRequests.createdAt, startDate, endDate));

    const totalAmountQuery = db
      .select({ total: sum(allowanceRequests.totalAmount) })
      .from(allowanceRequests)
      .where(
        and(
          eq(allowanceRequests.status, "disbursed"),
          between(allowanceRequests.createdAt, startDate, endDate)
        )
      );

    const byStatusQuery = db
      .select({ status: allowanceRequests.status, count: count() })
      .from(allowanceRequests)
      .where(between(allowanceRequests.createdAt, startDate, endDate))
      .groupBy(allowanceRequests.status);

    const byGroupQuery = db
      .select({
        group: allowanceRequests.allowanceGroup,
        count: count(),
        totalAmount: sum(allowanceRequests.totalAmount),
      })
      .from(allowanceRequests)
      .where(between(allowanceRequests.createdAt, startDate, endDate))
      .groupBy(allowanceRequests.allowanceGroup);

    const [
      totalRequestsResult,
      totalAmountResult,
      byStatusResult,
      byGroupResult,
    ] = await Promise.all([
      totalRequestsQuery,
      totalAmountQuery,
      byStatusQuery,
      byGroupQuery,
    ]);

    return {
      totalRequests: totalRequestsResult[0]?.count ?? 0,
      totalAmount: Number(totalAmountResult[0]?.total) ?? 0,
      requestsByStatus: byStatusResult.map(r => ({ status: r.status || 'unknown', count: r.count })),
      requestsByGroup: byGroupResult.map(r => ({
        group: r.group || 'unknown',
        count: r.count,
        totalAmount: Number(r.totalAmount) ?? 0,
      })),
    };
  }
}
