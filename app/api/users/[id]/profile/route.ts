import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/utils/auth-utils";
import { UserProfileService } from "@/lib/services/user-profile-service";
import { UsersDAL } from "@/lib/dal/users";
import cache from "@/lib/utils/cache";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Even if the body is not used, awaiting it resolves a Next.js issue
  // where params are accessed before the request is fully processed.
  await request.blob();
  const { id } = await params;

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

    const profileData = await UserProfileService.getProfile(id);

    if (!profileData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

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
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const user = await verifyToken(request);
    if (!user || user.userId !== id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Basic validation
    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      return NextResponse.json({ error: "Invalid update data" }, { status: 400 });
    }

    // Whitelist updatable fields to prevent users from changing their role, etc.
    const allowedUpdates: { [key: string]: any } = {};
    const updatableFields = ['firstName', 'lastName', 'email', 'department', 'position', 'licenseNumber'];

    for (const field of updatableFields) {
      if (body[field] !== undefined) {
        allowedUpdates[field] = body[field];
      }
    }

    if (Object.keys(allowedUpdates).length === 0) {
        return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const success = await UsersDAL.update(id, allowedUpdates);

    if (success) {
      // Invalidate cache
      const cacheKey = `profile:${id}`;
      cache.del(cacheKey);
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
