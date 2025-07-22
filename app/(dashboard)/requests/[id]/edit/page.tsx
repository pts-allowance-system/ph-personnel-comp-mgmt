"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { useAuthStore } from "@/lib/store/auth-store"
import { useDataStore } from "@/lib/store/data-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileUploadComponent } from "@/components/file-upload"
import type { FileUpload, AllowanceRequest } from "@/lib/models"
import { formatToThb } from "@/lib/utils/currency-utils"

export default function EditRequestPage() {
  const { user, token } = useAuthStore()
  const { rates, fetchRates, updateRequest, loading, error } = useDataStore()
  const router = useRouter()
  const params = useParams()

  const [formData, setFormData] = useState<Partial<AllowanceRequest>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState("")
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [updateData, setUpdateData] = useState<any>(null)

  useEffect(() => {
    if (token) {
      fetchRates()
    }
  }, [token, fetchRates])

  useEffect(() => {
    async function fetchRequest() {
      try {
        const response = await fetch(`/api/requests/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) throw new Error("ไม่สามารถดึงข้อมูลคำขอได้")
        const data = await response.json()
        setFormData(data)
      } catch (err) {
        setFormError("ไม่สามารถโหลดข้อมูลคำขอได้")
      }
    }
    if (params.id && token) {
      fetchRequest()
    }
  }, [params.id, token])

  const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault()
    setFormError("")

    if (!user) {
      setFormError("ไม่พบผู้ใช้")
      return
    }
    if (!formData.allowanceGroup || !formData.tier || !formData.startDate || !formData.endDate) {
      setFormError("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน")
      return
    }

    const rate = rates.find((r) => r.allowanceGroup === formData.allowanceGroup && r.tier === formData.tier)
    if (!rate) {
      setFormError("ไม่พบอัตราสำหรับกลุ่มและระดับที่เลือก")
      return
    }

    const startDate = new Date(formData.startDate)
    const endDate = new Date(formData.endDate)
    if (endDate <= startDate) {
      setFormError("วันที่สิ้นสุดต้องอยู่หลังวันที่เริ่มต้น")
      return
    }

    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const totalAmount = rate.monthlyRate * days

    const newStatus: AllowanceRequest['status'] = isDraft ? "draft" : "submitted"

    const dataToUpdate = {
      ...formData,
      monthlyRate: rate.monthlyRate,
      totalAmount,
      status: newStatus,
    }

    setUpdateData(dataToUpdate)
    setIsConfirmOpen(true)
  }

  const handleConfirmUpdate = async () => {
    if (!updateData) return

    setIsSubmitting(true)
    try {
      await updateRequest(params.id as string, updateData)
      router.push(`/requests/${params.id}`)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "การอัปเดตคำขอล้มเหลว")
    } finally {
      setIsSubmitting(false)
    }
  }

  const groups = [...new Set(rates.map((r) => r.allowanceGroup))]
  const tiers = formData.allowanceGroup ? [...new Set(rates.filter((r) => r.allowanceGroup === formData.allowanceGroup).map((r) => r.tier))] : []

  if (loading || !formData.id) return <div>กำลังโหลด...</div>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>แก้ไขคำขอรับเงิน พ.ต.ส.</CardTitle>
          <CardDescription>อัปเดตรายละเอียดคำขอรับเงิน พ.ต.ส. ของคุณด้านล่าง</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="group">กลุ่มอัตรา พ.ต.ส. *</Label>
                <Select
                  value={formData.allowanceGroup || ""}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, group: value, tier: "" }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกกลุ่มอัตรา" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tier">ระดับ (Tier) *</Label>
                <Select
                  value={formData.tier || ""}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, tier: value }))}
                  disabled={!formData.allowanceGroup}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกระดับ (Tier)" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiers.map((tier) => (
                      <SelectItem key={tier} value={tier}>
                        {tier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.allowanceGroup && formData.tier && (
              <div className="p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>อัตราค่าตอบแทน:</strong>
                  {formatToThb(rates.find((r) => r.allowanceGroup === formData.allowanceGroup && r.tier === formData.tier)?.monthlyRate)}
                  ต่อวัน
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">วันที่เริ่มต้น *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate?.split('T')[0] || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">วันที่สิ้นสุด *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate?.split('T')[0] || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>เอกสารประกอบ (เช่น ใบอนุญาตประกอบวิชาชีพ)</Label>
              <FileUploadComponent
                files={formData.documents || []}
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
                value={formData.notes || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            {(error || formError) && (
              <Alert variant="destructive">
                <AlertDescription>{error || formError}</AlertDescription>
              </Alert>
            )}

            <div className="flex space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                ยกเลิก
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={(e) => handleSubmit(e, true)}
                disabled={isSubmitting}
              >
                บันทึกเป็นฉบับร่าง
              </Button>
              <Button type="submit" disabled={isSubmitting || !formData.allowanceGroup || !formData.tier}>
                {isSubmitting ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={handleConfirmUpdate}
        title="ยืนยันการแก้ไขข้อมูล"
        description="คุณต้องการบันทึกการเปลี่ยนแปลงข้อมูลคำขอรับเงิน พ.ต.ส. ใช่หรือไม่?"
      />
    </div>
  )
}
