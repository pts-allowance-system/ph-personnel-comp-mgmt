"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { th } from "date-fns/locale"
import { DollarSign, FileText, User, Check, X, Edit, PenTool, Info, MessageSquare } from "lucide-react"

import { useAuthStore } from "@/lib/store/auth-store"
import { StorageService } from "@/lib/utils/storage"
import { calculateTotalDays } from "@/lib/utils/date-utils"
import { AllowanceRequest, FileUpload, Comment } from "@/lib/models"

import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { ProgressTracker } from "@/components/progress-tracker"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

const statusSteps = [
  { id: "draft", name: "ฉบับร่าง" },
  { id: "submitted", name: "ยื่นแล้ว" },
  { id: "pending", name: "รอดำเนินการ" },
  { id: "processing", name: "กำลังตรวจสอบ" },
  { id: "approved", name: "อนุมัติแล้ว" },
  { id: "rejected", name: "ปฏิเสธ" },
]

export default function SupervisorRequestDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user, token } = useAuthStore()
  const [request, setRequest] = useState<AllowanceRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [actionToConfirm, setActionToConfirm] = useState<"approved" | "rejected" | null>(null)

  // Signature State and Refs
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false)
  const [signatureFile, setSignatureFile] = useState<File | null>(null) // Use File type for uploads
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const signatureImportRef = useRef<HTMLInputElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  useEffect(() => {
    async function fetchRequest() {
      try {
        setLoading(true)
        const response = await fetch(`/api/requests/${params.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch request details.")
        }

        const data = await response.json()
        setRequest(data.request || data)
      } catch (err) {
        setError("An error occurred while loading the request details.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (token && params.id) {
      fetchRequest()
    }
  }, [params.id, token])

  useEffect(() => {
    const ctx = getCanvasContext()
    if (ctx) {
      ctx.lineJoin = "round"
      ctx.lineCap = "round"
      ctx.lineWidth = 2
      ctx.strokeStyle = "black"
    }
  }, [signatureDialogOpen])

  const getCanvasContext = () => {
    const canvas = canvasRef.current
    if (!canvas) return null
    return canvas.getContext("2d")
  }

  const formatToThb = (amount: number) => {
    return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(amount)
  }

  // --- Drawing Handlers ---
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const ctx = getCanvasContext()
    if (!ctx) return

    const pos = getMousePos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    setIsDrawing(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const ctx = getCanvasContext()
    if (!ctx) return

    const pos = getMousePos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }

  const endDrawing = () => {
    const ctx = getCanvasContext()
    if (ctx) {
      ctx.closePath()
    }
    setIsDrawing(false)
  }

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()

    if (e.nativeEvent instanceof MouseEvent) {
      return {
        x: e.nativeEvent.clientX - rect.left,
        y: e.nativeEvent.clientY - rect.top,
      }
    } else if (e.nativeEvent instanceof TouchEvent) {
      return {
        x: e.nativeEvent.touches[0].clientX - rect.left,
        y: e.nativeEvent.touches[0].clientY - rect.top,
      }
    }
    return { x: 0, y: 0 }
  }

  const clearCanvas = () => {
    const ctx = getCanvasContext()
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
  }

  const saveSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], "signature.png", { type: "image/png" })
        setSignatureFile(file)
        setSignatureDialogOpen(false)
      }
    }, "image/png")
  }

  const triggerSignatureImport = () => {
    signatureImportRef.current?.click()
  }

  const handleSignatureFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSignatureFile(file)
      setSignatureDialogOpen(false)
    }
  }

  const handleUpdateStatus = async (status: "approved" | "rejected") => {
    if (!request || !user || !token) return

    if (status === "rejected" && comment.trim() === "") {
      setError("ความคิดเห็นเป็นสิ่งจำเป็นสำหรับการปฏิเสธ")
      return
    }

    if (status === "approved" && !signatureFile) {
      setError("ลายเซ็นเป็นสิ่งจำเป็นสำหรับการอนุมัติ")
      setSignatureDialogOpen(true)
      return
    }

    setSubmitting(true)
    setError("")

    const formData = new FormData()
    formData.append("status", status)
    if (comment.trim() !== "") {
      formData.append("comment", comment)
    }
    if (signatureFile) {
      formData.append("signature", signatureFile)
    }
    formData.append("userId", user.id)

    try {
      const response = await fetch(`/api/requests/${request.id}/status`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update status")
      }

      const updatedRequest = await response.json()
      setRequest(updatedRequest)
      setComment("")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleApprove = () => {
    setActionToConfirm("approved")
    setIsConfirmOpen(true)
  }

  const handleReject = () => {
    if (comment.trim() === "") {
      setError("ความคิดเห็นเป็นสิ่งจำเป็นสำหรับการปฏิเสธ")
      return
    }
    setActionToConfirm("rejected")
    setIsConfirmOpen(true)
  }

  const handleConfirmAction = () => {
    if (actionToConfirm) {
      handleUpdateStatus(actionToConfirm)
    }
    setIsConfirmOpen(false)
    setActionToConfirm(null)
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading request...</div>
  }

  if (error && !request) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!request) {
    return <div className="flex justify-center p-8">Request not found.</div>
  }

  const totalDays = calculateTotalDays(request.startDate ?? "", request.endDate ?? "")

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="mb-6">
        <CardHeader>
          <ProgressTracker
            items={statusSteps}
            currentStepIndex={statusSteps.findIndex((s) => s.id === (request?.status ?? "")) || 0}
            request={request}
            isDetailsPage={true}
          />
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="h-5 w-5 mr-2" />
                ข้อมูลคำขอ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">ประเภทเบี้ยเลี้ยง</p>
                  <p>{request.allowanceGroup}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">กลุ่ม/ระดับ</p>
                  <p>{request.tier || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">วันที่เริ่มต้น</p>
                  <p>{request.startDate ? format(new Date(request.startDate), "d MMM yy", { locale: th }) : "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">วันที่สิ้นสุด</p>
                  <p>{request.endDate ? format(new Date(request.endDate), "d MMM yy", { locale: th }) : "N/A"}</p>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-gray-500">รายละเอียด</p>
                <p>{request.notes || "-"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                รายละเอียดการคำนวณ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>จำนวนวัน</span>
                <span>{totalDays}</span>
              </div>
              <div className="flex justify-between">
                <span>อัตราต่อวัน</span>
                <span>{formatToThb(request.monthlyRate || 0)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>รวมเป็นเงินทั้งสิ้น</span>
                <span>{formatToThb(totalDays * (request.monthlyRate || 0))}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                ประวัติความคิดเห็น
              </CardTitle>
            </CardHeader>
            <CardContent>
              {request.comments && request.comments.length > 0 ? (
                <ul className="space-y-4">
                  {request.comments.map((c: Comment, index: number) => (
                    <li key={c.id} className="border-b pb-2">
                      <p className="font-semibold">{c.user.name}</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(c.timestamp), "d MMM yy, HH:mm", { locale: th })}
                      </p>
                      <p>{c.content}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>ยังไม่มีความคิดเห็น</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                ข้อมูลพนักงาน
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                <strong>ชื่อ:</strong> {request.employeeName}
              </p>
              <p>
                <strong>แผนก:</strong> {request.department}
              </p>
            </CardContent>
          </Card>

          {request.documents && request.documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  เอกสารแนบ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {request.documents.map((doc: FileUpload, index: number) => (
                    <li key={index}>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {doc.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>การดำเนินการ</CardTitle>
          <CardDescription>เพิ่มความคิดเห็นและอนุมัติหรือปฏิเสธคำขอ</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Textarea
                placeholder="เพิ่มความคิดเห็น... (จำเป็นสำหรับการปฏิเสธ)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />
            </div>
            <div>
              {signatureFile ? (
                <div className="flex items-center space-x-2 p-2 border rounded-md">
                  <FileText className="h-5 w-5 text-green-600" />
                  <span className="text-sm">Signature Attached: {signatureFile.name}</span>
                  <Button variant="ghost" size="sm" onClick={() => setSignatureDialogOpen(true)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button variant="outline" onClick={() => setSignatureDialogOpen(true)}>
                  <PenTool className="h-4 w-4 mr-2" />
                  เพิ่มลายเซ็น
                </Button>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-4">
          <Button variant="outline" onClick={() => router.push("/supervisor/requests")} disabled={submitting}>
            ยกเลิก
          </Button>
          <Button variant="destructive" onClick={handleReject} disabled={submitting || comment.trim() === ""}>
            <X className="h-4 w-4 mr-2" />
            ปฏิเสธ
          </Button>
          <Button variant="default" onClick={handleApprove} disabled={submitting || !signatureFile}>
            <Check className="h-4 w-4 mr-2" />
            อนุมัติ
          </Button>
        </CardFooter>
      </Card>

      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={handleConfirmAction}
        title={`ยืนยัน${actionToConfirm === "approved" ? "การอนุมัติ" : "การปฏิเสธ"}`}
        description={`คุณแน่ใจหรือไม่ว่าต้องการ${actionToConfirm === "approved" ? "อนุมัติ" : "ปฏิเสธ"}คำขอนี้?`}
      />

      {/* Signature Dialog */}
      <Dialog open={signatureDialogOpen} onOpenChange={setSignatureDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>เพิ่มลายเซ็นของคุณ</DialogTitle>
            <DialogDescription>
              วาดลายเซ็นของคุณด้านล่างหรือนำเข้ารูปภาพ ลายเซ็นนี้จะใช้เพื่อยืนยันการอนุมัติของคุณ
            </DialogDescription>
          </DialogHeader>
          <div className="border rounded-md overflow-hidden bg-white">
            <canvas
              ref={canvasRef}
              width={400}
              height={200}
              className="w-full touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={endDrawing}
              onMouseOut={endDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={endDrawing}
            />
          </div>
          <input
            type="file"
            ref={signatureImportRef}
            onChange={handleSignatureFileChange}
            className="hidden"
            accept="image/png, image/jpeg, image/svg+xml"
          />
          <DialogFooter className="flex justify-between sm:justify-between w-full">
            <Button type="button" variant="outline" onClick={triggerSignatureImport} disabled={submitting}>
              นำเข้าไฟล์
            </Button>
            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={clearCanvas} disabled={submitting}>
                ล้าง
              </Button>
              <Button type="button" onClick={saveSignature} disabled={submitting}>
                {submitting ? "กำลังบันทึก..." : "บันทึกลายเซ็น"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}