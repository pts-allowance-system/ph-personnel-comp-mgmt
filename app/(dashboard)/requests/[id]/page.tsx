"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useDataStore } from "@/lib/store/data-store"
import { useAuthStore } from "@/lib/store/auth-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProgressTracker } from "@/components/progress-tracker"
import { format } from "date-fns"
import { th } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import type { AllowanceRequest, Comment, FileUpload, Rate } from "@/lib/models"
import { formatToThb } from "@/lib/utils/currency-utils"
import { calculateTotalDays } from "@/lib/utils/date-utils"
import { Separator } from "@/components/ui/separator"
import { FileText, MessageSquare, User, Calendar, Info, Edit, Check, XCircle, Save } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RequestForm } from "@/components/requests/request-form"

const statusSteps = [
  { id: "draft", name: "ฉบับร่าง" },
  { id: "submitted", name: "ยื่นแล้ว" },
  { id: "pending", name: "รอดำเนินการ" },
  { id: "processing", name: "กำลังตรวจสอบ" },
  { id: "approved", name: "อนุมัติแล้ว" },
  { id: "rejected", name: "ปฏิเสธ" },
]

const getStatusAppearance = (status: string): { variant: "default" | "destructive" | "secondary" | "outline", className: string, name: string } => {
  const step = statusSteps.find(s => s.id === status) || { name: 'ไม่ทราบสถานะ' };
  switch (status) {
    case "approved":
      return { variant: "default", className: "bg-green-100 text-green-800 border-green-200", name: step.name }
    case "rejected":
      return { variant: "destructive", className: "", name: step.name }
    case "pending":
    case "processing":
      return { variant: "default", className: "bg-yellow-100 text-yellow-800 border-yellow-200", name: step.name }
    case "draft":
      return { variant: "secondary", className: "", name: step.name }
    default:
      return { variant: "default", className: "", name: step.name }
  }
}

