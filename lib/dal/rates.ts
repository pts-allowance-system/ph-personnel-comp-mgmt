import { Database } from "../database"
import type { Rate } from "../types"

export class RatesDAL {
  static async findAll(): Promise<Rate[]> {
    const sql = `
      SELECT id, group_name, tier, base_rate, effective_date, is_active, created_at, updated_at
      FROM allowance_rates
      WHERE is_active = true
      ORDER BY group_name, tier, effective_date DESC
    `

    const rates = await Database.query<any>(sql)

    return rates.map((rate) => ({
      id: rate.id,
      group: rate.group_name,
      tier: rate.tier,
      baseRate: Number.parseFloat(rate.base_rate),
      effectiveDate: rate.effective_date,
      isActive: rate.is_active,
    }))
  }

  static async findByGroupAndTier(group: string, tier: string): Promise<Rate | null> {
    const sql = `
      SELECT id, group_name, tier, base_rate, effective_date, is_active
      FROM allowance_rates
      WHERE group_name = ? AND tier = ? AND is_active = true
      ORDER BY effective_date DESC
      LIMIT 1
    `

    const rate = await Database.queryOne<any>(sql, [group, tier])

    if (!rate) return null

    return {
      id: rate.id,
      group: rate.group_name,
      tier: rate.tier,
      baseRate: Number.parseFloat(rate.base_rate),
      effectiveDate: rate.effective_date,
      isActive: rate.is_active,
    }
  }

  static async create(rateData: Omit<Rate, "id">): Promise<string> {
    const id = Database.generateId()

    const data = {
      id,
      group_name: rateData.group,
      tier: rateData.tier,
      base_rate: rateData.baseRate,
      effective_date: rateData.effectiveDate,
      is_active: rateData.isActive ?? true,
    }

    await Database.insert("allowance_rates", data)
    return id
  }

  static async update(id: string, updates: Partial<Rate>): Promise<boolean> {
    const data: Record<string, any> = {}

    if (updates.group) data.group_name = updates.group
    if (updates.tier) data.tier = updates.tier
    if (updates.baseRate) data.base_rate = updates.baseRate
    if (updates.effectiveDate) data.effective_date = updates.effectiveDate
    if (updates.isActive !== undefined) data.is_active = updates.isActive

    return await Database.update("allowance_rates", data, { id })
  }
}
