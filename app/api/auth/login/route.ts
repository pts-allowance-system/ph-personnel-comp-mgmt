import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { UsersDAL } from "@/lib/dal/users"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function POST(request: NextRequest) {
  try {
    const { nationalId, password } = await request.json()

    if (!nationalId || !password) {
      return NextResponse.json({ error: "National ID and password are required" }, { status: 400 })
    }

    // Authenticate user
    const user = await UsersDAL.authenticate(nationalId, password)

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        nationalId: user.nationalId,
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    )

    // Set HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        nationalId: user.nationalId,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        position: user.position,
        isActive: user.isActive,
      },
      token,
    })

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60, // 24 hours
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
