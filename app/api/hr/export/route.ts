import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { allowanceRequests, users } from "@/lib/db/schema";
import { RequestStatusEnum } from "@/lib/schemas";
import { withAuthorization, NextRequestWithAuth } from "@/lib/utils/authorization";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { eq, inArray, and, gte, lte, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { handleApiError, ApiError } from "@/lib/utils/error-handler";
import { z } from "zod";

const exportQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, { message: "Month must be in YYYY-MM format" }),
  statuses: z.array(RequestStatusEnum).optional(),
});

async function getHandler(request: NextRequestWithAuth) {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("statuses");
    const query = {
      month: searchParams.get("month") || format(new Date(), "yyyy-MM"),
      statuses: statusParam ? statusParam.split(",").filter(s => s) : undefined,
    };

    const validationResult = exportQuerySchema.safeParse(query);
    if (!validationResult.success) {
      throw new ApiError(400, "Invalid query parameters.");
    }

    const { month, statuses } = validationResult.data;
    const startDate = startOfMonth(new Date(month + "-01"));
    const endDate = endOfMonth(new Date(month + "-01"));

    const approver = alias(users, "approver");

    const dbQuery = db
      .select({
        id: allowanceRequests.id,
        employee_name: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
        department: users.department,
        position: allowanceRequests.position,
        allowance_group: allowanceRequests.allowanceGroup,
        tier: allowanceRequests.tier,
        start_date: allowanceRequests.startDate,
        end_date: allowanceRequests.endDate,
        status: allowanceRequests.status,
        total_amount: allowanceRequests.totalAmount,
        supervisor_name: sql<string>`CONCAT(${approver.firstName}, ' ', ${approver.lastName})`,
        created_at: allowanceRequests.createdAt,
        updated_at: allowanceRequests.updatedAt,
      })
      .from(allowanceRequests)
      .leftJoin(users, eq(allowanceRequests.employeeId, users.id))
      .leftJoin(approver, eq(allowanceRequests.approvedBy, approver.id))
      .where(
        and(
          gte(allowanceRequests.createdAt, startDate),
          lte(allowanceRequests.createdAt, endDate),
          statuses && statuses.length > 0 ? inArray(allowanceRequests.status, statuses) : undefined
        )
      )
      .orderBy(sql`${allowanceRequests.createdAt} DESC`);

    const requests = await dbQuery;

    const headers = [
      "Request ID",
      "Employee Name",
      "Department",
      "Position",
      "Group",
      "Tier",
      "Start Date",
      "End Date",
      "Status",
      "Total Amount",
      "Supervisor",
      "Created Date",
      "Updated Date",
    ];

    const filterDescription = `Report for: ${format(
      new Date(month + "-01"),
      "MMMM yyyy"
    )}. Statuses: ${statuses && statuses.length > 0 ? statuses.join(", ") : "All"}.`;

    const csvContent = [
      `"${filterDescription}"`,
      "",
      headers.join(","),
      ...requests.map((req) =>
        [
          req.id,
          `"${req.employee_name}"`,
          `"${req.department || ""}"`,
          `"${req.position || ""}"`,
          req.allowance_group,
          req.tier,
          req.start_date,
          req.end_date,
          req.status,
          req.total_amount,
          `"${req.supervisor_name || ""}"`,
          req.created_at,
          req.updated_at,
        ].join(",")
      ),
    ].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="hr-report-${month}.csv"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuthorization(['hr'], getHandler);
