import { type NextRequest, NextResponse } from "next/server"
import { Database } from "@/lib/database"
import { verifyToken } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "finance") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get disbursement summary
    const query = `
      SELECT 
        r.id as requestId,
        u.name as employeeName,
        u.department,
        r.total_amount as amount,
        r.status,
        DATE_ADD(r.updated_at, INTERVAL 30 DAY) as dueDate,
        r.created_at
      FROM allowance_requests r
      JOIN users u ON r.employee_id = u.id
      WHERE r.status IN ('hr-checked', 'disbursed')
      ORDER BY r.updated_at DESC
    `

    const disbursements = await Database.query(query)

    const formattedDisbursements = disbursements.map((d: any) => ({
      requestId: d.requestId,
      employeeName: d.employeeName,
      department: d.department || "Unknown",
      amount: Number.parseFloat(d.amount),
      status: d.status,
      dueDate: d.dueDate,
    }))

    return NextResponse.json({ disbursements: formattedDisbursements })
  } catch (error) {
    console.error("Finance dashboard disbursements error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
