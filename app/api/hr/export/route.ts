import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { allowanceRequests, users, requestComments } from "@/lib/db/schema"
import { verifyToken } from "@/lib/utils/auth-utils"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { eq, inArray, and, gte, lte, sql } from "drizzle-orm"
import { alias } from "drizzle-orm/mysql-core"

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "hr") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month") || format(new Date(), "yyyy-MM")
    const exportFormat = searchParams.get("format") || "csv"
    const statuses = searchParams.get("statuses")?.split(",").filter(s => s)

    const startDate = startOfMonth(new Date(month + "-01"))
    const endDate = endOfMonth(new Date(month + "-01"))

    const supervisor = alias(users, "supervisor")
    const hr_user = alias(users, "hr_user")
    const rc_supervisor = alias(requestComments, "rc_supervisor")
    const rc_hr = alias(requestComments, "rc_hr")

    let query = db
      .select({
        id: allowanceRequests.id,
        employee_name: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
        department: users.department,
        position: users.position,
        allowance_group: allowanceRequests.allowanceGroup,
        tier: allowanceRequests.tier,
        start_date: allowanceRequests.startDate,
        end_date: allowanceRequests.endDate,
        status: allowanceRequests.status,
        total_amount: allowanceRequests.totalAmount,
        supervisor_name: sql<string>`CONCAT(${supervisor.firstName}, ' ', ${supervisor.lastName})`,
        hr_reviewer: sql<string>`CONCAT(${hr_user.firstName}, ' ', ${hr_user.lastName})`,
        created_at: allowanceRequests.createdAt,
        updated_at: allowanceRequests.updatedAt,
      })
      .from(allowanceRequests)
      .leftJoin(users, eq(allowanceRequests.employeeId, users.id))
      .leftJoin(rc_supervisor, eq(allowanceRequests.id, rc_supervisor.requestId))
      .leftJoin(supervisor, eq(rc_supervisor.userId, supervisor.id))
      .leftJoin(rc_hr, eq(allowanceRequests.id, rc_hr.requestId))
      .leftJoin(hr_user, eq(rc_hr.userId, hr_user.id))
      .where(
        and(
          gte(allowanceRequests.createdAt, startDate),
          lte(allowanceRequests.createdAt, endDate),
          statuses && statuses.length > 0 ? inArray(allowanceRequests.status, statuses) : undefined
        )
      )
      .orderBy(sql`${allowanceRequests.createdAt} DESC`);

    const requests = await query;

    if (exportFormat === "csv") {
      // Generate CSV
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
        "HR Reviewer",
        "Created Date",
        "Updated Date",
      ]

      const filterDescription = `Report for: ${format(
        new Date(month + "-01"),
        "MMMM yyyy"
      )}. Statuses: ${statuses && statuses.length > 0 ? statuses.join(", ") : "All"}.`

      const csvContent = [
        `"${filterDescription}"`,
        "",
        headers.join(","),
        ...requests.map((req: any) =>
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
            `"${req.hr_reviewer || ""}"`,
            req.created_at,
            req.updated_at,
          ].join(","),
        ),
      ].join("\n")

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="hr-report-${month}.csv"`,
        },
      })
    } else {
      // For Excel format, you would typically use a library like xlsx
      // For now, return CSV with Excel MIME type
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
        "Base Rate",
        "Zone Multiplier",
        "Total Amount",
        "Supervisor",
        "HR Reviewer",
        "Created Date",
        "Updated Date",
      ]

      const filterDescription = `Report for: ${format(
        new Date(month + "-01"),
        "MMMM yyyy"
      )}. Statuses: ${statuses && statuses.length > 0 ? statuses.join(", ") : "All"}.`

      const csvContent = [
        `"${filterDescription}"`,
        "",
        headers.join(","),
        ...requests.map((req: any) =>
          [
            req.id,
            `"${req.employee_name}"`,
            `"${req.department || ""}"`,
            `"${req.position || ""}"`,
            req.group_name,
            req.tier,
            req.start_date,
            req.end_date,
            req.status,
            req.base_rate,
            req.zone_multiplier,
            req.total_amount,
            `"${req.supervisor_name || ""}"`,
            `"${req.hr_reviewer || ""}"`,
            req.created_at,
            req.updated_at,
          ].join(","),
        ),
      ].join("\n")

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "application/vnd.ms-excel",
          "Content-Disposition": `attachment; filename="hr-report-${month}.xlsx"`,
        },
      })
    }
  } catch (error) {
    console.error("HR export error:", error)
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}
