import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"; // Force dynamic rendering
import { RequestsDAL } from "@/lib/dal/requests"
import { verifyToken } from "@/lib/auth-utils"
import cache from "@/lib/cache"

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  // paramsPromise is a Promise, await it to get the actual params
  console.log("[DEBUG] Route Handler GET: paramsPromise received.");
  try {
    const params = await paramsPromise;
    console.log("[DEBUG] Route Handler GET: Resolved params:", JSON.stringify(params, null, 2));
    const requestIdFromParams = params.id;
    if (!requestIdFromParams) {
      return NextResponse.json({ error: "Invalid request ID" }, { status: 400 })
    }

    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const cacheKey = `request:${requestIdFromParams}`;
    const cachedRequest = cache.get(cacheKey);
    if (cachedRequest) {
      console.log(`[Cache] HIT for key: ${cacheKey}`);
      return NextResponse.json(cachedRequest);
    }
    console.log(`[Cache] MISS for key: ${cacheKey}`);

    const requestData = await RequestsDAL.findById(requestIdFromParams)
    console.log("[API_ROUTE_DEBUG] Raw requestData from DAL:", JSON.stringify(requestData, null, 2));

    if (!requestData) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    // Check permissions
    if (user.role === "employee" && requestData.employeeId !== user.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    cache.set(cacheKey, requestData);

    return NextResponse.json(requestData)
  } catch (error) {
    console.error("Get request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // context.params is a Promise, await it to get the actual params
  console.log("[DEBUG] Route Handler PATCH: context.params (Promise) received.");
  try {
    const params = await context.params;
    console.log("[DEBUG] Route Handler PATCH: Resolved params:", JSON.stringify(params, null, 2));
    const requestIdFromParams = params.id;
    if (!requestIdFromParams) {
      return NextResponse.json({ error: "Invalid request ID" }, { status: 400 })
    }

    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const updates = await request.json()

    const success = await RequestsDAL.update(requestIdFromParams, updates)

    if (!success) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    // Invalidate caches
    const individualCacheKey = `request:${requestIdFromParams}`;
    cache.del(individualCacheKey);

    const listCacheKeys = cache.keys().filter(k => k.startsWith('requests:'));
    if (listCacheKeys.length > 0) {
      cache.del(listCacheKeys);
    }
    console.log(`[Cache] Invalidated cache for ${individualCacheKey} and all 'requests:*' lists.`);

    return NextResponse.json({
      success: true,
      message: "Request updated successfully",
    })
  } catch (error) {
    console.error("Update request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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
