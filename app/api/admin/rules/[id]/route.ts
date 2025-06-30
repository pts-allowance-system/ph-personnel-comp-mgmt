import { type NextRequest, NextResponse } from "next/server"
import { RulesDAL } from "@/lib/dal/rules"
import { verifyToken } from "@/lib/auth-utils"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rule = await RulesDAL.findById(params.id)
    if (!rule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 })
    }

    return NextResponse.json({ rule })
  } catch (error) {
    console.error("Get rule error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const updates = await request.json()
    const success = await RulesDAL.update(params.id, updates)

    if (!success) {
      return NextResponse.json({ error: "Failed to update rule" }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: "Rule updated successfully" })
  } catch (error) {
    console.error("Update rule error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
