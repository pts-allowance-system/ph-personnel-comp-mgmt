import { type NextRequest, NextResponse } from "next/server"
import { RequestsDAL } from "@/lib/dal/requests"
import { withValidation, NextRequestWithExtras } from "@/lib/utils/validation"
import { withAuthorization, AuthenticatedRequest } from "@/lib/utils/authorization"
import { updateRequestSchema } from "@/lib/schemas"
import { handleApiError, ApiError } from "@/lib/utils/error-handler"
import { canTransition, canViewRequest, RequestStatus } from "@/lib/authz" // Updated import
import cache from "@/lib/utils/cache"

type RouteContext = {
  params: {
    id: string
  }
}

// Refactored GET handler using the centralized authorization module
async function getHandler(request: AuthenticatedRequest, { params }: RouteContext) {
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
async function patchHandler(request: NextRequestWithExtras & AuthenticatedRequest, { params }: RouteContext) {
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
      if (currentRequest.status !== 'draft' && isStatusUpdate) {
        throw new ApiError(403, "You can only submit requests that are in draft status.");
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

    cache.del(`request:${id}`);
    const listCacheKeys = cache.keys().filter(k => k.startsWith('requests:'));
    if (listCacheKeys.length > 0) {
      cache.del(listCacheKeys);
    }

    const updatedRequest = await RequestsDAL.findById(id);

    return NextResponse.json({ success: true, message: "Request updated successfully", request: updatedRequest });

  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuthorization(
  ['admin', 'finance', 'hr', 'supervisor', 'employee'],
  getHandler
);

export const PATCH = withAuthorization(
  ['admin', 'finance', 'hr', 'supervisor', 'employee'],
  withValidation(updateRequestSchema, patchHandler)
);
