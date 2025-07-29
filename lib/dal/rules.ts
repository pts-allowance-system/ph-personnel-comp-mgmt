import { Database } from "../database";
import { Rule } from "../models";

export class RulesDAL {
  static async findAll(): Promise<Rule[]> {
    const sql = `
      SELECT id, name, description, priority, conditions, outcome, isActive
      FROM allowance_rules
      ORDER BY priority DESC
    `;
    return await Database.query<Rule>(sql);
  }

  static async findAllActive(): Promise<Rule[]> {
    const sql = `
      SELECT id, name, description, priority, conditions, outcome, isActive
      FROM allowance_rules
      WHERE isActive = true
      ORDER BY priority DESC
    `;
    // The mysql2 driver should automatically parse JSON columns.
    return await Database.query<Rule>(sql);
  }

  static async findById(id: string): Promise<Rule | null> {
    const sql = `
      SELECT id, name, description, priority, conditions, outcome, isActive
      FROM allowance_rules
      WHERE id = ?
    `;
    return await Database.queryOne<Rule>(sql, [id]);
  }

  static async create(ruleData: Omit<Rule, "id" | "isActive"> & { isActive?: boolean }): Promise<string> {
    const id = Database.generateId();
    const data = {
      id,
      name: ruleData.name,
      description: ruleData.description,
      priority: ruleData.priority,
      conditions: JSON.stringify(ruleData.conditions),
      outcome: JSON.stringify(ruleData.outcome),
      isActive: ruleData.isActive ?? true,
    };
    await Database.insert("allowance_rules", data);
    return id;
  }

  static async update(id: string, updates: Partial<Rule>): Promise<boolean> {
    const data: Record<string, any> = {};
    if (updates.name) data.name = updates.name;
    if (updates.description) data.description = updates.description;
    if (updates.priority !== undefined) data.priority = updates.priority;
    if (updates.conditions) data.conditions = JSON.stringify(updates.conditions);
    if (updates.outcome) data.outcome = JSON.stringify(updates.outcome);
    if (updates.isActive !== undefined) data.isActive = updates.isActive;

    if (Object.keys(data).length === 0) return false;

    return await Database.update("allowance_rules", data, { id });
  }

  static async delete(id: string): Promise<boolean> {
    return await Database.delete("allowance_rules", { id });
  }
}
