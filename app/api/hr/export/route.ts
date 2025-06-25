import { type NextRequest, NextResponse } from "next/server"
import { Database } from "@/lib/database"
import { verifyToken } from "@/lib/auth-utils"
import { format, startOfMonth, endOfMonth } from "date-fns"

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

    // Get detailed request data for the month
    let query = `
      SELECT 
        r.id,
        r.employee_id,
        u.name as employee_name,
        u.department,
        u.position,
        r.group_name,
        r.tier,
        r.start_date,
        r.end_date,
        r.status,
        r.base_rate,
        r.zone_multiplier,
        r.total_amount,
        r.created_at,
        r.updated_at,
        supervisor.name as supervisor_name,
        hr_user.name as hr_reviewer
      FROM allowance_requests r
      JOIN users u ON r.employee_id = u.id
      LEFT JOIN request_comments rc_supervisor ON r.id = rc_supervisor.request_id 
        AND rc_supervisor.user_id IN (SELECT id FROM users WHERE role = 'supervisor')
      LEFT JOIN users supervisor ON rc_supervisor.user_id = supervisor.id
      LEFT JOIN request_comments rc_hr ON r.id = rc_hr.request_id 
        AND rc_hr.user_id IN (SELECT id FROM users WHERE role = 'hr')
      LEFT JOIN users hr_user ON rc_hr.user_id = hr_user.id
      WHERE r.created_at >= ? AND r.created_at <= ?
    `
    const params: (string | number)[] = [
      format(startDate, "yyyy-MM-dd HH:mm:ss"),
      format(endDate, "yyyy-MM-dd HH:mm:ss"),
    ]

    if (statuses && statuses.length > 0) {
      query += ` AND r.status IN (${statuses.map(() => "?").join(",")})`
      params.push(...statuses)
    }

    query += ` ORDER BY r.created_at DESC`

    const requests = await Database.query(query, params)

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
