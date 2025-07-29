import { User, Rule, RuleCondition, RuleOperator, RuleOutcome } from "../models";
import { RulesDAL } from "../dal/rules";

export class AllowanceCalculationService {

  private static evaluateCondition(condition: RuleCondition, user: Partial<User>): boolean {
    const userValue = user[condition.fact];

    if (userValue === undefined || userValue === null) {
      return false;
    }

    const conditionValue = condition.value;

    switch (condition.operator) {
      case RuleOperator.Equal:
        return userValue === conditionValue;
      case RuleOperator.NotEqual:
        return userValue !== conditionValue;
      case RuleOperator.In:
        if (!Array.isArray(conditionValue)) return false;
        if (Array.isArray(userValue)) {
          // If the user's value is an array (like certifications), check for intersection
          return userValue.some(val => (conditionValue as any[]).includes(val));
        }
        return (conditionValue as any[]).includes(userValue); // userValue is not an array here
      case RuleOperator.NotIn:
        if (!Array.isArray(conditionValue)) return false;
        if (Array.isArray(userValue)) {
            // If the user's value is an array, check for no intersection
            return !userValue.some(val => (conditionValue as any[]).includes(val));
        }
        return !(conditionValue as any[]).includes(userValue); // userValue is not an array here
      default:
        // This should be unreachable if the rule is validated
        return false;
    }
  }

  private static evaluateRule(rule: Rule, user: Partial<User>): boolean {
    if (rule.conditions.all && rule.conditions.all.length > 0) {
      return rule.conditions.all.every((condition) => this.evaluateCondition(condition, user));
    }
    if (rule.conditions.any && rule.conditions.any.length > 0) {
        return rule.conditions.any.some((condition) => this.evaluateCondition(condition, user));
    }
    return false;
  }

  public static async calculate(user: Partial<User>): Promise<RuleOutcome | null> {
    const rules = await RulesDAL.findAllActive();

    // The rules are already sorted by priority in the DAL
    for (const rule of rules) {
      if (this.evaluateRule(rule, user)) {
        return rule.outcome;
      }
    }

    return null;
  }
}
