"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"
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

  // Signature canvas
  const canvasRef = useRef<HTMLCanvasElement>(null)
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
          throw new Error("Failed to fetch request")
        }

        const data = await response.json()
        // Handle both { request: ... } and { ... } response structures
        setRequest(data.request || data)
      } catch (err) {
        setError("Error loading request details")
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

  const saveSignature = async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    try {
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob)
          else throw new Error("Failed to create blob")
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
        throw new Error(result.error || "Upload failed")
      }
    } catch (err) {
      console.error("Error saving signature:", err)
      setError("Failed to save signature")
    }
  }

  const handleApprove = async () => {
    if (!signatureFile) {
      setError("Please add your signature to approve")
      return
    }

    await updateRequest("approved")
  }

  const handleReject = async () => {
    if (comment.trim() === "") {
      setError("Please provide a reason for rejection")
      return
    }

    await updateRequest("rejected")
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
        throw new Error("Failed to update request")
      }

      // Redirect back to the list
      router.push("/supervisor/requests")
    } catch (err) {
      setError("Error updating request")
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading request details...</div>
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!request) {
    return <div className="flex justify-center p-8">Request not found</div>
  }

  const calculateDays = () => {
    const start = parse(request.startDate, "yyyy-MM-dd", new Date())
    const end = parse(request.endDate, "yyyy-MM-dd", new Date())
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Request</h1>
          <p className="text-gray-600">Request ID: {request.id}</p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      {/* Request Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Request Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Employee</label>
                <p className="text-sm text-gray-900">{request.employeeName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Group / Tier</label>
                <p className="text-sm text-gray-900">
                  {request.group} / {request.tier}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Period</label>
                <p className="text-sm text-gray-900">
                  {format(parse(request.startDate, "yyyy-MM-dd", new Date()), "MMM dd, yyyy")} -{" "}
                  {format(parse(request.endDate, "yyyy-MM-dd", new Date()), "MMM dd, yyyy")}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">
                  <StatusBadge status={request.status} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="text-sm text-gray-900">
                  {format(parse(request.createdAt, "yyyy-MM-dd HH:mm:ss", new Date()), "MMM dd, yyyy 'at' HH:mm")}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Updated</label>
                <p className="text-sm text-gray-900">
                  {format(parse(request.updatedAt, "yyyy-MM-dd HH:mm:ss", new Date()), "MMM dd, yyyy 'at' HH:mm")}
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
            <span>Calculation Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Base Rate</span>
              <span className="text-sm font-medium">฿{request.baseRate.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Number of Days</span>
              <span className="text-sm font-medium">{calculateDays()} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Zone Multiplier</span>
              <span className="text-sm font-medium">{request.zoneMultiplier}x</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-base font-medium text-gray-900">Total Amount</span>
              <span className="text-base font-bold text-green-600">฿{request.totalAmount.toLocaleString()}</span>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Calculation: ฿{request.baseRate.toLocaleString()} × {calculateDays()} days × {request.zoneMultiplier} = ฿
              {request.totalAmount.toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Supporting Documents</span>
          </CardTitle>
          <CardDescription>Documents uploaded with this request</CardDescription>
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
            <span>Supervisor Review</span>
          </CardTitle>
          <CardDescription>Review and provide feedback on this request</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Comments</label>
            <Textarea
              placeholder="Add your comments or feedback here..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>

          {signatureFile ? (
            <div className="border rounded-md p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">Your Signature</h4>
                <Button variant="outline" size="sm" onClick={() => setSignatureDialogOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Change
                </Button>
              </div>
              <img src={signatureFile.url || "/placeholder.svg"} alt="Signature" className="max-h-24 border rounded" />
            </div>
          ) : (
            <div className="border border-dashed rounded-md p-4 text-center">
              <PenTool className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-2">Signature required for approval</p>
              <Button variant="outline" onClick={() => setSignatureDialogOpen(true)}>
                Add Signature
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
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleReject} disabled={submitting || comment.trim() === ""}>
            <X className="h-4 w-4 mr-2" />
            Reject
          </Button>
          <Button variant="default" onClick={handleApprove} disabled={submitting || !signatureFile}>
            <Check className="h-4 w-4 mr-2" />
            Approve
          </Button>
        </CardFooter>
      </Card>

      {/* Signature Dialog */}
      <Dialog open={signatureDialogOpen} onOpenChange={setSignatureDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Your Signature</DialogTitle>
            <DialogDescription>Draw your signature below. This will be used to verify your approval.</DialogDescription>
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
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button type="button" variant="outline" onClick={clearCanvas}>
              Clear
            </Button>
            <Button type="button" onClick={saveSignature}>
              Save Signature
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
