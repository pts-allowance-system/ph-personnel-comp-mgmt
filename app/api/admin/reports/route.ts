import { NextResponse } from "next/server";
import { withAuthorization, NextRequestWithAuth } from "@/lib/utils/authorization";
import { ReportsDAL } from "@/lib/dal/reports";
import { handleApiError } from "@/lib/utils/error-handler";
import { z } from "zod";

const reportQuerySchema = z.object({
  startDate: z.string().datetime({ message: "Start date must be a valid ISO 8601 date string" }),
  endDate: z.string().datetime({ message: "End date must be a valid ISO 8601 date string" }),
});

async function getHandler(request: NextRequestWithAuth) {
  try {
    const { searchParams } = new URL(request.url);
    const query = {
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
    };

    const validationResult = reportQuerySchema.safeParse(query);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", issues: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { startDate, endDate } = validationResult.data;

    const reportData = await ReportsDAL.getAllowanceSummary(
      new Date(startDate),
      new Date(endDate)
    );

    return NextResponse.json({ reportData });
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuthorization(['admin'], getHandler);
