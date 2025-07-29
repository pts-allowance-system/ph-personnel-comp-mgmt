import { type NextRequest, NextResponse } from "next/server"
import { UsersDAL } from "@/lib/dal/users"
import { verifyToken } from "@/lib/utils/auth-utils"

export async function GET(request: NextRequest, { params }: any) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const targetUser = await UsersDAL.findById(params.id)
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user: targetUser })
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: any) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const updates = await request.json()

    // Prevent updating sensitive or immutable fields
    if (updates.nationalId || updates.password) {
      return NextResponse.json({ error: "Cannot update sensitive fields" }, { status: 400 })
    }

    // Validate role if it's being updated
    if (updates.role) {
      const allowedRoles = ["employee", "supervisor", "hr", "finance", "admin"];
      if (!allowedRoles.includes(updates.role)) {
        return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
      }
    }
    const success = await UsersDAL.update(params.id, updates)

    if (!success) {
      return NextResponse.json({ error: "Failed to update user" }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: "User updated successfully" })
  } catch (error) {
    console.error("Update user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
