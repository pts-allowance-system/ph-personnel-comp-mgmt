import { type NextRequest, NextResponse } from "next/server"
import { RequestsDAL } from "@/lib/dal/requests"
import { verifyToken } from "@/lib/utils/auth-utils"
import cache from "@/lib/utils/cache"
import { withValidation } from "@/lib/utils/validation"
import { updateRequestSchema } from "@/lib/schemas"

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Invalid request ID" }, { status: 400 })
    }

    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const cacheKey = `request:${id}`;
    const cachedRequest = cache.get(cacheKey);
    if (cachedRequest) {
      return NextResponse.json({ request: cachedRequest });
    }

    const requestData = await RequestsDAL.findById(id)

    if (!requestData) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    // In the JWT, the user's ID is stored in the `id` field.
    if (user.role === "employee" && requestData.employeeId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    cache.set(cacheKey, requestData);

    return NextResponse.json({ request: requestData })
  } catch (error) {
    console.error("Get request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function patchHandler(
  request: any,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    if (!id) {
      return NextResponse.json({ error: "Invalid request ID" }, { status: 400 })
    }

    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const updates = request.parsedBody;

    // Add logic here to check if the user is allowed to update the request
    // For example, an employee should only be able to update their own draft requests.
    // An admin or HR person might have more permissions.

    const success = await RequestsDAL.update(id, updates)

    if (!success) {
      return NextResponse.json({ error: "Request not found or no changes made" }, { status: 404 })
    }

    // Invalidate caches
    cache.del(`request:${id}`);
    const listCacheKeys = cache.keys().filter(k => k.startsWith('requests:'));
    if (listCacheKeys.length > 0) {
      cache.del(listCacheKeys);
    }

    return NextResponse.json({
      success: true,
      message: "Request updated successfully",
    })
  } catch (error) {
    console.error("Update request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const PATCH = withValidation(updateRequestSchema, patchHandler);

// Handle unsupported HTTP methods
export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}

export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
