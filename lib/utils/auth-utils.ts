import type { NextRequest } from "next/server"
import jwt from "jsonwebtoken"
import { UsersDAL } from "@/lib/dal/users"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

interface TokenPayload {
  id: string
  role: string
  nationalId: string
  firstName: string
  lastName: string
  department?: string
  position?: string
}

export async function verifyToken(request: NextRequest): Promise<TokenPayload | null> {
  const userHeader = request.headers.get("x-user");
  if (!userHeader) {
    console.error("[verifyToken] Auth failed: x-user header is missing.");
    return null;
  }

  try {
    const decodedUser = Buffer.from(userHeader, 'base64').toString('utf-8');
    const userPayload = JSON.parse(decodedUser);
    
    // The payload from the middleware already contains what we need.
    // We trust the middleware to have performed the necessary checks.
    return {
      id: userPayload.id,
      role: userPayload.role,
      nationalId: userPayload.nationalId,
      firstName: userPayload.firstName,
      lastName: userPayload.lastName,
      department: userPayload.department,
      position: userPayload.position,
    };

  } catch (error) {
    console.error("[verifyToken] Failed to decode or parse x-user header:", error);
    return null;
  }
}
