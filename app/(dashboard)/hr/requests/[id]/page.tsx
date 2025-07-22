"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store/auth-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { StatusBadge } from "@/components/status-badge"
import { DocumentViewer } from "@/components/document-viewer"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { DollarSign, FileText, User, Check, X, ClipboardCheck, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import { th } from "date-fns/locale"
import { formatToThb } from "@/lib/utils/currency-utils"
import type { AllowanceRequest } from "@/lib/models"

export default function HrRequestDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { token } = useAuthStore()
  const [request, setRequest] = useState<AllowanceRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [ruleChecks, setRuleChecks] = useState([
    { id: "rule1", name: "ใบอนุญาตที่ถูกต้อง", checked: false },
    { id: "rule2", name: "ตำแหน่งงานที่ถูกต้อง", checked: false },
    { id: "rule3", name: "อยู่ภายในวงเงินเบี้ยเลี้ยง", checked: false },
    { id: "rule4", name: "เอกสารประกอบครบถ้วน", checked: false },
  ])
  const [override, setOverride] = useState(false)

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
        setRequest(data)
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

  const handleRuleCheck = (id: string, checked: boolean) => {
    setRuleChecks(ruleChecks.map((rule) => (rule.id === id ? { ...rule, checked } : rule)))
  }

  const allRulesChecked = ruleChecks.every((rule) => rule.checked)

  const handleApprove = async () => {
    if (!allRulesChecked && !override) {
      setError("ต้องทำเครื่องหมายทุกกฎหรือเลือกการอนุมัติเป็นพิเศษ")
      return
    }

    await updateRequest("hr-checked")
  }

  const handleReject = async () => {
    if (comment.trim() === "") {
      setError("กรุณาระบุเหตุผลในการปฏิเสธ")
      return
    }

    await updateRequest("rejected")
  }

  const updateRequest = async (newStatus: string) => {
    try {
      setSubmitting(true)

      if (comment.trim() !== "") {
        await fetch(`/api/requests/${params.id}/comments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: comment }),
        })
      }

      const response = await fetch(`/api/requests/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          hrOverride: override,
          ruleCheckResults: ruleChecks,
        }),
      })

      if (!response.ok) {
        throw new Error("ไม่สามารถอัปเดตคำขอได้")
      }

      router.push("/hr/requests")
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

  if (error) {
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
    if (!request?.startDate || !request?.endDate) return 0
    const start = new Date(request.startDate)
    const end = new Date(request.endDate)
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ตรวจสอบโดยฝ่ายบุคคล</h1>
          <p className="text-gray-600">รหัสคำขอ: {request.id}</p>
        </div>
        <StatusBadge status={request.status} />
      </div>

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
                <p className="font-mono text-sm text-gray-900">{request.employeeName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">กลุ่ม / ระดับ</label>
                <p className="text-sm text-gray-900">
                  {request.allowanceGroup} / {request.tier}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">ช่วงเวลา</label>
                <p className="text-sm text-gray-900">
                  {request.startDate ? format(new Date(request.startDate), "d MMM yyyy", { locale: th }) : "N/A"} -{" "}
                  {request.endDate ? format(new Date(request.endDate), "d MMM yyyy", { locale: th }) : "N/A"}
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
                  {request.createdAt ? format(new Date(request.createdAt), "d MMM yyyy 'เวลา' HH:mm", { locale: th }) : "N/A"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">อัปเดตล่าสุด</label>
                <p className="text-sm text-gray-900">
                  {request.updatedAt ? format(new Date(request.updatedAt), "d MMM yyyy 'เวลา' HH:mm", { locale: th }) : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
              <span className="text-sm font-medium">{formatToThb(request.monthlyRate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">จำนวนวัน</span>
              <span className="text-sm font-medium">{calculateDays()} วัน</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-base font-medium text-gray-900">จำนวนเงินรวม</span>
              <span className="text-base font-bold text-green-600">{formatToThb(request.totalAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>เอกสารประกอบ</span>
          </CardTitle>
          <CardDescription>เอกสารที่อัปโหลดมาพร้อมกับคำขอนี้</CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentViewer documents={request.documents} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ClipboardCheck className="h-5 w-5" />
            <span>การตรวจสอบกฎ</span>
          </CardTitle>
          <CardDescription>ตรวจสอบว่าคำขอนี้เป็นไปตามกฎคุณสมบัติทั้งหมด</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {ruleChecks.map((rule) => (
              <div key={rule.id} className="flex items-start space-x-2">
                <Checkbox
                  id={rule.id}
                  checked={rule.checked}
                  onCheckedChange={(checked) => handleRuleCheck(rule.id, checked === true)}
                />
                <label
                  htmlFor={rule.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {rule.name}
                </label>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <div className="flex items-start space-x-2">
              <Checkbox id="override" checked={override} onCheckedChange={(checked) => setOverride(checked === true)} />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="override"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
                >
                  <AlertTriangle className="h-4 w-4 mr-1 text-amber-500" />
                  อนุมัติเป็นพิเศษ (Override)
                </label>
                <p className="text-sm text-muted-foreground">
                  ใช้ตัวเลือกนี้เฉพาะในกรณีพิเศษที่มีเหตุผลอันควร
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-4">
            <label className="text-sm font-medium text-gray-700">ความคิดเห็น</label>
            <Textarea
              placeholder="เพิ่มความคิดเห็นหรือข้อเสนอแนะของคุณที่นี่..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-end space-x-4">
          <Button variant="outline" onClick={() => router.push("/hr/requests")} disabled={submitting}>
            ยกเลิก
          </Button>
          <Button variant="destructive" onClick={handleReject} disabled={submitting || comment.trim() === ""}>
            <X className="h-4 w-4 mr-2" />
            ปฏิเสธ
          </Button>
          <Button variant="default" onClick={handleApprove} disabled={submitting || (!allRulesChecked && !override)}>
            <Check className="h-4 w-4 mr-2" />
            ทำเครื่องหมายว่าตรวจสอบแล้ว
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
