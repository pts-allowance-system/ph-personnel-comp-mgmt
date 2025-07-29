import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/utils/auth-utils";
import { AllowanceCalculationService } from "@/lib/services/allowance-calculation-service";
import { UsersDAL } from "@/lib/dal/users";
import cache from "@/lib/utils/cache";
import { User } from "@/lib/models";

export async function GET(
  request: NextRequest,
  { params }: any,
) {
  // Ensure params are resolved before use
  await request.text();
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  const cacheKey = `profile:${id}`;
  try {
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log(`[Cache] HIT for user ${id}`);
      return NextResponse.json(cachedData);
    }
    console.log(`[Cache] MISS for user ${id}`);

    const user = await UsersDAL.findById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const allowanceOutcome = await AllowanceCalculationService.calculate(user);

    // Combine user data with allowance outcome to create the profile response
    const profileData = {
      ...user,
      allowanceGroup: allowanceOutcome?.allowanceGroup ?? null,
      tier: allowanceOutcome?.tier ?? null,
    };

    cache.set(cacheKey, profileData);
    return NextResponse.json(profileData);
  } catch (error: any) {
    console.error(`[API] Error fetching profile for user ${id}:`, error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: any,
) {
  const { id } = params;
  try {
    // Await the body first to ensure params are populated
    const body = await request.json();

    const user = await verifyToken(request);
    if (!user || user.id !== id) {
      // Security check: ensure users can only update their own profile
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Whitelist updatable fields
    const allowedUpdates: Partial<User> = {};
    const updatableFields: (keyof User)[] = ['firstName', 'lastName', 'email', 'department', 'position', 'licenseNumber'];

    for (const field of updatableFields) {
      if (body[field] !== undefined) {
        (allowedUpdates as any)[field] = body[field];
      }
    }

    if (Object.keys(allowedUpdates).length === 0) {
        return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const success = await UsersDAL.update(id, allowedUpdates);

    if (success) {
      // Invalidate cache
      cache.del(`profile:${id}`);
      return NextResponse.json({ success: true, message: "Profile updated successfully" });
    } else {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

  } catch (error) {
    console.error(`Error updating user profile for id=${id}:`, error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
