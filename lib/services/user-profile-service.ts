import { UsersDAL } from "@/lib/dal/users";
import { AllowanceCalculationService } from "./allowance-calculation-service";
import { UserProfile } from "../models";

export class UserProfileService {
  static async getProfile(userId: string): Promise<UserProfile | null> {
    const user = await UsersDAL.findById(userId);
    if (!user) {
      return null;
    }

    const { allowanceGroup, tier } = await AllowanceCalculationService.calculate(user);

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      position: user.position ?? null,
      department: user.department ?? null,
      allowanceGroup,
      tier,
      nationalId: user.nationalId ?? null,
      positionId: user.positionId ?? null,
      licenseNumber: user.licenseNumber ?? null,
      specialTasks: user.specialTasks ?? [],
    };
  }


}
