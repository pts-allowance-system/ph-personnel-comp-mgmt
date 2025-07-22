import { type NextRequest, NextResponse } from "next/server"
import { RequestsDAL } from "@/lib/dal/requests"
import { verifyToken } from "@/lib/utils/auth-utils"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message } = await request.json()

    if (!message || message.trim() === "") {
      return NextResponse.json({ error: "Comment message is required" }, { status: 400 })
    }

    await RequestsDAL.addComment(id, user.userId, message)

    return NextResponse.json({
      success: true,
      message: "Comment added successfully",
    })
  } catch (error) {
    console.error("Add comment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
