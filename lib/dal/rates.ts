import { db } from "@/lib/db";
import { allowanceRates } from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import type { Rate } from "../models";

export class RatesDAL {
  static async findAll(): Promise<Rate[]> {
    const results = await db
      .select({
        id: allowanceRates.id,
        allowanceGroup: allowanceRates.groupName,
        tier: allowanceRates.tier,
        monthlyRate: allowanceRates.baseRate,
        effectiveDate: allowanceRates.effectiveDate,
        isActive: allowanceRates.isActive,
      })
      .from(allowanceRates)
      .where(eq(allowanceRates.isActive, true))
      .orderBy(
        desc(allowanceRates.groupName),
        desc(allowanceRates.tier),
        desc(allowanceRates.effectiveDate)
      );

    return results.map((rate) => ({
      ...rate,
      monthlyRate: Number(rate.monthlyRate),
      effectiveDate: rate.effectiveDate ? new Date(rate.effectiveDate).toISOString().split('T')[0] : '',
      isActive: rate.isActive ?? false,
    }));
  }

  static async findByGroupAndTier(
    allowanceGroup: string,
    tier: string
  ): Promise<Rate | null> {
    const result = await db
      .select({
        id: allowanceRates.id,
        allowanceGroup: allowanceRates.groupName,
        tier: allowanceRates.tier,
        monthlyRate: allowanceRates.baseRate,
        effectiveDate: allowanceRates.effectiveDate,
        isActive: allowanceRates.isActive,
      })
      .from(allowanceRates)
      .where(
        and(
          eq(allowanceRates.groupName, allowanceGroup),
          eq(allowanceRates.tier, tier),
          eq(allowanceRates.isActive, true)
        )
      )
      .orderBy(desc(allowanceRates.effectiveDate))
      .limit(1);

    if (result.length === 0) return null;

    const rate = result[0];
    return {
      ...rate,
      monthlyRate: Number(rate.monthlyRate),
      effectiveDate: rate.effectiveDate ? new Date(rate.effectiveDate).toISOString().split('T')[0] : '',
      isActive: rate.isActive ?? false,
    };
  }

  static async create(rateData: Omit<Rate, "id">): Promise<string> {
    const id = crypto.randomUUID();
    await db.insert(allowanceRates).values({
      id,
      groupName: rateData.allowanceGroup,
      tier: rateData.tier,
      baseRate: rateData.monthlyRate.toString(),
      effectiveDate: new Date(rateData.effectiveDate),
      isActive: rateData.isActive ?? true,
      updatedAt: new Date(),
    });
    return id;
  }

  static async findActiveGroupsAndTiers(): Promise<Pick<Rate, 'allowanceGroup' | 'tier' | 'monthlyRate'>[]> {
    const rankedRates = db
      .select({
        allowanceGroup: allowanceRates.groupName,
        tier: allowanceRates.tier,
        monthlyRate: allowanceRates.baseRate,
        rn: sql<number>`ROW_NUMBER() OVER(PARTITION BY ${allowanceRates.groupName}, ${allowanceRates.tier} ORDER BY ${allowanceRates.effectiveDate} DESC)`.as("rn"),
      })
      .from(allowanceRates)
      .where(eq(allowanceRates.isActive, true))
      .as("rankedRates");

    const results = await db
      .select({
        allowanceGroup: rankedRates.allowanceGroup,
        tier: rankedRates.tier,
        monthlyRate: rankedRates.monthlyRate,
      })
      .from(rankedRates)
      .where(eq(rankedRates.rn, 1))
      .orderBy(rankedRates.allowanceGroup, rankedRates.tier);

    return results.map((rate) => ({
      ...rate,
      monthlyRate: Number(rate.monthlyRate),
    }));
  }

  static async update(id: string, updates: Partial<Rate>): Promise<boolean> {
    const data: Record<string, any> = {};
    if (updates.allowanceGroup) data.groupName = updates.allowanceGroup;
    if (updates.tier) data.tier = updates.tier;
    if (updates.monthlyRate) data.baseRate = updates.monthlyRate.toString();
    if (updates.effectiveDate) data.effectiveDate = new Date(updates.effectiveDate);
    if (updates.isActive !== undefined) data.isActive = updates.isActive;

    if (Object.keys(data).length === 0) return false;

    data.updatedAt = new Date();
    const result = await db.update(allowanceRates).set(data).where(eq(allowanceRates.id, id));
    return result[0].affectedRows > 0;
  }
}