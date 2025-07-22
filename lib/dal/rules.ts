import { Database } from "../database";
import { Rule } from "../models";

export class RulesDAL {
  static async findAll(): Promise<Rule[]> {
    const sql = `
      SELECT id, name, description, conditions, isActive, created_at, updated_at
      FROM allowance_rules
      ORDER BY name ASC
    `;
    const rows = await Database.query<any>(sql);
    return rows.map((row) => ({ ...row, conditions: JSON.parse(row.conditions) }));
  }

  static async findMatchingRules(
    position: string | null,
    department: string | null
  ): Promise<Rule[]> {
    if (!position && !department) {
      return [];
    }

    // Use JSON_EXTRACT and JSON_CONTAINS for robust querying of JSON data.
    let sql = `
      SELECT id, name, description, conditions, isActive, created_at, updated_at
      FROM allowance_rules
      WHERE isActive = true AND (
    `;

    const conditions: string[] = [];
    if (position) {
      conditions.push(
        `JSON_CONTAINS(JSON_EXTRACT(conditions, '$.all[*].fact'), '"position"')`
      );
    }
    if (department) {
      conditions.push(
        `JSON_CONTAINS(JSON_EXTRACT(conditions, '$.all[*].fact'), '"department"')`
      );
    }

    sql += conditions.join(" OR ") + " ) ORDER BY name ASC";

    const rows = await Database.query<any>(sql);
    return rows.map((row) => ({ ...row, conditions: JSON.parse(row.conditions) }));
  }

  static async findById(id: string): Promise<Rule | null> {
    const sql = `
      SELECT id, name, description, conditions, isActive, created_at, updated_at
      FROM allowance_rules
      WHERE id = ?
    `
    const row = await Database.queryOne<any>(sql, [id])
    if (!row) return null
    return { ...row, conditions: JSON.parse(row.conditions) }
  }

  static async create(ruleData: Omit<Rule, "id">): Promise<string> {
    const id = Database.generateId()
    const data = {
      id,
      name: ruleData.name,
      description: ruleData.description,
      conditions: JSON.stringify(ruleData.conditions),
      isActive: ruleData.isActive ?? true,
    }
    await Database.insert("allowance_rules", data)
    return id
  }

  static async update(id: string, updates: Partial<Rule>): Promise<boolean> {
    const data: Record<string, any> = {}
    if (updates.name) data.name = updates.name
    if (updates.description) data.description = updates.description
    if (updates.conditions) data.conditions = JSON.stringify(updates.conditions)
    if (updates.isActive !== undefined) data.isActive = updates.isActive

    if (Object.keys(data).length === 0) return false

    return await Database.update("allowance_rules", data, { id })
  }
}
