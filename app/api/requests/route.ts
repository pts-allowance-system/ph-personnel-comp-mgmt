import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { verifyToken, TokenPayload } from "@/lib/utils/auth-utils"
import { RequestsDAL } from "@/lib/dal/requests"
import { RatesDAL } from "@/lib/dal/rates"
import cache from "@/lib/utils/cache"
import { AllowanceRequest, UserRole, RequestStatus } from "@/lib/models"
import { handleApiError } from "@/lib/utils/error-handler"
import { withAuthorization, NextRequestWithAuth } from "@/lib/utils/authorization"
import { ApiError } from "@/lib/utils/error-handler"

// Zod schema for document metadata
const documentSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().url(),
  path: z.string(),
  size: z.number(),
  type: z.string(),
  uploadedAt: z.string().optional(),
});

// Zod schema for request creation
const createRequestSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(128, "First name too long"),
  lastName: z.string().min(1, "Last name is required").max(128, "Last name too long"),
  employeeType: z.string().min(1, "Employee type is required"),
  requestType: z.string().min(1, "Request type is required"),
  position: z.string().optional(),
  department: z.string().optional(),
  mainDuties: z.string().min(1, "Main duties are required"),
  standardDuties: z.object({
    operations: z.boolean().default(false),
    planning: z.boolean().default(false),
    coordination: z.boolean().default(false),
    service: z.boolean().default(false),
  }).optional(),
  assignedTask: z.string().optional(),
  monthlyRate: z.number().positive("Monthly rate must be positive").optional(),
  totalAmount: z.number().positive("Total amount must be positive").optional(),
  effectiveDate: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  totalDays: z.number().int().positive("Total days must be a positive integer").optional(),
  allowanceGroup: z.string().min(1, "Allowance group is required"),
  tier: z.string().min(1, "Tier is required"),
  notes: z.string().optional(),
  documents: z.array(documentSchema).optional(),
  status: z.enum(["draft", "submitted"]).default("draft"),
}).refine((data) => {
  // For non-draft submissions, monthlyRate and totalAmount are required
  if (data.status !== 'draft') {
    return data.monthlyRate && data.totalAmount;
  }
  return true;
}, {
  message: "Monthly rate and total amount are required for submission",
  path: ["monthlyRate", "totalAmount"]
});

const getRequestsByRole = async (user: { id: string; role: UserRole; [key: string]: any }, fetchAll: boolean) => {
  const statusMap: Partial<Record<UserRole, RequestStatus>> = {
    supervisor: "submitted",
    hr: "approved",
    finance: "hr-checked",
  };

  switch (user.role) {
    case "employee":
      return RequestsDAL.findByUserId(user.id, fetchAll);
    case "supervisor":
    case "hr":
    case "finance":
      if (fetchAll) {
        return RequestsDAL.findAllWithDetails();
      }
      const status = statusMap[user.role];
      return status ? RequestsDAL.findByStatus(status) : [];
    case "admin":
      return RequestsDAL.findAllWithDetails();
    default:
      return [];
  }
};

async function getHandler(request: NextRequestWithAuth) {
  try {
    const user = request.user;
    const { searchParams } = new URL(request.url);
    const fetchAll = searchParams.get("fetchAll") === "true";

    // Construct a dynamic cache key based on role and fetchAll flag
    const cacheKey = `requests:role=${user.role}:fetchAll=${fetchAll}`;

    const cachedRequests = cache.get<{ requests: any[] }>(cacheKey);
    if (cachedRequests) {
      return NextResponse.json(cachedRequests);
    }

    const requests = await getRequestsByRole(user, fetchAll);

    const result = { requests };
    cache.set(cacheKey, result, 300); // Cache for 5 minutes

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

async function postHandler(request: NextRequestWithAuth) {
  try {
    const user = request.user;

    // Parse and validate request data
    const requestData = await request.json();
    const validation = createRequestSchema.safeParse(requestData);

    if (!validation.success) {
      throw new ApiError(400, "Validation failed", validation.error.issues);
    }

    const validatedData = validation.data;

    // Map validated data to the data model, ensuring all fields are included
    const newRequest: Omit<AllowanceRequest, "id" | "createdAt" | "updatedAt" | "comments" | "employeeName" | "approverName" | "approvedAt" | "approvedBy" | "dateOfRequest"> = {
      employeeId: user.id,
      status: validatedData.status,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      documents: validatedData.documents || [],
      notes: validatedData.notes || undefined,
      
      // Validated form fields
      employeeType: validatedData.employeeType,
      requestType: validatedData.requestType,
      position: validatedData.position || user.position || '',
      department: validatedData.department || user.department || '',
      mainDuties: validatedData.mainDuties,
      standardDuties: validatedData.standardDuties || { operations: false, planning: false, coordination: false, service: false },
      assignedTask: validatedData.assignedTask || undefined,
      monthlyRate: validatedData.monthlyRate || 0,
      totalAmount: validatedData.totalAmount || 0,
      effectiveDate: validatedData.effectiveDate || undefined,
      startDate: validatedData.startDate || undefined,
      endDate: validatedData.endDate || undefined,
      totalDays: validatedData.totalDays || undefined,
      allowanceGroup: validatedData.allowanceGroup,
      tier: validatedData.tier,
    };

    const id = await RequestsDAL.create(newRequest);

    // Clear all relevant caches upon new submission
    cache.invalidateRequestCache();

    // Fetch the created request to return it
    const createdRequest = await RequestsDAL.findById(id);
    if (!createdRequest) {
      throw new ApiError(500, "Failed to retrieve created request");
    }

    return NextResponse.json({
      success: true,
      message: "Request created successfully",
      request: createdRequest,
    });

  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuthorization([], getHandler);
export const POST = withAuthorization([], postHandler);
