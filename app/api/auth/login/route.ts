import { type NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { UsersDAL } from "@/lib/dal/users";

// Use the same secret as the middleware
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(request: NextRequest) {
  try {
    const { nationalId, password } = await request.json();

    if (!nationalId || !password) {
      return NextResponse.json(
        { error: "National ID and password are required" },
        { status: 400 }
      );
    }

    // Authenticate user
    const user = await UsersDAL.authenticate(nationalId, password);

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Generate JWT token using jose
    const token = await new SignJWT({
      id: user.id,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      nationalId: user.nationalId,
      department: user.department,
      position: user.position,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(JWT_SECRET);

    // Set HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      // Include the token in the response for the auth store
      token: token,
      user: {
        id: user.id,
        nationalId: user.nationalId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        department: user.department,
        position: user.position,
        isActive: user.isActive,
      },
    });

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
