import { type NextRequest, NextResponse } from "next/server"
import { RulesDAL } from "@/lib/dal/rules"
import { verifyToken } from "@/lib/utils/auth-utils"

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rules = await RulesDAL.findAll()
    return NextResponse.json({ rules })
  } catch (error) {
    console.error("Get rules error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const ruleData = await request.json()

    // Basic validation
    if (!ruleData.name || typeof ruleData.conditions !== 'object') {
      return NextResponse.json({ error: 'Rule name and conditions are required.' }, { status: 400 });
    }

    const ruleId = await RulesDAL.create(ruleData)

    return NextResponse.json({
      success: true,
      ruleId,
      message: "Rule created successfully",
    })
  } catch (error) {
    console.error("Create rule error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
