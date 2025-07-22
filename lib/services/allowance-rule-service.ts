import { RulesDAL } from "@/lib/dal/rules";
import { Rule, RuleCondition, RuleOperator, User } from "@/lib/models";

export interface RuleResult {
  allowanceGroup: string;
  tier: string;
}

export class AllowanceRuleService {
  private static evaluateCondition(
    condition: RuleCondition,
    user: Partial<Pick<User, 'position' | 'department'>>
  ): boolean {
    const { fact, operator, value } = condition;
    const userValue = user[fact];

    if (!userValue) return false;

    switch (operator) {
      case RuleOperator.Equal:
        return userValue === value;
      case RuleOperator.NotEqual:
        return userValue !== value;
      case RuleOperator.In:
        return value.includes(userValue);
      case RuleOperator.NotIn:
        return !value.includes(userValue);
      default:
        return false;
    }
  }

  private static isRuleMatch(
    rule: Rule,
    user: Partial<Pick<User, 'position' | 'department'>>
  ): boolean {
    if (!rule.isActive || !rule.conditions?.all) return false;

    return rule.conditions.all.every((condition) =>
      this.evaluateCondition(condition, user)
    );
  }

  static async getAllowanceRateForUser(
    user: Partial<Pick<User, 'position' | 'department'>>
  ): Promise<RuleResult | null> {
    const rules = await RulesDAL.findMatchingRules(
      user.position ?? null,
      user.department ?? null
    );

    for (const rule of rules) {
      if (this.isRuleMatch(rule, user)) {
        const event = rule.conditions.event;
        if (event?.type === 'setAllowance') {
          return {
            allowanceGroup: event.params.group,
            tier: event.params.tier,
          };
        }
      }
    }

    return null;
  }
}
