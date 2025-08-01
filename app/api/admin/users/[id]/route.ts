import { type NextRequest, NextResponse } from "next/server"
import { UsersDAL } from "@/lib/dal/users"
import { withValidation, NextRequestWithExtras } from "@/lib/utils/validation"
import { withAuthorization } from "@/lib/utils/authorization"
import { updateUserSchema } from "@/lib/schemas"
import { handleApiError, ApiError } from "@/lib/utils/error-handler"
import cache from "@/lib/utils/cache"

type RouteContext = {
  params: {
    id: string
  }
}

// GET /api/admin/users/[id]
async function getHandler(request: NextRequest, { params }: RouteContext) {
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
async function patchHandler(request: NextRequestWithExtras, { params }: RouteContext) {
  try {
    const updates = request.parsedBody;

    const success = await UsersDAL.update(params.id, updates)

    if (!success) {
      throw new ApiError(400, "Failed to update user");
    }

    // Invalidate caches
    cache.del(`user:${params.id}`);
    const userListCacheKeys = cache.keys().filter(k => k.startsWith('users:'));
    if (userListCacheKeys.length > 0) {
      cache.del(userListCacheKeys);
    }

    return NextResponse.json({ success: true, message: "User updated successfully" })
  } catch (error) {
    return handleApiError(error)
  }
}

export const GET = withAuthorization(['admin'], getHandler);
export const PATCH = withAuthorization(['admin'], withValidation(updateUserSchema, patchHandler));
