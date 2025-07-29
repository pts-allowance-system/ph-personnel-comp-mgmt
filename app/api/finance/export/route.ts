import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { allowanceRequests, users } from "@/lib/db/schema"
import { verifyToken } from "@/lib/utils/auth-utils"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { eq, inArray, and, gte, lte, sql } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "finance") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month") || format(new Date(), "yyyy-MM")
    const exportFormat = searchParams.get("format") || "csv"

    const startDate = startOfMonth(new Date(month + "-01"))
    const endDate = endOfMonth(new Date(month + "-01"))

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
    ]

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
        ].join(","),
      ),
    ].join("\n")

    const mimeType = exportFormat === "excel" ? "application/vnd.ms-excel" : "text/csv"
    const fileExtension = exportFormat === "excel" ? "xlsx" : "csv"

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="disbursement-summary-${month}.${fileExtension}"`,
      },
    })
  } catch (error) {
    console.error("Finance export error:", error)
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}
