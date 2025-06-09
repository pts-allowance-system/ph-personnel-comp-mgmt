import { type NextRequest, NextResponse } from "next/server"
import { RequestsDAL } from "@/lib/dal/requests"
import { RatesDAL } from "@/lib/dal/rates"
import { verifyToken } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const userId = searchParams.get("userId")

    let requests
    if (status) {
      requests = await RequestsDAL.findByStatus(status)
    } else if (userId) {
      requests = await RequestsDAL.findByUserId(userId)
    } else if (user.role === "employee") {
      requests = await RequestsDAL.findByUserId(user.userId)
    } else {
      // For supervisors, HR, finance - get requests based on status
      const statusMap = {
        supervisor: "submitted",
        hr: "approved",
        finance: "hr-checked",
      }
      const defaultStatus = statusMap[user.role as keyof typeof statusMap]
      requests = defaultStatus ? await RequestsDAL.findByStatus(defaultStatus) : []
    }

    return NextResponse.json({ requests })
  } catch (error) {
    console.error("Get requests error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const requestData = await request.json()

    // Get rate for calculation
    const rate = await RatesDAL.findByGroupAndTier(requestData.group, requestData.tier)
    if (!rate) {
      return NextResponse.json({ error: "Rate not found" }, { status: 400 })
    }

    // Calculate total amount
    const startDate = new Date(requestData.startDate)
    const endDate = new Date(requestData.endDate)
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const zoneMultiplier = requestData.zoneMultiplier || 1.2
    const totalAmount = rate.baseRate * days * zoneMultiplier

    const newRequest = {
      employeeId: user.userId,
      employeeName: user.name || "Unknown",
      group: requestData.group,
      tier: requestData.tier,
      startDate: requestData.startDate,
      endDate: requestData.endDate,
      status: requestData.status || "draft",
      baseRate: rate.baseRate,
      zoneMultiplier,
      totalAmount,
      documents: requestData.documents || [],
      comments: [],
    }

    const requestId = await RequestsDAL.create(newRequest)
    const createdRequest = await RequestsDAL.findById(requestId) // Fetch the full request

    if (!createdRequest) {
      // This case should ideally not happen if create was successful
      console.error(`Failed to fetch newly created request with id: ${requestId}`);
      return NextResponse.json({ error: "Failed to retrieve created request" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      request: createdRequest, // Return the full request object
      message: "Request created successfully",
    })
  } catch (error) {
    console.error("Create request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
