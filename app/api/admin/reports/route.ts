import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-utils"
import { ReportsDAL } from "@/lib/dal/reports"

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "Start date and end date are required" }, { status: 400 })
    }

    const reportData = await ReportsDAL.getAllowanceSummary(new Date(startDate), new Date(endDate))

    return NextResponse.json({ reportData })
  } catch (error) {
    console.error("Get report error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
