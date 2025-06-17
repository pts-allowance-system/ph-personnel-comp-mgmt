import type { NextRequest } from "next/server"
import jwt from "jsonwebtoken"
import { UsersDAL } from "./dal/users"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

interface TokenPayload {
  userId: string
  role: string
  nationalId: string
  name?: string
}

export async function verifyToken(request: NextRequest): Promise<TokenPayload | null> {
  try {
    // Get token from cookie or Authorization header
    const token =
      request.cookies.get("auth-token")?.value || request.headers.get("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return null;
    }

    // Verify JWT token
    let decoded: TokenPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (err) {
      console.error("[verifyToken] JWT verification failed:", err);
      return null;
    }

    // Optionally verify user still exists and is active
    const user = await UsersDAL.findById(decoded.userId)

    // --- DEBUGGING: Log the user object and isActive status ---
    console.log("[verifyToken] User found:", JSON.stringify(user, null, 2))
    if (user) {
      console.log(`[verifyToken] Checking user isActive status: ${user.isActive}, type: ${typeof user.isActive}`)
    }
    // --- END DEBUGGING ---

    if (!user || !user.isActive) {
      console.error(`[verifyToken] Auth failed for user ${decoded.userId}. User not found or inactive.`)
      return null
    }

    return {
      userId: decoded.userId,
      role: decoded.role,
      nationalId: decoded.nationalId,
      name: user.name,
    }
  } catch (error) {
    console.error("Token verification error:", error)
    return null
  }
}
