import { type NextRequest, NextResponse } from "next/server"
import { Database } from "@/lib/database"
import { verifyToken } from "@/lib/auth-utils"
import { format, startOfMonth, endOfMonth } from "date-fns"

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

    // Get disbursement data for the month
    const query = `
      SELECT 
        r.id,
        u.name as employee_name,
        u.department,
        u.national_id,
        r.group_name,
        r.tier,
        r.start_date,
        r.end_date,
        r.total_amount,
        r.status,
        r.reference_number,
        r.disbursement_date,
        r.created_at,
        r.updated_at
      FROM allowance_requests r
      JOIN users u ON r.employee_id = u.id
      WHERE r.status IN ('hr-checked', 'disbursed')
        AND (r.updated_at >= ? AND r.updated_at <= ?)
      ORDER BY r.updated_at DESC
    `

    const disbursements = await Database.query(query, [
      format(startDate, "yyyy-MM-dd HH:mm:ss"),
      format(endDate, "yyyy-MM-dd HH:mm:ss"),
    ])

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
      ...disbursements.map((req: any) =>
        [
          req.id,
          `"${req.employee_name}"`,
          req.national_id,
          `"${req.department || ""}"`,
          req.group_name,
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
