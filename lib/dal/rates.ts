import { Database } from "../database"
import type { Rate } from "../models"

export class RatesDAL {
  static async findAll(): Promise<Rate[]> {
    const sql = `
      SELECT 
        id, 
        \`group_name\` AS allowanceGroup, 
        tier, 
        base_rate AS monthlyRate, 
        effective_date AS effectiveDate, 
        isActive
      FROM allowance_rates
      WHERE isActive = true
      ORDER BY allowanceGroup, tier, effectiveDate DESC
    `

    const rates = await Database.query<any>(sql)

    return rates.map((rate) => ({
      ...rate,
      monthlyRate: Number.parseFloat(rate.monthlyRate),
    }))
  }

  static async findByGroupAndTier(allowanceGroup: string, tier: string): Promise<Rate | null> {
    const sql = `
      SELECT 
        id, 
        \`group_name\` AS allowanceGroup, 
        tier, 
        base_rate AS monthlyRate, 
        effective_date AS effectiveDate, 
        isActive
      FROM allowance_rates
      WHERE \`group_name\` = ? AND tier = ? AND isActive = true
      ORDER BY effectiveDate DESC
      LIMIT 1
    `

    const rate = await Database.queryOne<any>(sql, [allowanceGroup, tier])

    if (!rate) return null

    return {
      ...rate,
      monthlyRate: Number.parseFloat(rate.monthlyRate),
    }
  }

  static async create(rateData: Omit<Rate, "id">): Promise<string> {
    const id = Database.generateId()

    const data = {
      id,
      group_name: rateData.allowanceGroup,
      tier: rateData.tier,
      base_rate: rateData.monthlyRate,
      effective_date: rateData.effectiveDate,
      isActive: rateData.isActive ?? true,
    }

    await Database.insert("allowance_rates", data)
    return id
  }

  static async findActiveGroupsAndTiers(): Promise<Pick<Rate, 'allowanceGroup' | 'tier' | 'monthlyRate'>[]> {
    const sql = `
      WITH RankedRates AS (
        SELECT
            group_name AS allowanceGroup,
            tier,
            base_rate AS monthlyRate,
            ROW_NUMBER() OVER(PARTITION BY group_name, tier ORDER BY effective_date DESC) as rn
        FROM
            allowance_rates
        WHERE
            isActive = true
      )
      SELECT
          allowanceGroup,
          tier,
          monthlyRate
      FROM
          RankedRates
      WHERE
          rn = 1
      ORDER BY
          allowanceGroup,
          tier;
    `
    const rates = await Database.query<any>(sql);
    return rates.map((rate) => ({
      ...rate,
      monthlyRate: Number.parseFloat(rate.monthlyRate),
    }));
  }

  static async update(id: string, updates: Partial<Rate>): Promise<boolean> {
    const data: Record<string, any> = {}

    if (updates.allowanceGroup) data.group_name = updates.allowanceGroup
    if (updates.tier) data.tier = updates.tier
    if (updates.monthlyRate) data.base_rate = updates.monthlyRate
    if (updates.effectiveDate) data.effective_date = updates.effectiveDate
    if (updates.isActive !== undefined) data.isActive = updates.isActive

    if (Object.keys(data).length === 0) return false

    return await Database.update("allowance_rates", data, { id })
  }
}