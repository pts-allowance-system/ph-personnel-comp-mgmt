import { type NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { UsersDAL } from "@/lib/dal/users";
import { RateLimiter } from "@/lib/utils/rate-limiter";

// Use the same secret as the middleware
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-super-secret-key-that-is-at-least-32-bytes-long");

const loginRateLimiter = new RateLimiter({
  limit: 10, // 10 requests
  windowMs: 60 * 1000, // 1 minute
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { allowed, remaining } = loginRateLimiter.check(ip);

  if (!allowed) {
    return NextResponse.json({ error: "Too many login attempts. Please try again later." }, { status: 429 });
  }

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
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
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

    // Add rate limit headers
    response.headers.set("X-RateLimit-Limit", "10");
    response.headers.set("X-RateLimit-Remaining", remaining.toString());

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
