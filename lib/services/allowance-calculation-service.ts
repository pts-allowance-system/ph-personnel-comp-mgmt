import { User, Rule, RuleCondition } from "../models";
import { RulesDAL } from "../dal/rules";

export class AllowanceCalculationService {

  private static evaluateCondition(condition: RuleCondition, user: Partial<User>): boolean {
    const userValue = user[condition.fact as keyof User] as any;

    if (userValue === undefined || userValue === null) {
      return false;
    }

    switch (condition.operator) {
      case 'Equal':
        return userValue === condition.value;
      case 'NotEqual':
        return userValue !== condition.value;
      case 'In':
        if (!Array.isArray(condition.value)) return false;
        if (Array.isArray(userValue)) {
          // If the user's value is an array (like certifications), check for intersection
          return userValue.some(val => (condition.value as any[]).includes(val));
        }
        return (condition.value as any[]).includes(userValue);
      case 'NotIn':
        if (!Array.isArray(condition.value)) return false;
        if (Array.isArray(userValue)) {
            // If the user's value is an array, check for no intersection
            return !userValue.some(val => (condition.value as any[]).includes(val));
        }
        return !(condition.value as any[]).includes(userValue);
      default:
        return false;
    }
  }

  private static evaluateRule(rule: Rule, user: Partial<User>): boolean {
    if (rule.conditions.all) {
      return rule.conditions.all.every((condition: RuleCondition) => this.evaluateCondition(condition, user));
    }
    if (rule.conditions.any) {
        return rule.conditions.any.some((condition: RuleCondition) => this.evaluateCondition(condition, user));
    }
    return false;
  }

  public static async calculate(user: Partial<User>): Promise<{ allowanceGroup: string | null; tier: string | null }> {
    const rules = await RulesDAL.findAllActive();

    for (const rule of rules) {
      if (this.evaluateRule(rule, user)) {
        return {
          allowanceGroup: rule.outcome.allowanceGroup,
          tier: rule.outcome.tier,
        };
      }
    }

    return { allowanceGroup: null, tier: null };
  }
}
