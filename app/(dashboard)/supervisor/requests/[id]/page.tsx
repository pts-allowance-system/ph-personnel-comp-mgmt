"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { StatusBadge } from "@/components/status-badge"
import { DocumentViewer } from "@/components/document-viewer"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DollarSign, FileText, User, Check, X, Edit, PenTool } from "lucide-react"
import { format, parse } from "date-fns"
import { th } from "date-fns/locale"
import { StorageService } from "@/lib/storage"
import type { AllowanceRequest, FileUpload } from "@/lib/types"

export default function SupervisorRequestDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user, token } = useAuthStore()
  const [request, setRequest] = useState<AllowanceRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [actionToConfirm, setActionToConfirm] = useState<"approve" | "reject" | null>(null)

  // Signature canvas
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const signatureImportRef = useRef<HTMLInputElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [lastX, setLastX] = useState(0)
  const [lastY, setLastY] = useState(0)
  const [signatureFile, setSignatureFile] = useState<FileUpload | null>(null)

  // Fetch request data
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
          throw new Error("ไม่สามารถดึงข้อมูลคำขอได้")
        }

        const data = await response.json()
        // Handle both { request: ... } and { ... } response structures
        setRequest(data.request || data)
      } catch (err) {
        setError("เกิดข้อผิดพลาดในการโหลดรายละเอียดคำขอ")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      fetchRequest()
    }
  }, [params.id, token])

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.lineJoin = "round"
        ctx.lineCap = "round"
        ctx.lineWidth = 2
        ctx.strokeStyle = "black"
      }
    }
  }, [signatureDialogOpen])

  // Canvas drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)

    let clientX, clientY
    if ("touches" in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    const canvas = canvasRef.current
    if (canvas) {
      const rect = canvas.getBoundingClientRect()
      setLastX(clientX - rect.left)
      setLastY(clientY - rect.top)
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    let clientX, clientY
    if ("touches" in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
      e.preventDefault() // Prevent scrolling on touch devices
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext("2d")
      const rect = canvas.getBoundingClientRect()
      const x = clientX - rect.left
      const y = clientY - rect.top

      if (ctx) {
        ctx.beginPath()
        ctx.moveTo(lastX, lastY)
        ctx.lineTo(x, y)
        ctx.stroke()
      }

      setLastX(x)
      setLastY(y)
    }
  }

  const endDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
  }

  const handleSignatureFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && user) {
      if (!file.type.startsWith("image/")) {
        setError("กรุณาเลือกไฟล์รูปภาพ")
        return
      }
      try {
        setSubmitting(true)
        const folder = `signatures/${user.id}`
        const uploadResult = await StorageService.uploadFile(file, folder)
        if (uploadResult.success && uploadResult.url) {
          const newSignatureFile: FileUpload = {
            id: uploadResult.path!, // Using path as a unique ID
            name: file.name,
            url: uploadResult.url,
            path: uploadResult.path!,
            size: file.size,
            type: file.type,
            uploadedAt: new Date().toISOString(),
          }
          setSignatureFile(newSignatureFile)
          setSignatureDialogOpen(false)
          setError("")
        } else {
          throw new Error(uploadResult.error || "ไม่สามารถอัปโหลดลายเซ็นได้")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "ไม่สามารถอัปโหลดลายเซ็นได้")
        console.error(err)
      } finally {
        setSubmitting(false)
      }
    }
  }

  const triggerSignatureImport = () => {
    signatureImportRef.current?.click()
  }

  const saveSignature = async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    try {
      setSubmitting(true)
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob)
          else reject(new Error("ไม่สามารถสร้าง blob ได้"))
        }, "image/png")
      })

      // Create file from blob
      const file = new File([blob], `signature-${Date.now()}.png`, { type: "image/png" })

      // Upload to Supabase
      const result = await StorageService.uploadFile(file, "signatures")

      if (result.success && result.url && result.path) {
        const signatureFile: FileUpload = {
          id: Date.now().toString(),
          name: file.name,
          url: result.url,
          path: result.path,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
        }

        setSignatureFile(signatureFile)
        setSignatureDialogOpen(false)
      } else {
        throw new Error(result.error || "การอัปโหลดล้มเหลว")
      }
    } catch (err) {
      console.error("เกิดข้อผิดพลาดในการบันทึกลายเซ็น:", err)
      setError("ไม่สามารถบันทึกลายเซ็นได้")
    } finally {
      setSubmitting(false)
    }
  }

  const handleApprove = () => {
    if (!signatureFile) {
      setError("จำเป็นต้องมีลายเซ็นเพื่ออนุมัติ")
      return
    }
    setActionToConfirm("approve")
    setIsConfirmOpen(true)
  }

  const handleReject = () => {
    if (comment.trim() === "") {
      setError("จำเป็นต้องระบุความคิดเห็นเพื่อปฏิเสธ")
      return
    }
    setActionToConfirm("reject")
    setIsConfirmOpen(true)
  }

  const handleConfirmAction = () => {
    if (actionToConfirm === "approve") {
      updateRequest("approved")
    } else if (actionToConfirm === "reject") {
      updateRequest("rejected")
    }
    setIsConfirmOpen(false)
    setActionToConfirm(null)
  }

  const updateRequest = async (newStatus: string) => {
    try {
      setSubmitting(true)

      // First, add the comment if provided
      if (comment.trim() !== "") {
        await fetch(`/api/requests/${params.id}/comments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: comment,
          }),
        })
      }

      // If we have a signature, add it as a document
      if (signatureFile && newStatus === "approved") {
        await fetch(`/api/requests/${params.id}/documents`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            document: signatureFile,
            documentType: "signature",
          }),
        })
      }

      // Update the request status
      const response = await fetch(`/api/requests/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      })

      if (!response.ok) {
        throw new Error("ไม่สามารถอัปเดตคำขอได้")
      }

      // Redirect back to the list
      router.push("/supervisor/requests")
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการอัปเดตคำขอ")
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">กำลังโหลดรายละเอียดคำขอ...</div>
  }

  if (error && !submitting) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!request) {
    return <div className="flex justify-center p-8">ไม่พบคำขอ</div>
  }

  const calculateDays = () => {
    const start = parse(request.startDate, "yyyy-MM-dd", new Date())
    const end = parse(request.endDate, "yyyy-MM-dd", new Date())
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  }

  const formatToThb = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ตรวจสอบคำขอ</h1>
          <p className="text-gray-600">รหัสคำขอ: {request.id}</p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      {/* Request Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>ข้อมูลคำขอ</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">พนักงาน</label>
                <p className="text-sm text-gray-900">{request.employeeName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">กลุ่ม / ระดับ</label>
                <p className="text-sm text-gray-900">
                  {request.group} / {request.tier}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">ช่วงเวลา</label>
                <p className="text-sm text-gray-900">
                  {format(parse(request.startDate, "yyyy-MM-dd", new Date()), "d MMM yyyy", { locale: th })} -{" "}
                  {format(parse(request.endDate, "yyyy-MM-dd", new Date()), "d MMM yyyy", { locale: th })}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">สถานะ</label>
                <div className="mt-1">
                  <StatusBadge status={request.status} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">สร้างเมื่อ</label>
                <p className="text-sm text-gray-900">
                  {format(parse(request.createdAt, "yyyy-MM-dd HH:mm:ss", new Date()), "d MMM yyyy 'เวลา' HH:mm", { locale: th })}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">อัปเดตล่าสุด</label>
                <p className="text-sm text-gray-900">
                  {format(parse(request.updatedAt, "yyyy-MM-dd HH:mm:ss", new Date()), "d MMM yyyy 'เวลา' HH:mm", { locale: th })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calculation Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>สรุปการคำนวณ</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">อัตราพื้นฐาน</span>
              <span className="text-sm font-medium">{formatToThb(request.baseRate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">จำนวนวัน</span>
              <span className="text-sm font-medium">{calculateDays()} วัน</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">ตัวคูณโซน</span>
              <span className="text-sm font-medium">{request.zoneMultiplier}x</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-base font-medium text-gray-900">ยอดรวม</span>
              <span className="text-base font-bold text-green-600">{formatToThb(request.totalAmount)}</span>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              การคำนวณ: {formatToThb(request.baseRate)} × {calculateDays()} วัน × {request.zoneMultiplier} ={" "}
              {formatToThb(request.totalAmount)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>เอกสารประกอบ</span>
          </CardTitle>
          <CardDescription>เอกสารที่อัปโหลดพร้อมกับคำขอนี้</CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentViewer documents={request.documents} />
        </CardContent>
      </Card>

      {/* Supervisor Review */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Edit className="h-5 w-5" />
            <span>การตรวจสอบโดยหัวหน้างาน</span>
          </CardTitle>
          <CardDescription>ตรวจสอบและให้ความคิดเห็นเกี่ยวกับคำขอนี้</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">ความคิดเห็น</label>
            <Textarea
              placeholder="เพิ่มความคิดเห็นหรือข้อเสนอแนะของคุณที่นี่..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>

          {signatureFile ? (
            <div className="border rounded-md p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">ลายเซ็นของคุณ</h4>
                <Button variant="outline" size="sm" onClick={() => setSignatureDialogOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  เปลี่ยน
                </Button>
              </div>
              <img src={signatureFile.url || "/placeholder.svg"} alt="Signature" className="max-h-24 border rounded" />
            </div>
          ) : (
            <div className="border border-dashed rounded-md p-4 text-center">
              <PenTool className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-2">จำเป็นต้องมีลายเซ็นเพื่ออนุมัติ</p>
              <Button variant="outline" onClick={() => setSignatureDialogOpen(true)}>
                เพิ่มลายเซ็น
              </Button>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
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
        title={`ยืนยัน${actionToConfirm === "approve" ? "การอนุมัติ" : "การปฏิเสธ"}`}
        description={`คุณแน่ใจหรือไม่ว่าต้องการ${actionToConfirm === "approve" ? "อนุมัติ" : "ปฏิเสธ"}คำขอนี้?`}
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