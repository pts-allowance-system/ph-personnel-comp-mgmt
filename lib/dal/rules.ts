import { db } from '@/lib/db';
import { allowanceRules } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { Rule } from "../models";

// Drizzle's inferred type for insert
type NewRule = typeof allowanceRules.$inferInsert;

export class RulesDAL {
  private static mapToRule(record: typeof allowanceRules.$inferSelect): Rule {
    return {
      id: record.id,
      name: record.name,
      description: record.description ?? undefined,
      priority: record.priority,
      // The 'conditions' and 'outcome' columns are JSON. Drizzle will parse them automatically.
      conditions: record.conditions as Rule['conditions'],
      outcome: record.outcome as Rule['outcome'],
      isActive: record.isActive ?? false,
    };
  }

  static async findAll(): Promise<Rule[]> {
    const results = await db.select().from(allowanceRules).orderBy(desc(allowanceRules.priority));
    return results.map(this.mapToRule);
  }

  static async findAllActive(): Promise<Rule[]> {
    const results = await db.select().from(allowanceRules).where(eq(allowanceRules.isActive, true)).orderBy(desc(allowanceRules.priority));
    return results.map(this.mapToRule);
  }

  static async findById(id: string): Promise<Rule | null> {
    const result = await db.select().from(allowanceRules).where(eq(allowanceRules.id, id)).limit(1);
    if (result.length === 0) return null;
    return this.mapToRule(result[0]);
  }

  static async create(ruleData: Omit<Rule, "id" | "isActive"> & { isActive?: boolean }): Promise<string> {
    const id = crypto.randomUUID();
    const newRule: NewRule = {
      id,
      name: ruleData.name,
      description: ruleData.description,
      priority: ruleData.priority,
      conditions: ruleData.conditions,
      outcome: ruleData.outcome,
      isActive: ruleData.isActive ?? true,
    };
    await db.insert(allowanceRules).values(newRule);
    return id;
  }

  static async update(id: string, updates: Partial<Rule>): Promise<boolean> {
    const result = await db.update(allowanceRules).set(updates).where(eq(allowanceRules.id, id));
    return result.rowsAffected > 0;
  }

  static async delete(id: string): Promise<boolean> {
    // This is a soft delete in the original code, but the schema doesn't reflect that.
    // Sticking to a hard delete as per the method name.
    const result = await db.delete(allowanceRules).where(eq(allowanceRules.id, id));
    return result.rowsAffected > 0;
  }
}
