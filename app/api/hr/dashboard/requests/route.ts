import { type NextRequest, NextResponse } from "next/server"
import { RequestsDAL } from "@/lib/dal/requests"
import { verifyToken } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "hr") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all requests with additional details
    const requests = await RequestsDAL.findAllWithDetails()

    return NextResponse.json({ requests })
  } catch (error) {
    console.error("HR dashboard requests error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
