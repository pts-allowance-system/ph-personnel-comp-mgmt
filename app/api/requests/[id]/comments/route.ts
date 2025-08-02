import { NextResponse } from "next/server";
import { z } from "zod";
import { RequestsDAL } from "@/lib/dal/requests";
import { withAuthorization, NextRequestWithAuth } from "@/lib/utils/authorization";
import { RouteContext } from "@/lib/utils/validation";
import { handleApiError, ApiError } from "@/lib/utils/error-handler";
import { canViewRequest } from "@/lib/authz";
import { UsersDAL } from "@/lib/dal/users";
import cache from "@/lib/utils/cache";

// Zod schema for comment creation
const createCommentSchema = z.object({
  message: z.string()
    .min(1, "Comment message is required")
    .max(1000, "Comment message is too long (max 1000 characters)")
    .trim(),
});

async function postHandler(
  request: NextRequestWithAuth, 
  { params }: RouteContext<{ id: string }>
) {
  try {
    const { id } = params;
    const user = request.user;

    // First, check if the request exists and if the user is allowed to view it.
    const requestData = await RequestsDAL.findById(id);
    if (!requestData) {
      throw new ApiError(404, "Request not found");
    }

    const fullUser = await UsersDAL.findById(request.user.id);
    if (!fullUser) {
      throw new ApiError(401, "Unauthorized: User not found");
    }

    if (!canViewRequest(fullUser, requestData)) {
      throw new ApiError(403, "Forbidden: You do not have permission to view this request");
    }

    // Parse and validate request data
    const requestBody = await request.json();
    const validation = createCommentSchema.safeParse(requestBody);

    if (!validation.success) {
      throw new ApiError(400, "Validation failed");
    }

    const { message } = validation.data;

    // Add comment to the request
    await RequestsDAL.addComment(id, fullUser.id, message);

    // Invalidate the cache for this specific request
    cache.invalidateRequestCache(id);

    return NextResponse.json({
      success: true,
      message: "Comment added successfully",
    });

  } catch (error) {
    return handleApiError(error);
  }
}

export const POST = withAuthorization([], postHandler);
