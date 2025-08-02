import { type NextRequest, NextResponse } from "next/server"
import { RequestsDAL } from "@/lib/dal/requests"
import { withValidation, NextRequestWithExtras, RouteContext } from "@/lib/utils/validation"
import { withAuthorization, NextRequestWithAuth } from "@/lib/utils/authorization"
import { updateRequestSchema } from "@/lib/schemas"
import { handleApiError, ApiError } from "@/lib/utils/error-handler"
import { canTransition, canViewRequest, RequestStatus } from "@/lib/authz" 
import cache from "@/lib/utils/cache"
import { withPerformanceMonitoring } from "@/lib/middleware/performance-middleware"

// Refactored GET handler using the centralized authorization module
async function getHandler(request: NextRequestWithAuth, { params }: RouteContext<{ id: string }>) {
  try {
    const user = request.user;
    const requestData = await RequestsDAL.findById(params.id);

    if (!requestData) {
      throw new ApiError(404, "Request not found");
    }

    // Centralized authorization check
    if (!canViewRequest(user, requestData)) {
      throw new ApiError(403, "Forbidden");
    }

    return NextResponse.json({ request: requestData });
  } catch (error) {
    return handleApiError(error);
  }
}

// Refactored PATCH handler with workflow authorization
async function patchHandler(request: NextRequestWithExtras & NextRequestWithAuth, { params }: RouteContext<{ id: string }>) {
  try {
    const { id } = params;
    const updates = request.parsedBody;
    const user = request.user;

    const currentRequest = await RequestsDAL.findById(id);
    if (!currentRequest) {
      throw new ApiError(404, "Request not found");
    }

    const isStatusUpdate = updates.status && updates.status !== currentRequest.status;
    if (isStatusUpdate) {
      const transitionAllowed = canTransition(user.role, currentRequest.status as RequestStatus, updates.status as RequestStatus);
      if (!transitionAllowed) {
        throw new ApiError(403, `User with role '${user.role}' cannot change status from '${currentRequest.status}' to '${updates.status}'`);
      }
    }

    if (user.role === 'employee') {
      if (currentRequest.employeeId !== user.id) {
        throw new ApiError(403, "You can only update your own requests.");
      }
      // Employees can only modify requests that are in draft status.
      if (currentRequest.status !== 'draft') {
        throw new ApiError(403, "You can only modify requests that are in draft status.");
      }
    }

    if (user.role === 'supervisor') {
        if (currentRequest.department !== user.department) {
            throw new ApiError(403, "You can only approve requests from your own department.");
        }
    }

    if (isStatusUpdate) {
      updates.approvedBy = user.id;
      updates.approvedAt = new Date();
    }

    const success = await RequestsDAL.update(id, updates);
    if (!success) {
      throw new ApiError(400, "Failed to update request");
    }

    // Use the centralized cache invalidation method
    cache.invalidateRequestCache(id);

    const updatedRequest = await RequestsDAL.findById(id);

    return NextResponse.json({ success: true, message: "Request updated successfully", request: updatedRequest });

  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withPerformanceMonitoring(withAuthorization(
  ['admin', 'finance', 'hr', 'supervisor', 'employee'],
  getHandler
));

export const PATCH = withPerformanceMonitoring(withAuthorization(
  ['admin', 'finance', 'hr', 'supervisor', 'employee'],
  withValidation(updateRequestSchema, patchHandler)
));
