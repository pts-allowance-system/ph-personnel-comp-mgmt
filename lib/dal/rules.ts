import { Database } from "../database"
import type { Rule } from "../types"

export class RulesDAL {
  static async findAll(): Promise<Rule[]> {
    const sql = `
      SELECT id, name, description, conditions, isActive, created_at, updated_at
      FROM allowance_rules
      ORDER BY name ASC
    `
    const rows = await Database.query<any>(sql)
    return rows.map(row => ({ ...row, conditions: JSON.parse(row.conditions) }))
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
