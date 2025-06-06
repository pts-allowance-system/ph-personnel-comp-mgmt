import { type NextRequest, NextResponse } from "next/server"
import { RatesDAL } from "@/lib/dal/rates"
import { verifyToken } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rates = await RatesDAL.findAll()
    return NextResponse.json({ rates })
  } catch (error) {
    console.error("Get rates error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rateData = await request.json()
    const rateId = await RatesDAL.create(rateData)

    return NextResponse.json({
      success: true,
      rateId,
      message: "Rate created successfully",
    })
  } catch (error) {
    console.error("Create rate error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
