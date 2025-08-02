import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SignJWT } from "jose";
import { UsersDAL } from "@/lib/dal/users";
import { withRateLimit } from "@/lib/middleware/rate-limiter";
import { handleApiError, ApiError } from "@/lib/utils/error-handler";
import * as bcrypt from "bcryptjs";

// Use the same secret as the middleware
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// Zod schema for login validation
const loginSchema = z.object({
  nationalId: z.string()
    .min(1, "National ID is required")
    .max(13, "National ID must be 13 characters or less")
    .regex(/^\d+$/, "National ID must contain only numbers"),
  password: z.string()
    .min(1, "Password is required")
    .max(255, "Password is too long"),
});

async function loginHandler(request: NextRequest) {
  try {
    // Parse and validate request data
    const requestData = await request.json();
    const result = loginSchema.safeParse(requestData);

    if (!result.success) {
      // Simplified ApiError call to match the new constructor
      throw new ApiError(400, "Invalid input data");
    }

    const { nationalId, password } = result.data;

    // Authenticate user using the dedicated DAL method
    const user = await UsersDAL.authenticate(nationalId, password);
    if (!user) {
      // Return generic error to prevent user enumeration
      throw new ApiError(401, "Invalid credentials");
    }

    // Create JWT token
    const tokenPayload = {
      id: user.id,
      role: user.role,
      nationalId: user.nationalId,
      firstName: user.firstName,
      lastName: user.lastName,
      department: user.department,
      position: user.position,
    };

    const token = await new SignJWT(tokenPayload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(JWT_SECRET);

    // Create secure cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      maxAge: 60 * 60 * 24, // 24 hours in seconds
      path: "/",
    };

    // Create response with token cookie
    const response = NextResponse.json(
      {
        success: true,
        user: tokenPayload,
      },
      { status: 200 }
    );

    // Set the token as an HTTP-only cookie
    response.cookies.set("token", token, cookieOptions);

    return response;
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

// Apply rate limiting middleware to login handler with 'auth' configuration
export const POST = withRateLimit('auth')(loginHandler);
