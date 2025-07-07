import { type NextRequest, NextResponse } from "next/server"
import { RequestsDAL } from "@/lib/dal/requests"
import { RatesDAL } from "@/lib/dal/rates"
import { verifyToken } from "@/lib/auth-utils"
import cache from "@/lib/cache"
import { AllowanceRequest } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const fetchAll = searchParams.get("fetchAll") === "true"
    const userId = searchParams.get("userId")
    const department = searchParams.get("department")

    // Construct a dynamic cache key
    const cacheKey = `requests:role=${user.role}:userId=${userId || 'none'}:dept=${department || 'none'}:fetchAll=${fetchAll}`;

    const cachedRequests = cache.get<{ requests: any[] }>(cacheKey);
    if (cachedRequests) {
      console.log(`API: Cache hit for key: ${cacheKey}`);
      return NextResponse.json(cachedRequests);
    }

    console.log(`API: Cache miss for key: ${cacheKey}. Fetching from DB.`);

    let requests
    if (department) {
      requests = await RequestsDAL.findByDepartment(department)
    } else if (userId) {
      requests = await RequestsDAL.findByUserId(userId, fetchAll)
    } else if (user.role === "employee") {
      requests = await RequestsDAL.findByUserId(user.userId, fetchAll)
    } else {
      const statusMap = {
        supervisor: "submitted",
        hr: "approved",
        finance: "hr-checked",
      }
      if (fetchAll) {
        requests = await RequestsDAL.findAllWithDetails();
      } else {
        const roleStatus = statusMap[user.role as keyof typeof statusMap];
        requests = roleStatus ? await RequestsDAL.findByStatus(roleStatus) : [];
      }
    }

    const response = { requests };
    cache.set(cacheKey, response);

    return NextResponse.json(response)
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

    const newRequest: Omit<AllowanceRequest, "id" | "createdAt" | "updatedAt"> = {
      employeeId: user.userId,
      employeeName: user.name || "Unknown",
      group: requestData.group,
      tier: requestData.tier,
      startDate: requestData.startDate,
      endDate: requestData.endDate,
      status: requestData.status || "draft",
      totalAmount,
      documents: requestData.documents || [],
      notes: requestData.notes || null,
      // Fields to fix the type error
      department: user.department || "",
      position: user.position || "",
      employeeType: requestData.employeeType || "",
      requestType: requestData.requestType || "",
      mainDuties: requestData.mainDuties || "",
      standardDuties: requestData.standardDuties || { operations: false, planning: false, coordination: false, service: false },
      assignedTask: requestData.assignedTask || "",
      monthlyRate: rate.baseRate, // Assuming baseRate from rates is the monthlyRate
      effectiveDate: rate.effectiveDate, // Assuming effectiveDate from rates
    };

    const requestId = await RequestsDAL.create(newRequest);
    const createdRequest = await RequestsDAL.findById(requestId) // Fetch the full request

    if (!createdRequest) {
      // This case should ideally not happen if create was successful
      console.error(`Failed to fetch newly created request with id: ${requestId}`);
      return NextResponse.json({ error: "Failed to retrieve created request" }, { status: 500 });
    }

    // Invalidate cache
    const keys = cache.keys();
    const requestKeys = keys.filter(key => key.startsWith("requests:"));
    if (requestKeys.length > 0) {
      cache.del(requestKeys);
      console.log(`Cache invalidated for keys: ${requestKeys.join(', ')}`);
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
