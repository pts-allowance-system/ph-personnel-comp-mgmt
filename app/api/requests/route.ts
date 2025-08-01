import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/utils/auth-utils"
import { RequestsDAL } from "@/lib/dal/requests"
import { RatesDAL } from "@/lib/dal/rates"
import cache from "@/lib/utils/cache"
import { AllowanceRequest } from "@/lib/models"

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
      // Return a deep clone to prevent object mutation issues
      return NextResponse.json(JSON.parse(JSON.stringify(cachedRequests)));
    }

    console.log(`API: Cache miss for key: ${cacheKey}. Fetching from DB.`);

    let requests
    if (department) {
      requests = await RequestsDAL.findByDepartment(department)
    } else if (userId) {
      requests = await RequestsDAL.findByUserId(userId, fetchAll)
    } else if (user.role === "employee") {
      requests = await RequestsDAL.findByUserId(user.id, fetchAll)
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

    // All fields from the new form are expected to be in requestData
    const { 
      firstName,
      lastName,
      employeeType, 
      requestType, 
      position, 
      department, 
      mainDuties, 
      standardDuties, 
      assignedTask, 
      monthlyRate, 
      totalAmount, 
      effectiveDate, 
      startDate, 
      endDate, 
      totalDays, 
      allowanceGroup, 
      tier, 
      notes, 
      documents, 
      status 
    } = requestData;

    // For non-draft submissions, basic validation is required.
    if (status !== 'draft' && (!monthlyRate || !totalAmount)) {
      return NextResponse.json({ error: "Monthly rate and total amount are required for submission" }, { status: 400 });
    }

    const newRequest: Omit<AllowanceRequest, "id" | "createdAt" | "updatedAt" | "comments" | "employeeName" | "approverName" | "approvedAt" | "approvedBy" | "dateOfRequest"> = {
      employeeId: user.id,
      status: status || "draft",
      documents: documents || [],
      notes: notes || null,
      
      // New form fields
      employeeType: employeeType || null,
      requestType: requestType || null,
      position: position || user.position,
      department: department || user.department,
      mainDuties: mainDuties || null,
      standardDuties: typeof standardDuties === 'object' && standardDuties !== null ? standardDuties : { operations: false, planning: false, coordination: false, service: false },
      assignedTask: assignedTask || null,
      monthlyRate,
      totalAmount,
      effectiveDate: effectiveDate || null,
      startDate: startDate || null,
      endDate: endDate || null,
      totalDays: totalDays || null,
      allowanceGroup: allowanceGroup || null,
      tier: tier || null,
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
    const requestKeys = keys.filter((key: string) => key.startsWith("requests:"));
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
