import { type NextRequest, NextResponse } from "next/server"
import { UsersDAL } from "@/lib/dal/users"
import { withValidation, NextRequestWithExtras } from "@/lib/utils/validation"
import { withAuthorization } from "@/lib/utils/authorization"
import { createUserSchema } from "@/lib/schemas"
import { verifyToken } from "@/lib/utils/auth-utils"
import { handleApiError, ApiError } from "@/lib/utils/error-handler"
import cache from "@/lib/utils/cache"

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "admin") {
      throw new ApiError(401, "Unauthorized");
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role") || 'all'
    const isActive = searchParams.get("isActive") ?? 'all'
    const searchTerm = searchParams.get("searchTerm") || ''

    const cacheKey = `users:role=${role}:isActive=${isActive}:searchTerm=${searchTerm}`;
    const cachedUsers = cache.get(cacheKey);
    if (cachedUsers) {
      return NextResponse.json({ users: cachedUsers });
    }

    const filters: { role?: string; isActive?: boolean, searchTerm?: string } = {}
    if (role && role !== "all") filters.role = role
    if (isActive !== 'all') filters.isActive = isActive === "true"
    if (searchTerm) filters.searchTerm = searchTerm


    const users = await UsersDAL.findAll(filters)

    cache.set(cacheKey, users);

    return NextResponse.json({ users })
  } catch (error) {
    return handleApiError(error);
  }
}

async function postHandler(request: NextRequestWithExtras) {
  try {
    const userData = request.parsedBody;

    const existingUser = await UsersDAL.findByNationalId(userData.nationalId)
    if (existingUser) {
      throw new ApiError(409, "User with this National ID already exists");
    }

    const userId = await UsersDAL.create(userData)

    // Invalidate user list caches
    const userCacheKeys = cache.keys().filter(k => k.startsWith('users:'));
    if (userCacheKeys.length > 0) {
      cache.del(userCacheKeys);
    }

    return NextResponse.json({
      success: true,
      userId,
      message: "User created successfully",
    }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as any).code === 'ER_DUP_ENTRY') {
        if ((error as any).message.includes('email')) {
            throw new ApiError(409, "User with this email already exists.");
        }
    }
    return handleApiError(error);
  }
}

export const POST = withAuthorization(['admin'], withValidation(createUserSchema, postHandler));