export default function RequestDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const { token, user } = useAuthStore()
  const currentRequest = useDataStore(state => state.currentRequest)
  const loading = useDataStore(state => state.loading)
  const error = useDataStore(state => state.error)
  const {
    fetchRequestById,
    clearCurrentRequest,
    addComment,
    updateRequest,
  } = useDataStore(state => ({
    fetchRequestById: state.fetchRequestById,
    clearCurrentRequest: state.clearCurrentRequest,
    addComment: state.addComment,
    updateRequest: state.updateRequest,
  }))

  const [request, setRequest] = useState<AllowanceRequest | null>(null)
  const [newComment, setNewComment] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState("")
  const [allowanceRates, setAllowanceRates] = useState<Pick<Rate, "allowanceGroup" | "tier" | "monthlyRate">[]>([]);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const requestId = Array.isArray(id) ? id[0] : id

  useEffect(() => {
    if (requestId) {
      console.log(`[RequestDetailsPage] Fetching request ${requestId}...`);
      fetchRequestById(requestId);
    }

    return () => {
      console.log('[RequestDetailsPage] Cleanup: clearing current request.');
      clearCurrentRequest();
    };
  }, [requestId, fetchRequestById, clearCurrentRequest]);

  useEffect(() => {
    if (currentRequest && currentRequest.id === requestId) {
      setRequest(currentRequest);
    } else {
      setRequest(null);
    }
  }, [currentRequest, requestId]);

  useEffect(() => {
    const fetchAllowanceRates = async () => {
      try {
        const response = await fetch('/api/rates');
        if (!response.ok) {
          throw new Error('Failed to fetch allowance rates');
        }
        const data = await response.json();
        const mappedRates = data.map((rate: any) => ({
          allowanceGroup: rate.group,
          tier: rate.tier,
          monthlyRate: rate.base_rate,
        }));
        setAllowanceRates(mappedRates);
      } catch (error) {
        console.error("Error fetching allowance rates:", error);
      }
    };

    fetchAllowanceRates();
  }, []);

    const handleAddComment = async () => {
    if (!newComment.trim() || !requestId) return;
    await addComment(requestId, { message: newComment });
    setNewComment("");
    // Update comments in current request instead of full refetch
    if (request) {
      const updatedRequest = { ...request, comments: [...(request.comments || []), { id: Date.now().toString(), requestId: request.id, author: { id: user?.id || 'unknown', name: `${user?.firstName} ${user?.lastName}` }, message: newComment, timestamp: new Date().toISOString() }] } as AllowanceRequest;
      setRequest(updatedRequest);
    }
  };

  const handleUpdateSubmit = async (values: any, isDraft: boolean) => {
    if (!request) return;

    setIsSubmitting(true);
    setFormError("");

    const updatedRequestData: Partial<AllowanceRequest> = {
      ...values,
      status: isDraft ? 'draft' : values.status,
    };

    try {
      const success = await updateRequest(request.id, updatedRequestData);

      if (success) {
        setIsEditing(false);
        // Add a comment to log the status change if necessary
                if (updatedRequestData.status && updatedRequestData.status !== request?.status && requestId) {
          await addComment(requestId, { message: `Request status changed to ${updatedRequestData.status}` });
        }

        // Update local state instead of refetching
        if (request) {
          const updatedRequest = { ...request, ...updatedRequestData, status: updatedRequestData.status || request.status } as AllowanceRequest;
          setRequest(updatedRequest);
        }
      } else {
        setFormError("Failed to update the request.");
      }
    } catch (err) {
      setFormError((err as Error).message || "เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && !request) return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">กำลังโหลดข้อมูลคำขอ...</p>
      </div>
    </div>
  )

  if (error && !request) {
    // Check if this is a connection error
    const isConnectionError = error.includes('ERR_CONNECTION_REFUSED')
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Alert variant="destructive">
          <AlertTitle>{isConnectionError ? 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้' : 'เกิดข้อผิดพลาด'}</AlertTitle>
          <AlertDescription>
            {isConnectionError
              ? 'เซิร์ฟเวอร์ไม่สามารถเข้าถึงได้ โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของคุณ'
              : error}
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  // Only fetch if not already fetching
                  if (!loading && requestId) {
                    fetchRequestById(requestId).then(setRequest);
                  }
                }}
              >
                ลองใหม่
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!request) {
    // Check if we have a valid requestId
    if (!requestId) {
      return (
        <div className="flex items-center justify-center min-h-[200px]">
          <Alert>
            <AlertTitle>ขออภัย</AlertTitle>
            <AlertDescription>
              ไม่สามารถโหลดข้อมูลคำขอได้ เนื่องจากไม่พบ ID ที่ถูกต้อง
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => router.push('/requests')}
                >
                  กลับไปที่รายการคำขอ
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )
    }

    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Alert>
          <AlertTitle>ไม่พบคำขอ</AlertTitle>
          <AlertDescription>
            ไม่พบคำขอที่มี ID: {requestId}
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => router.push('/requests')}
              >
                กลับไปที่รายการคำขอ
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const requestStatus = request.status?.toLowerCase() || "";
  const currentStatusIndex = statusSteps.findIndex((step) => step.id === requestStatus)
  const statusAppearance = getStatusAppearance(requestStatus)

  const canEdit = request.status === 'draft' || (user?.role === 'admin' && request.status !== 'approved');

  const ReadOnlyView = () => {
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

    return (
      <div className="space-y-6">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center"><Info className="h-5 w-5 mr-2" />ข้อมูลทั่วไป</CardTitle>
                <CardDescription>ข้อมูลสรุปของคำขอ</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-1 text-gray-700">ผู้ยื่นคำขอ</h4>
              <p>{request!.employeeName}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1 text-gray-700">ประเภทพนักงาน</h4>
              <p>{employeeTypeMap[request!.employeeType] || request!.employeeType}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1 text-gray-700">ประเภทคำขอ</h4>
              <p>{requestTypeMap[request!.requestType] || request!.requestType}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1 text-gray-700">ตำแหน่ง</h4>
              <p>{request!.position}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1 text-gray-700">หน่วยงาน</h4>
              <p>{request!.department}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1 text-gray-700">อัตรา พ.ต.ส.</h4>
              <p>{formatToThb(request!.monthlyRate)} บาท/เดือน</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1 text-gray-700">วันที่มีผล</h4>
              <p>{request!.effectiveDate ? format(new Date(request!.effectiveDate), "d MMMM yyyy", { locale: th }) : "-"}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1 text-gray-700">วันที่ยื่นคำขอ</h4>
              <p>{request!.createdAt ? format(new Date(request!.createdAt), "d MMMM yyyy", { locale: th }) : "-"}</p>
            </div>

          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center"><User className="h-5 w-5 mr-2" />หน้าที่ความรับผิดชอบ</CardTitle>
            <CardDescription>รายละเอียดหน้าที่และภาระงานที่เกี่ยวข้อง</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="md:col-span-2">
                <h4 className="font-semibold mb-2 text-gray-700">หน้าที่หลักที่รับผิดชอบ</h4>
                <p className="p-3 bg-gray-50 rounded-md border">{request!.mainDuties}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-gray-700">ภาระงานมาตรฐาน</h4>
                <ul className="space-y-1 list-inside">
                  {Object.entries(request!.standardDuties).filter(([_, value]) => value).map(([key]) => (
                    <li key={key} className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />{standardDutiesMap[key]}</li>
                  ))}
                </ul>
              </div>
              {request!.assignedTask && (
                <div className="md:col-span-2">
                  <h4 className="font-semibold mb-2 text-gray-700">งานอื่นๆ ที่ได้รับมอบหมาย</h4>
                  <p className="p-3 bg-gray-50 rounded-md border">{request!.assignedTask}</p>
                </div>
              )}
              {request!.notes && (
                <div className="md:col-span-2">
                  <h4 className="font-semibold mb-2 text-gray-700">หมายเหตุ</h4>
                  <p className="p-3 bg-gray-50 rounded-md border">{request!.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {request!.documents && request!.documents.length > 0 && (
          <Card className="bg-gray-50 border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center"><FileText className="h-5 w-5 mr-2" />เอกสารแนบ</CardTitle>
              <CardDescription>เอกสารที่แนบมาพร้อมกับคำขอ</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {request!.documents.map((doc, index) => (
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
      </div>
    )
  };

  return (
    <div className="space-y-6">
      {isEditing ? (
        <RequestForm
          initialData={request!}
          onSubmit={handleUpdateSubmit}
          onUpdateProfile={async () => { }} // No-op, profile updates not handled here
          isSubmitting={isSubmitting}
          allowanceRates={allowanceRates}
          isEditingInfo={isEditingInfo}
          setIsEditingInfo={setIsEditingInfo}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>รายละเอียดคำขอ พ.ต.ส. #{request!.id.substring(0, 8)}</CardTitle>
                  <CardDescription>สถานะปัจจุบัน: <Badge variant={statusAppearance.variant} className={statusAppearance.className}>{statusAppearance.name}</Badge></CardDescription>
                </div>
                {canEdit && (
                  <Button variant="outline" size="icon" onClick={() => setIsEditing(!isEditing)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ProgressTracker items={statusSteps} currentStepIndex={currentStatusIndex} request={request!} />
            </CardContent>
          </Card>

          <ReadOnlyView />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><MessageSquare className="h-5 w-5 mr-2" />ประวัติการดำเนินการและอนุมัติ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {request!.comments && request!.comments.length > 0 ? (
                  request!.comments.map((comment) => (
                    <div key={comment.id} className="flex items-start space-x-3">
                      <User className="h-5 w-5 text-gray-500 mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                                                    <span className="font-medium text-sm">{comment.user?.name || 'System'}</span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(comment.timestamp), "d MMM yyyy, HH:mm", { locale: th })}
                          </span>
                        </div>
                                                <p className="text-sm text-gray-700 bg-gray-100 p-2 rounded-md mt-1">{comment.content || (comment as any).message}</p>
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
        </>
      )}
    </div>
  )
}
