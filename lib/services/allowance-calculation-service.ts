import { User } from "../models";
import rules from '../config/allowance-rules.json';

export class AllowanceCalculationService {

  private static hasIntersection(arr1: (string[] | undefined) | null, arr2: string[]): boolean {
    if (!arr1) return false;
    return arr1.some(item => arr2.includes(item));
  }

  private static _calculateDoctorAllowance(user: Partial<User>): { allowanceGroup: string; tier: string } {
    if (this.hasIntersection(user.certifications, rules.doctor_tier_3_specializations)) {
      return { allowanceGroup: "แพทย์", tier: "3" };
    }
    if ((user.certifications && user.certifications.length > 0) || user.hasSpecialOrder) {
        return { allowanceGroup: "แพทย์", tier: "2" };
    }
    return { allowanceGroup: "แพทย์", tier: "1" };
  }

  private static _calculateDentistAllowance(user: Partial<User>): { allowanceGroup: string; tier: string } {
    if (user.certifications && user.certifications.length > 0) {
        return { allowanceGroup: "ทันตแพทย์", tier: "3" };
    }
    if (user.hasSpecialOrder) {
        return { allowanceGroup: "ทันตแพทย์", tier: "2" };
    }
    return { allowanceGroup: "ทันตแพทย์", tier: "1" };
  }

  private static _calculatePharmacistAllowance(user: Partial<User>): { allowanceGroup: string; tier: string } {
    if (this.hasIntersection(user.specialTasks, rules.pharmacist_tier_2_tasks)) {
        return { allowanceGroup: "เภสัชกร", tier: "2" };
    }
    return { allowanceGroup: "เภสัชกร", tier: "1" };
  }

  private static _calculateNurseAllowance(user: Partial<User>): { allowanceGroup: string; tier: string } {
    const department = user.department ? [user.department] : [];
    if (
      (user.position && rules.nurse_tier_3_positions.includes(user.position)) ||
      this.hasIntersection(department, rules.nurse_tier_3_departments) ||
      (user.certifications && user.certifications.includes("พยาบาลการพยาบาลเวชปฏิบัติ")) ||
      (user.certifications && user.certifications.includes("APN"))
    ) {
        return { allowanceGroup: "พยาบาลวิชาชีพ", tier: "3" };
    }
    if (this.hasIntersection(department, rules.nurse_tier_2_departments) || (user.specialTasks && user.specialTasks.length > 0)) {
        return { allowanceGroup: "พยาบาลวิชาชีพ", tier: "2" };
    }
    if (this.hasIntersection(department, rules.nurse_tier_1_departments)) {
      return { allowanceGroup: "พยาบาลวิชาชีพ", tier: "1" };
    }
    return { allowanceGroup: "พยาบาลวิชาชีพ", tier: "1" };
  }

  private static _calculateAlliedHealthAllowance(user: Partial<User>): { allowanceGroup: string; tier: string } {
    return { allowanceGroup: "สหวิชาชีพ", tier: "1" };
  }

  public static calculate(user: Partial<User>): { allowanceGroup: string | null; tier: string | null } {
    const { position } = user;

    if (!position) {
      return { allowanceGroup: null, tier: null };
    }

    if (rules.positions.doctor.includes(position)) {
      return this._calculateDoctorAllowance(user);
    }

    if (rules.positions.dentist.includes(position)) {
        return this._calculateDentistAllowance(user);
    }

    if (rules.positions.pharmacist.includes(position)) {
        return this._calculatePharmacistAllowance(user);
    }

    if (rules.positions.nurse.includes(position)) {
      return this._calculateNurseAllowance(user);
    }

    if (this.hasIntersection([position], rules.positions.allied_health)) {
        return this._calculateAlliedHealthAllowance(user);
    }

    return { allowanceGroup: null, tier: null };
  }
}

