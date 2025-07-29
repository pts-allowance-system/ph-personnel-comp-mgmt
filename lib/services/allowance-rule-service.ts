import { RulesDAL } from '../dal/rules';
import { Rule } from '../models';

export class AllowanceRuleService {
  static async getAllRules(): Promise<Rule[]> {
    // In a real application, you might want to add pagination here
    return await RulesDAL.findAllActive();
  }

  static async getRuleById(id: string): Promise<Rule | null> {
    return await RulesDAL.findById(id);
  }

  static async createRule(ruleData: Omit<Rule, 'id' | 'isActive'> & { isActive?: boolean }): Promise<string> {
    // In a real application, you would add validation logic here (e.g., using Zod)
    // to ensure the ruleData conforms to the expected schema before saving.
    return await RulesDAL.create(ruleData);
  }

  static async updateRule(id: string, updates: Partial<Rule>): Promise<boolean> {
    // Similar to create, you would add validation for the updates here.
    return await RulesDAL.update(id, updates);
  }

  static async deleteRule(id: string): Promise<boolean> {
    return await RulesDAL.delete(id);
  }
}
