import { type NextRequest, NextResponse } from "next/server"
import { UsersDAL } from "@/lib/dal/users"
import { withValidation, NextRequestWithExtras } from "@/lib/utils/validation"
import { withAuthorization, NextRequestWithAuth } from "@/lib/utils/authorization"
import { createUserSchema } from "@/lib/schemas"
import { handleApiError, ApiError } from "@/lib/utils/error-handler"
import cache from "@/lib/utils/cache"
import { User } from "@/lib/models"
import bcrypt from 'bcryptjs';

async function getHandler(request: NextRequestWithAuth) {
  try {
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
    const userData = request.parsedBody as Omit<User, 'id' | 'isActive'> & { password: string };

    // Hash the password before creating the user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const existingUser = await UsersDAL.findByNationalId(userData.nationalId)
    if (existingUser) {
      throw new ApiError(409, "User with this National ID already exists");
    }

    const userId = await UsersDAL.create({ ...userData, password: hashedPassword })

    // Invalidate user list cache
    cache.invalidateUserCache();

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

export const GET = withAuthorization(['admin'], getHandler);
export const POST = withAuthorization(['admin'], withValidation(createUserSchema, postHandler));
