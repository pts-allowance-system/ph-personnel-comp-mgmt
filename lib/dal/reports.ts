import { Database } from "../database"

export interface AllowanceSummaryReport {
  totalRequests: number
  totalAmount: number
  requestsByStatus: { status: string; count: number }[]
  requestsByGroup: { group: string; count: number; totalAmount: number }[]
}

export class ReportsDAL {
  static async getAllowanceSummary(startDate: Date, endDate: Date): Promise<AllowanceSummaryReport> {
    const totalRequestsSql = `
      SELECT COUNT(*) as count
      FROM allowance_requests
      WHERE created_at BETWEEN ? AND ?
    `
    const totalAmountSql = `
      SELECT SUM(total_amount) as total
      FROM allowance_requests
      WHERE status = 'disbursed' AND created_at BETWEEN ? AND ?
    `
    const byStatusSql = `
      SELECT status, COUNT(*) as count
      FROM allowance_requests
      WHERE created_at BETWEEN ? AND ?
      GROUP BY status
    `
    const byGroupSql = `
      SELECT group_name as 'group', COUNT(*) as count, SUM(total_amount) as totalAmount
      FROM allowance_requests
      WHERE created_at BETWEEN ? AND ?
      GROUP BY group_name
    `

    const [totalRequestsResult, totalAmountResult, byStatusResult, byGroupResult] = await Promise.all([
      Database.queryOne<{ count: number }>(totalRequestsSql, [startDate, endDate]),
      Database.queryOne<{ total: number }>(totalAmountSql, [startDate, endDate]),
      Database.query<any>(byStatusSql, [startDate, endDate]),
      Database.query<any>(byGroupSql, [startDate, endDate]),
    ])

    return {
      totalRequests: totalRequestsResult?.count ?? 0,
      totalAmount: totalAmountResult?.total ?? 0,
      requestsByStatus: byStatusResult,
      requestsByGroup: byGroupResult.map(r => ({ ...r, totalAmount: parseFloat(r.totalAmount) })),
    }
  }
}
