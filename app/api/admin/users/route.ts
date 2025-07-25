import { type NextRequest, NextResponse } from "next/server"
import { UsersDAL } from "@/lib/dal/users"
import { verifyToken } from "@/lib/utils/auth-utils"

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role")
    const isActive = searchParams.get("isActive")

    const filters: { role?: string; isActive?: boolean } = {}
    if (role && role !== "all") filters.role = role
    if (isActive !== null) filters.isActive = isActive === "true"

    const users = await UsersDAL.findAll(filters)

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Get users error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userData = await request.json()

    // Validate required fields
    const requiredFields = ["nationalId", "firstName", "lastName", "email", "role", "password"];
    for (const field of requiredFields) {
      if (!userData[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    const allowedRoles = ["employee", "supervisor", "hr", "finance", "admin"];
    if (!allowedRoles.includes(userData.role)) {
      return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await UsersDAL.findByNationalId(userData.nationalId)
    if (existingUser) {
      return NextResponse.json({ error: "User with this National ID already exists" }, { status: 400 })
    }

    const userId = await UsersDAL.create(userData)

    return NextResponse.json({
      success: true,
      userId,
      message: "User created successfully",
    })
  } catch (error) {
    console.error("Create user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
