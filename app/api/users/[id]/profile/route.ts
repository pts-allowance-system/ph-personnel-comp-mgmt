import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/utils/auth-utils";
import { AllowanceCalculationService } from "@/lib/services/allowance-calculation-service";
import { UsersDAL } from "@/lib/dal/users";
import cache from "@/lib/utils/cache";
import { User } from "@/lib/models";
import { handleApiError } from "@/lib/utils/error-handler";

/**
 * Defines the shape of the context object passed to the route handlers.
 * Ensures that the `params` object is correctly typed as a Promise.
 */
type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const requestingUser = await verifyToken(request);
    if (!requestingUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Authorization check: User can only get their own profile, unless they are an admin/hr.
    if (requestingUser.id !== id && !['admin', 'hr'].includes(requestingUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const cacheKey = `profile:${id}`;
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
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  try {
    // Await the body first to ensure params are populated
    const body = await request.json();

    const requestingUser = await verifyToken(request);
    // Security check: ensure users can only update their own profile
    if (!requestingUser || requestingUser.id !== id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Whitelist updatable fields
    const allowedUpdates: Partial<User> = {};
    const updatableFields: (keyof User)[] = ['firstName', 'lastName', 'email', 'department', 'position', 'licenseNumber'];

    for (const field of updatableFields) {
      if (body[field] !== undefined) {
        allowedUpdates[field as keyof User] = body[field];
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
    return handleApiError(error);
  }
}
