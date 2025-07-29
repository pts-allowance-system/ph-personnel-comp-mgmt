import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { allowanceRequests, users } from "@/lib/db/schema"
import { verifyToken } from "@/lib/utils/auth-utils"
import { eq, inArray, sql } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "finance") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get disbursement summary using Drizzle ORM
    const disbursements = await db
      .select({
        requestId: allowanceRequests.id,
        employeeName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
        department: users.department,
        amount: allowanceRequests.totalAmount,
        status: allowanceRequests.status,
        dueDate: sql<string>`DATE_ADD(${allowanceRequests.updatedAt}, INTERVAL 30 DAY)`,
        createdAt: allowanceRequests.createdAt,
      })
      .from(allowanceRequests)
      .leftJoin(users, eq(allowanceRequests.employeeId, users.id))
      .where(inArray(allowanceRequests.status, ["hr-checked", "disbursed"]))
      .orderBy(sql`${allowanceRequests.updatedAt} DESC`);

    const formattedDisbursements = disbursements.map((d) => ({
      ...d,
      department: d.department || "Unknown",
      amount: d.amount ? Number.parseFloat(d.amount) : 0,
    }));

    return NextResponse.json({ disbursements: formattedDisbursements })
  } catch (error) {
    console.error("Finance dashboard disbursements error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
