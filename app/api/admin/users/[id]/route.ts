import { type NextRequest, NextResponse } from "next/server"
import { UsersDAL } from "@/lib/dal/users"
import { withValidation, NextRequestWithExtras, RouteContext } from "@/lib/utils/validation"
import { withAuthorization } from "@/lib/utils/authorization"
import { updateUserSchema } from "@/lib/schemas"
import { handleApiError, ApiError } from "@/lib/utils/error-handler"
import cache from "@/lib/utils/cache"
import { User } from "@/lib/models"

// GET /api/admin/users/[id]
async function getHandler(request: NextRequest, { params }: RouteContext<{ id: string }>) {
  try {
    const cacheKey = `user:${params.id}`;
    const cachedUser = cache.get(cacheKey);
    if (cachedUser) {
      return NextResponse.json({ user: cachedUser });
    }

    const user = await UsersDAL.findById(params.id)
    if (!user) {
      throw new ApiError(404, "User not found")
    }

    cache.set(cacheKey, user);
    return NextResponse.json({ user })
  } catch (error) {
    return handleApiError(error)
  }
}

// PATCH /api/admin/users/[id]
async function patchHandler(request: NextRequestWithExtras, { params }: RouteContext<{ id: string }>) {
  try {
    const updates = request.parsedBody as Partial<User>;

    const success = await UsersDAL.update(params.id, updates)

    if (!success) {
      throw new ApiError(404, "User not found or update failed");
    }

    // Invalidate user-specific and list caches
    cache.invalidateUserCache(params.id);

    return NextResponse.json({ success: true, message: "User updated successfully" })
  } catch (error) {
    return handleApiError(error)
  }
}

export const GET = withAuthorization(['admin'], getHandler);
export const PATCH = withAuthorization(['admin'], withValidation(updateUserSchema, patchHandler));
