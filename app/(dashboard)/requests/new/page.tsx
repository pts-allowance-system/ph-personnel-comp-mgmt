"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { useAuthStore } from "@/lib/auth-store"
import { useDataStore } from "@/lib/data-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileUploadComponent } from "@/components/file-upload"
import { type FileUpload, type AllowanceRequest, RequestStatus } from "@/lib/types"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Edit } from "lucide-react"

export default function NewRequestPage() {
  const { user, token } = useAuthStore()
  const { addRequest } = useDataStore()
  const router = useRouter()

  const [formData, setFormData] = useState({
    employeeType: "",
    requestType: "",
    position: "",
    department: "",
    mainDuties: "",
    standardDuties: {
      operations: false,
      planning: false,
      coordination: false,
      service: false,
    },
    assignedTask: "",
    monthlyRate: "",
    effectiveDate: "",
    documents: [] as FileUpload[],
    notes: "",
    group: "",
    tier: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState("")
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [requestData, setRequestData] = useState<Partial<AllowanceRequest> | null>(null)
  const [allowanceRates, setAllowanceRates] = useState<{ group: string; tier: string }[]>([])
  const [isEditingInfo, setIsEditingInfo] = useState(false)

  useEffect(() => {
    const fetchAllowanceRates = async () => {
      try {
        const response = await fetch('/api/rates?distinct=true');
        if (response.ok) {
          const data = await response.json();
          setAllowanceRates(data);
        } else {
          console.error("Failed to fetch allowance rates");
        }
      } catch (error) {
        console.error("Error fetching allowance rates:", error);
      }
    };

    fetchAllowanceRates();
  }, []);

  useEffect(() => {
    if (user && token) {
      const fetchUserProfile = async () => {
        try {
          const response = await fetch(`/api/users/${user.id}/profile`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const profile = await response.json();
            setFormData(prev => ({
              ...prev,
              position: profile.position || "",
              department: profile.department || "",
            }));
          } else {
            console.error("Failed to fetch user profile");
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      };

      fetchUserProfile();
    }
  }, [user, token]);

  const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault()
    setFormError("")

    if (!user) {
      setFormError("ไม่พบผู้ใช้ กรุณาเข้าสู่ระบบอีกครั้ง")
      return
    }

    if (!formData.employeeType || !formData.requestType || !formData.position || !formData.effectiveDate || !formData.monthlyRate) {
      setFormError("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (ประเภทบุคลากร, ประเภทคำขอ, ตำแหน่ง, วันที่มีผล, อัตราเงินเดือน)")
      return
    }

    const newRequestData: Partial<AllowanceRequest> = {
      ...formData,
      employeeId: user.id,
      employeeName: user.name,
      monthlyRate: parseFloat(formData.monthlyRate) || 0,
      totalAmount: parseFloat(formData.monthlyRate) || 0,
      status: isDraft ? RequestStatus.Draft : RequestStatus.Submitted,
    }

    setRequestData(newRequestData)
    setIsConfirmOpen(true)
  }

  const handleConfirmSubmit = async () => {
    if (!requestData) return

    setIsSubmitting(true)
    try {
      const createdRequest = await addRequest(requestData, token!)
      if (createdRequest) {
        router.push(`/requests/${createdRequest.id}`)
      } else {
        throw new Error("ไม่สามารถสร้างคำขอได้ กรุณาลองอีกครั้ง")
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดที่ไม่คาดคิด")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStandardDutyChange = (duty: keyof typeof formData.standardDuties, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      standardDuties: {
        ...prev.standardDuties,
        [duty]: checked,
      },
    }))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>แบบฟอร์มคำขอรับเงินเพิ่มสำหรับตำแหน่งที่มีเหตุพิเศษ (พ.ต.ส.)</CardTitle>
          <CardDescription>สำหรับโรงพยาบาลอุตรดิตถ์</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
            <div className="space-y-2">
              <Label>ประเภทบุคลากร *</Label>
              <RadioGroup
                value={formData.employeeType}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, employeeType: value }))}
                className="flex flex-wrap gap-x-4 gap-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="civil_servant" id="r1" />
                  <Label htmlFor="r1">ข้าราชการ</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="gov_employee" id="r2" />
                  <Label htmlFor="r2">พนักงานราชการ</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="moph_employee" id="r3" />
                  <Label htmlFor="r3">พนักงานกระทรวงสาธารณสุข</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="temp_employee" id="r4" />
                  <Label htmlFor="r4">ลูกจ้างชั่วคราว</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>ประเภทคำขอ *</Label>
              <RadioGroup
                value={formData.requestType}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, requestType: value }))}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="new" id="t1" />
                  <Label htmlFor="t1">กรณีบรรจุใหม่หรือตรวจสอบสิทธิครั้งแรก</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="edit_no_rate_change" id="t2" />
                  <Label htmlFor="t2">กรณีแก้ไขข้อมูลโดยไม่เปลี่ยนอัตราเงิน พ.ต.ส.</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="edit_rate_change" id="t3" />
                  <Label htmlFor="t3">กรณีแก้ไขข้อมูลสิทธิโดยเปลี่ยนอัตราเงิน พ.ต.ส.</Label>
                </div>
              </RadioGroup>
            </div>

            <p className="text-sm font-semibold">เรียน ผู้อำนวยการโรงพยาบาลอุตรดิตถ์</p>

            <div className="border p-4 rounded-md space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">ข้อมูลผู้ขอ</h3>
                <Button type="button" variant="outline" size="sm" onClick={() => setIsEditingInfo(!isEditingInfo)}>
                  <Edit className="h-4 w-4 mr-2" />
                  {isEditingInfo ? 'ล็อกการแก้ไข' : 'แก้ไข'}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="applicantName">ข้าพเจ้า (ชื่อ-สกุล)</Label>
                  <Input id="applicantName" value={user?.name || ""} readOnly className="bg-gray-100" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">ตำแหน่ง *</Label>
                  <Input 
                      id="position" 
                      value={formData.position} 
                      onChange={(e) => setFormData((prev) => ({ ...prev, position: e.target.value }))} 
                      readOnly={!isEditingInfo}
                      className={!isEditingInfo ? "bg-gray-100" : ""}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">ปฏิบัติงานในกลุ่มงานหรือแผนก</Label>
                <Input 
                    id="department" 
                    value={formData.department} 
                    onChange={(e) => setFormData((prev) => ({ ...prev, department: e.target.value }))} 
                    placeholder="กลุ่มงาน/แผนก"
                    readOnly={!isEditingInfo}
                    className={!isEditingInfo ? "bg-gray-100" : ""}
                />
                <p className="text-sm text-gray-500">สังกัด: โรงพยาบาลอุตรดิตถ์ สำนักงานสาธารณสุขจังหวัดอุตรดิตถ์</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mainDuties">ปฏิบัติหน้าที่หลักของตำแหน่ง</Label>
              <Textarea id="mainDuties" value={formData.mainDuties} onChange={(e) => setFormData((prev) => ({ ...prev, mainDuties: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>ปฏิบัติงานตามมาตรฐานกำหนดตำแหน่งในด้าน</Label>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="sd1" checked={formData.standardDuties.operations} onCheckedChange={(checked) => handleStandardDutyChange("operations", !!checked)} />
                  <Label htmlFor="sd1">ปฏิบัติการ</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="sd2" checked={formData.standardDuties.planning} onCheckedChange={(checked) => handleStandardDutyChange("planning", !!checked)} />
                  <Label htmlFor="sd2">การวางแผน</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="sd3" checked={formData.standardDuties.coordination} onCheckedChange={(checked) => handleStandardDutyChange("coordination", !!checked)} />
                  <Label htmlFor="sd3">การประสานงาน</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="sd4" checked={formData.standardDuties.service} onCheckedChange={(checked) => handleStandardDutyChange("service", !!checked)} />
                  <Label htmlFor="sd4">การบริการ</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignedTask">ได้รับมอบหมายให้ปฏิบัติงาน</Label>
              <Textarea id="assignedTask" value={formData.assignedTask} onChange={(e) => setFormData((prev) => ({ ...prev, assignedTask: e.target.value }))} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="group">กลุ่ม *</Label>
                <Select onValueChange={(value) => setFormData((prev) => ({ ...prev, group: value }))} value={formData.group}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกกลุ่ม" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(new Set(allowanceRates.map(r => r.group))).map((group, index) => (
                      <SelectItem key={index} value={group}>{group}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tier">ระดับ *</Label>
                 <Select onValueChange={(value) => setFormData((prev) => ({ ...prev, tier: value }))} value={formData.tier}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกระดับ" />
                  </SelectTrigger>
                  <SelectContent>
                    {allowanceRates.filter(rate => rate.group === formData.group).map((rate, index) => (
                      <SelectItem key={index} value={rate.tier}>{rate.tier}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>เอกสารประกอบ (เช่น ใบอนุญาตประกอบวิชาชีพ)</Label>
              <FileUploadComponent
                files={formData.documents}
                onFilesChange={(files) => setFormData((prev) => ({ ...prev, documents: files }))}
                folder="requests"
                maxFiles={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">หมายเหตุ (ถ้ามี)</Label>
              <Textarea
                id="notes"
                placeholder="หมายเหตุหรือความคิดเห็นเพิ่มเติม"
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <Alert variant="destructive">
              <AlertDescription>
                <strong>คำเตือน:</strong> กรณีเปลี่ยนแปลงการปฏิบัติงาน เปลี่ยนแปลงตำแหน่ง หรือเปลี่ยนแปลงหน่วยงานที่ปฏิบัติงาน ผู้มีสิทธิได้รับเงิน พ.ต.ส. มีหน้าที่แจ้งแก่เจ้าหน้าที่งานบริหารทรัพยากรบุคคลของส่วนราชการ/หัวหน้างาน บริหารทั่วไป (ในกรณีที่ส่วนราชการไม่มีเจ้าหน้าที่งานบริหารทรัพยากรบุคคล) เพื่อแก้ไขข้อมูลสิทธิการรับเงิน พ.ต.ส. ให้ถูกต้องและเป็นปัจจุบันตลอดเวลาที่รับเงิน พ.ต.ส. และหากผู้มีสิทธิคนใด แจ้งข้อมูลสิทธิการรับเงิน พ.ต.ส. เป็นเท็จ หรือละเว้นไม่แจ้งแก้ไขข้อมูลสิทธิของตนให้ถูกต้อง โดยเจตนาให้เกิดความเสียหายแก่หน่วยงานของรัฐ อาจมีความผิดตามประมวลกฎหมายอาญา มาตรา ๑๗ หรือมาตรา ๒๖๗ และอาจถูกดำเนินการทางวินัยฐานทุจริตเงิน พ.ต.ส ได้
              </AlertDescription>
            </Alert>

            {(formError) && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <CardFooter className="flex justify-end space-x-4 p-0 pt-6">
              <Button variant="outline" onClick={() => router.push("/requests")} disabled={isSubmitting}>
                ยกเลิก
              </Button>
              <Button type="button" variant="secondary" onClick={(e) => handleSubmit(e, true)} disabled={isSubmitting}>
                บันทึกเป็นฉบับร่าง
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "กำลังส่ง..." : "ส่งคำขอเพื่ออนุมัติ"}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={handleConfirmSubmit}
        title="ยืนยันการส่งคำขอ"
        description="กรุณาตรวจสอบรายละเอียดคำขอรับเงิน พ.ต.ส. ก่อนส่งเพื่ออนุมัติ การดำเนินการนี้ไม่สามารถย้อนกลับได้"
      />
    </div>
  )
}
