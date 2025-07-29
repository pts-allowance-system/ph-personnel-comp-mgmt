import { type NextRequest, NextResponse } from "next/server"
import { RequestsDAL } from "@/lib/dal/requests"
import { verifyToken } from "@/lib/utils/auth-utils"
import type { FileUpload } from "@/lib/models"

export async function POST(request: NextRequest, { params }: any) {
  try {
    const { id } = params
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Handle single document
    if (body.document) {
      await RequestsDAL.addDocument(id, body.document as FileUpload)
    }

    // Handle multiple documents
    if (body.documents && Array.isArray(body.documents)) {
      for (const doc of body.documents) {
        await RequestsDAL.addDocument(id, doc as FileUpload)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Document(s) added successfully",
    })
  } catch (error) {
    console.error("Add document error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
