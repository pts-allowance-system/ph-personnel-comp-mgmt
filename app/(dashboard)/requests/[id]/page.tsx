"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useDataStore } from "@/lib/data-store"
import { useAuthStore } from "@/lib/auth-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProgressTracker } from "@/components/progress-tracker"
import { format } from "date-fns"
import { th } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import type { AllowanceRequest, Comment } from "@/lib/types"
import { formatToThb } from "@/lib/currency-utils"
import { calculateTotalDays } from "@/lib/date-utils"
import { Separator } from "@/components/ui/separator"
import { FileText, MessageSquare, User, Calendar, Info, Edit, Check, XCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const statusSteps = [
  { id: "draft", name: "ฉบับร่าง" },
  { id: "submitted", name: "ยื่นแล้ว" },
  { id: "processing", name: "กำลังตรวจสอบ" },
  { id: "approved", name: "อนุมัติแล้ว" },
  { id: "rejected", name: "ปฏิเสธ" },
]

// Maps status to a Badge variant and className for styling
const getStatusAppearance = (status: string): { variant: "default" | "destructive" | "secondary" | "outline", className: string, name: string } => {
  const step = statusSteps.find(s => s.id === status) || { name: 'ไม่ทราบสถานะ' };
  switch (status) {
    case "approved":
      return { variant: "default", className: "bg-green-100 text-green-800 border-green-200", name: step.name }
    case "rejected":
      return { variant: "destructive", className: "", name: step.name }
    case "processing":
      return { variant: "default", className: "bg-yellow-100 text-yellow-800 border-yellow-200", name: step.name }
    case "draft":
        return { variant: "secondary", className: "", name: step.name }
    default:
      return { variant: "default", className: "", name: step.name }
  }
}

// Mappers for new form data
const employeeTypeMap: { [key: string]: string } = {
  civil_servant: "ข้าราชการ",
  gov_employee: "พนักงานราชการ",
  moph_employee: "พนักงานกระทรวงสาธารณสุข",
  temp_employee: "ลูกจ้างชั่วคราว",
}

const requestTypeMap: { [key: string]: string } = {
  new: "กรณีบรรจุใหม่หรือตรวจสอบสิทธิครั้งแรก",
  edit_no_rate_change: "กรณีแก้ไขข้อมูลโดยไม่เปลี่ยนอัตราเงิน พ.ต.ส.",
  edit_rate_change: "กรณีแก้ไขข้อมูลสิทธิโดยเปลี่ยนอัตราเงิน พ.ต.ส.",
}

const standardDutiesMap: { [key: string]: string } = {
    operations: "ด้านปฏิบัติการ",
    planning: "ด้านการวางแผน",
    coordination: "ด้านการประสานงาน",
    service: "ด้านการบริการ",
}

export default function RequestDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const { token, user } = useAuthStore()
  const { requests, fetchRequestById, addComment, loading, error } = useDataStore()
  const [request, setRequest] = useState<AllowanceRequest | null>(null)
  const [newComment, setNewComment] = useState("")

  useEffect(() => {
    const requestId = Array.isArray(id) ? id[0] : id
    if (token && requestId) {
      const existingRequest = requests.find((r) => r.id === requestId)
      if (existingRequest) {
        setRequest(existingRequest)
      } else {
        fetchRequestById(requestId, token).then(fetchedRequest => {
          if(fetchedRequest) setRequest(fetchedRequest)
        })
      }
    }
  }, [id, token, requests, fetchRequestById])

  useEffect(() => {
    const requestId = Array.isArray(id) ? id[0] : id
    const updatedRequest = requests.find((r) => r.id === requestId)
    if (updatedRequest) {
      setRequest(updatedRequest)
    }
  }, [requests, id])

  const handleAddComment = async () => {
    const requestId = Array.isArray(id) ? id[0] : id
    if (!newComment.trim() || !user || !requestId) return
    
    await addComment(requestId, { content: newComment.trim() }, token!)
    
    // Refetch to get the latest comments
    fetchRequestById(requestId, token!).then(fetchedRequest => {
      if(fetchedRequest) setRequest(fetchedRequest)
    })
    setNewComment("")
  }

  if (loading && !request) return <div className="p-6">กำลังโหลดข้อมูลคำขอ...</div>
  if (error) return (
    <Alert variant="destructive" className="m-6">
      <XCircle className="h-4 w-4" />
      <AlertTitle>เกิดข้อผิดพลาด</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  )
  if (!request) return <div className="p-6">ไม่พบข้อมูลคำขอ</div>

  const currentStatusIndex = statusSteps.findIndex((step) => step.id === request.status)
  const statusAppearance = getStatusAppearance(request.status)
  const currentStepIndex = statusSteps.findIndex(s => s.id === request.status)
  const totalDays = calculateTotalDays(request.startDate || "", request.endDate || "")

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <div>
              <CardTitle className="text-xl md:text-2xl">รายละเอียดคำขอรับเงิน พ.ต.ส. #{request.id.substring(0, 8)}</CardTitle>
              <CardDescription>
                ยื่นโดย {request.employeeName} เมื่อ {format(new Date(request.createdAt), "d MMMM yyyy", { locale: th })}
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
                <Badge variant={statusAppearance.variant} className={`${statusAppearance.className} text-sm`}>
                    {statusAppearance.name}
                </Badge>
                {request.status === 'draft' || request.status === 'rejected' && (
                    <Button size="sm" variant="outline" onClick={() => router.push(`/requests/${request.id}/edit`)}>
                        <Edit className="mr-2 h-4 w-4" /> แก้ไข
                    </Button>
                )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">สถานะการดำเนินการ</h3>
            <ProgressTracker items={statusSteps} currentStepIndex={currentStepIndex} />
          </section>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center"><Info className="mr-2 h-5 w-5" />ข้อมูลคำขอ</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6">
                <div>
                    <h4 className="font-semibold text-gray-700">ประเภทบุคลากร</h4>
                    <p>{employeeTypeMap[request.employeeType] || 'N/A'}</p>
                </div>
                <div>
                    <h4 className="font-semibold text-gray-700">ประเภทคำขอ</h4>
                    <p>{requestTypeMap[request.requestType] || 'N/A'}</p>
                </div>
                <div>
                    <h4 className="font-semibold text-gray-700">ระยะเวลาที่ขอ</h4>
                    <p>{totalDays > 0 ? `${totalDays} วัน` : "N/A"}</p>
                </div>
                <div>
                    <h4 className="font-semibold text-gray-700">วันที่เริ่มมีผล</h4>
                    <p>{format(new Date(request.effectiveDate), "d MMM yyyy", { locale: th })}</p>
                </div>
                <div>
                    <h4 className="font-semibold text-gray-700">ตำแหน่ง</h4>
                    <p>{request.position}</p>
                </div>
                <div>
                    <h4 className="font-semibold text-gray-700">หน่วยงาน</h4>
                    <p>{request.department}</p>
                    <span className="text-gray-600">วันที่มีผล</span>
                    <span className="font-medium">{format(new Date(request.effectiveDate), "d MMMM yyyy", { locale: th })}</span>
                </div>
                <div className="md:col-span-2 pt-2">
                    <h4 className="font-semibold mb-2 text-gray-700">ภาระหน้าที่หลัก</h4>
                    <p className="p-3 bg-gray-50 rounded-md border">{request.mainDuties}</p>
                </div>
                <div className="md:col-span-2">
                    <h4 className="font-semibold mb-2 text-gray-700">งานที่ได้รับมอบหมายตามมาตรฐาน</h4>
                    <ul className="list-inside list-none space-y-1">
                        {Object.entries(request.standardDuties).map(([key, value]) => value && (
                            <li key={key} className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />{standardDutiesMap[key]}</li>
                        ))}
                    </ul>
                </div>
                 {request.assignedTask && (
                    <div className="md:col-span-2">
                        <h4 className="font-semibold mb-2 text-gray-700">งานอื่นๆ ที่ได้รับมอบหมาย</h4>
                        <p className="p-3 bg-gray-50 rounded-md border">{request.assignedTask}</p>
                    </div>
                )}
                {request.notes && (
                    <div className="md:col-span-2">
                        <h4 className="font-semibold mb-2 text-gray-700">หมายเหตุ</h4>
                        <p className="p-3 bg-gray-50 rounded-md border">{request.notes}</p>
                    </div>
                )}
            </div>
        </CardContent>
      </Card>

      {request.documents && request.documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><FileText className="h-5 w-5 mr-2" />เอกสารแนบ</CardTitle>
            <CardDescription>เอกสารที่แนบมาพร้อมกับคำขอ</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {request.documents.map((doc, index) => (
                <li key={index}>
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {doc.name}
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><MessageSquare className="h-5 w-5 mr-2" />ประวัติการดำเนินการและอนุมัติ</CardTitle>
          <CardDescription>ประวัติการสื่อสารและการดำเนินการเกี่ยวกับคำขอนี้</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {request.comments && request.comments.length > 0 ? (
              request.comments.map((comment) => (
                <div key={comment.id} className="flex items-start space-x-3">
                  <User className="h-5 w-5 text-gray-500 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{comment.author}</span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(comment.timestamp), "d MMM yyyy, HH:mm", { locale: th })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 bg-gray-100 p-2 rounded-md mt-1">{comment.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">ยังไม่มีความคิดเห็น</p>
            )}
          </div>
          <Separator className="my-4" />
          <div className="space-y-2">
            <h4 className="font-medium">เพิ่มความคิดเห็น</h4>
            <Textarea 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="แสดงความคิดเห็นของคุณที่นี่..."
            />
            <Button onClick={handleAddComment} disabled={!newComment.trim() || loading}>
              ส่งความคิดเห็น
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
