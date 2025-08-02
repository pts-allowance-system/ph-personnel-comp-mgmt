import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { allowanceRequests, users } from "@/lib/db/schema";
import { withAuthorization, NextRequestWithAuth } from "@/lib/utils/authorization";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { eq, inArray, and, gte, lte, sql } from "drizzle-orm";
import { handleApiError, ApiError } from "@/lib/utils/error-handler";
import { z } from "zod";

const exportQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, { message: "Month must be in YYYY-MM format" }),
});

async function getHandler(request: NextRequestWithAuth) {
  try {
    const { searchParams } = new URL(request.url);
    const query = {
      month: searchParams.get("month") || format(new Date(), "yyyy-MM"),
    };

    const validationResult = exportQuerySchema.safeParse(query);
    if (!validationResult.success) {
      throw new ApiError(400, "Invalid 'month' parameter.", validationResult.error.issues);
    }

    const { month } = validationResult.data;
    const startDate = startOfMonth(new Date(month + "-01"));
    const endDate = endOfMonth(new Date(month + "-01"));

    // Get disbursement data for the month using Drizzle
    const disbursements = await db
      .select({
        id: allowanceRequests.id,
        employee_name: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
        department: users.department,
        national_id: users.nationalId,
        allowance_group: allowanceRequests.allowanceGroup,
        tier: allowanceRequests.tier,
        start_date: allowanceRequests.startDate,
        end_date: allowanceRequests.endDate,
        total_amount: allowanceRequests.totalAmount,
        status: allowanceRequests.status,
        reference_number: allowanceRequests.referenceNumber,
        disbursement_date: allowanceRequests.disbursementDate,
        created_at: allowanceRequests.createdAt,
        updated_at: allowanceRequests.updatedAt,
      })
      .from(allowanceRequests)
      .leftJoin(users, eq(allowanceRequests.employeeId, users.id))
      .where(
        and(
          inArray(allowanceRequests.status, ["hr-checked", "disbursed"]),
          gte(allowanceRequests.updatedAt, startDate),
          lte(allowanceRequests.updatedAt, endDate)
        )
      )
      .orderBy(sql`${allowanceRequests.updatedAt} DESC`);

    const headers = [
      "Request ID",
      "Employee Name",
      "National ID",
      "Department",
      "Group",
      "Tier",
      "Period Start",
      "Period End",
      "Amount",
      "Status",
      "Reference Number",
      "Disbursement Date",
      "Created Date",
      "Updated Date",
    ];

    const csvContent = [
      headers.join(","),
      ...disbursements.map((req) =>
        [
          req.id,
          `"${req.employee_name}"`,
          req.national_id,
          `"${req.department || ""}"`,
          req.allowance_group,
          req.tier,
          req.start_date,
          req.end_date,
          req.total_amount,
          req.status,
          req.reference_number || "",
          req.disbursement_date || "",
          req.created_at,
          req.updated_at,
        ].join(",")
      ),
    ].join("\n");

    // Note: True Excel (.xlsx) export requires a dedicated library like 'exceljs'.
    // This endpoint correctly serves a CSV file.
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="disbursement-summary-${month}.csv"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuthorization(['finance'], getHandler);
