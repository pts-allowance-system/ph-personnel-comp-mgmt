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

    // Validate group and tier
    if (!requestData.group || !requestData.tier) {
      return NextResponse.json({ error: "Group and tier are required" }, { status: 400 })
    }

    // Get rate for calculation
    const rate = await RatesDAL.findByGroupAndTier(requestData.group, requestData.tier)
    if (!rate || typeof rate.baseRate !== "number") {
      return NextResponse.json({ error: "Rate not found or is invalid" }, { status: 400 })
    }

    // Validate dates
    if (!requestData.startDate || !requestData.endDate) {
      return NextResponse.json({ error: "Start date and end date are required" }, { status: 400 })
    }

    // Calculate total amount
    const startDate = new Date(requestData.startDate)
    const endDate = new Date(requestData.endDate)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const zoneMultiplier = requestData.zoneMultiplier || 1.2
    const totalAmount = rate.baseRate * days * zoneMultiplier

    if (isNaN(totalAmount)) {
        console.error("Calculated totalAmount is NaN", {
            baseRate: rate.baseRate,
            days,
            zoneMultiplier,
        });
        return NextResponse.json({ error: "Failed to calculate total amount due to invalid inputs" }, { status: 400 });
    }

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
      notes: requestData.notes || null,
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
