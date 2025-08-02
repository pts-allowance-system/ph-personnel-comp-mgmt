import { NextResponse } from "next/server";
import { RequestsDAL } from "@/lib/dal/requests";
import { withAuthorization, NextRequestWithAuth } from "@/lib/utils/authorization";
import { handleApiError } from "@/lib/utils/error-handler";

async function getHandler(request: NextRequestWithAuth) {
  try {
    // Get all requests with additional details
    const requests = await RequestsDAL.findPendingHrReview();

    return NextResponse.json({ requests });
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuthorization(['hr', 'admin'], getHandler);
