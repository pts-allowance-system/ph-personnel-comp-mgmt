"use client"

import React, { useCallback, useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { FileUploadComponent } from "@/components/file-upload"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Edit, Loader2, Save, Send, X } from "lucide-react"
import { UserProfile, AllowanceRequest, Rate } from "@/lib/models"

// Updated Zod schema based on the new form structure
const formSchema = z.object({
  // Personal Info - These are display-only or for profile updates
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  nationalId: z.string().optional(),
  position: z.string().optional(),
  positionId: z.string().optional(),
  department: z.string().optional(),
  licenseNumber: z.string().optional(),

  // Allowance Info - These are the core request fields
  employeeType: z.string().min(1, "กรุณาเลือกประเภทบุคลากร"),
  requestType: z.string().min(1, "กรุณาเลือกประเภท พ.ต.ส."),
  allowanceGroup: z.string().min(1, "กรุณาเลือกกลุ่มอัตรา พ.ต.ส."),
  tier: z.string().min(1, "กรุณาเลือกระดับ"),
  monthlyRate: z.coerce.number({ required_error: "กรุณากรอกอัตราเงิน" }).positive("อัตราเงินต้องเป็นค่าบวก"),
  effectiveDate: z.string().min(1, "กรุณาเลือกวันที่"),
  mainDuties: z.string().min(1, "กรุณาระบุภาระงานหลักโดยย่อ"),
  standardDuties: z.object({
    operations: z.boolean().default(false),
    planning: z.boolean().default(false),
    coordination: z.boolean().default(false),
    service: z.boolean().default(false),
  }).optional(),
  certificate: z.string().optional(),

  // Documents
  documents: z.array(z.any()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface RequestFormProps {
  initialData?: Partial<FormValues>;
  onSubmit: (values: FormValues, isDraft: boolean) => void;
  onUpdateProfile: (values: Partial<UserProfile>) => Promise<void>;
  allowanceRates: Pick<Rate, 'allowanceGroup' | 'tier' | 'monthlyRate'>[];
  isEditingInfo: boolean;
  setIsEditingInfo: (isEditing: boolean) => void;
  isSubmitting: boolean;
  onCancel?: () => void;
}

export function RequestForm({
  initialData,
  onSubmit,
  isSubmitting,
  allowanceRates,
  isEditingInfo,
  setIsEditingInfo,
  onUpdateProfile,
  onCancel,
}: RequestFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      ...initialData,
      effectiveDate: initialData.effectiveDate || new Date().toISOString().split('T')[0],
      documents: initialData.documents ?? [],
    } : {
      effectiveDate: new Date().toISOString().split('T')[0],
      documents: [],
    },
  });

  const { setValue, watch } = form;
  const selectedGroup = watch("allowanceGroup");

  useEffect(() => {
    if (selectedGroup) {
      const rate = allowanceRates.find(r => r.allowanceGroup === selectedGroup);
      if (rate) {
        setValue("monthlyRate", rate.monthlyRate);
      }
    }
  }, [selectedGroup, allowanceRates, setValue]);

  const handleCancelEdit = () => {
    // Revert only the profile fields to their initial state
    form.setValue('firstName', initialData?.firstName || '');
    form.setValue('lastName', initialData?.lastName || '');
    form.setValue('nationalId', initialData?.nationalId || '');
    form.setValue('position', initialData?.position || '');
    form.setValue('positionId', initialData?.positionId || '');
    form.setValue('department', initialData?.department || '');
    form.setValue('licenseNumber', initialData?.licenseNumber || '');
    setIsEditingInfo(false);
  };

  const handleSaveEdit = async () => {
    const values = form.getValues();
    // Extract only the fields relevant to UserProfile
    const profileData: Partial<UserProfile> = {
      firstName: values.firstName,
      lastName: values.lastName,
      nationalId: values.nationalId,
      position: values.position,
      positionId: values.positionId,
      department: values.department,
      licenseNumber: values.licenseNumber,
    };
    await onUpdateProfile(profileData);
    setIsEditingInfo(false);
  };

  const handleSaveDraft = (data: FormValues) => {
    onSubmit(data, true);
  };

  const handleFinalSubmit = (data: FormValues) => {
    onSubmit(data, false);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFinalSubmit)}
        className="bg-white p-8 md:p-12 shadow-lg rounded-lg space-y-8 border border-gray-200"
      >
        {/* Form Header */}
        <div className="text-center space-y-2 border-b pb-4">
          <h2 className="text-2xl font-serif font-bold">
            แบบฟอร์มคำขอรับเงินเพิ่มสำหรับตำแหน่งที่มีเหตุพิเศษของผู้ปฏิบัติงานด้านการสาธารณสุข (พ.ต.ส.)
          </h2>
          <p className="text-lg font-serif">โรงพยาบาลอุตรดิตถ์</p>
        </div>

        {/* Personal Information Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-serif font-semibold">๑. ข้อมูลผู้ขอรับ</h3>
            {!isEditingInfo ? (
              <Button variant="outline" size="sm" onClick={() => setIsEditingInfo(true)}>
                <Edit className="mr-2 h-4 w-4" /> แก้ไข
              </Button>
            ) : (
              <div className="space-x-2">
                <Button variant="default" size="sm" onClick={handleSaveEdit}>
                  <Save className="mr-2 h-4 w-4" /> บันทึก
                </Button>
                <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                  <X className="mr-2 h-4 w-4" /> ยกเลิก
                </Button>
              </div>
            )}
          </div>
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="firstName" render={({ field }) => <FormItem><FormLabel>ชื่อ</FormLabel><FormControl><Input {...field} value={field.value || ''} disabled={!isEditingInfo} className="bg-gray-50" /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="lastName" render={({ field }) => <FormItem><FormLabel>นามสกุล</FormLabel><FormControl><Input {...field} value={field.value || ''} disabled={!isEditingInfo} className="bg-gray-50" /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="nationalId" render={({ field }) => <FormItem><FormLabel>เลขประจำตัวประชาชน</FormLabel><FormControl><Input {...field} value={field.value || ''} disabled={!isEditingInfo} className="bg-gray-50" /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="position" render={({ field }) => <FormItem><FormLabel>ตำแหน่ง</FormLabel><FormControl><Input {...field} value={field.value || ''} disabled={!isEditingInfo} className="bg-gray-50" /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="positionId" render={({ field }) => <FormItem><FormLabel>เลขที่ตำแหน่ง</FormLabel><FormControl><Input {...field} value={field.value || ''} disabled={!isEditingInfo} className="bg-gray-50" /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="department" render={({ field }) => <FormItem><FormLabel>สังกัด/หน่วยงาน</FormLabel><FormControl><Input {...field} value={field.value || ''} disabled={!isEditingInfo} className="bg-gray-50" /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="licenseNumber" render={({ field }) => <FormItem><FormLabel>เลขที่ใบประกอบวิชาชีพ</FormLabel><FormControl><Input {...field} value={field.value || ''} disabled={!isEditingInfo} className="bg-gray-50" /></FormControl><FormMessage /></FormItem>} />
          </div>
        </div>

        {/* Allowance Information Section */}
        <div className="space-y-4">
          <h3 className="text-xl font-serif font-semibold">๒. ข้อมูลการขอรับเงิน พ.ต.ส.</h3>
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="employeeType" render={({ field }) => <FormItem><FormLabel>ประเภทบุคลากร <span className="text-red-500">*</span></FormLabel><FormControl><Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue placeholder="เลือกประเภท" /></SelectTrigger><SelectContent><SelectItem value="doctor">แพทย์</SelectItem><SelectItem value="other">อื่นๆ</SelectItem></SelectContent></Select></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="requestType" render={({ field }) => <FormItem><FormLabel>ประเภท พ.ต.ส. <span className="text-red-500">*</span></FormLabel><FormControl><Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue placeholder="เลือกประเภท" /></SelectTrigger><SelectContent><SelectItem value="specialized">พ.ต.ส. สำหรับผู้ปฏิบัติงานที่มีความชำนาญ</SelectItem><SelectItem value="non_specialized">พ.ต.ส. สำหรับผู้ปฏิบัติงานในพื้นที่พิเศษ</SelectItem></SelectContent></Select></FormControl><FormMessage /></FormItem>} />
          </div>
          <FormField control={form.control} name="mainDuties" render={({ field }) => <FormItem><FormLabel>ภาระงานหลักโดยย่อ <span className="text-red-500">*</span></FormLabel><FormControl><Input placeholder="ระบุภาระงานหลัก" {...field} /></FormControl><FormMessage /></FormItem>} />
          <FormItem>
            <FormLabel>ภาระงานตามมาตรฐานกำหนดตำแหน่ง</FormLabel>
            <div className="grid grid-cols-2 gap-4 p-4 border rounded-md bg-gray-50">
              {([
                { id: 'operations', label: 'ด้านการปฏิบัติการ' },
                { id: 'planning', label: 'ด้านการวางแผน' },
                { id: 'coordination', label: 'ด้านการประสานงาน' },
                { id: 'service', label: 'ด้านการบริการ' },
              ] as const).map((duty) => (
                <FormField
                  key={duty.id}
                  control={form.control}
                  name={`standardDuties.${duty.id}`}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="font-normal">{duty.label}</FormLabel>
                    </FormItem>
                  )}
                />
              ))}
            </div>
            <FormMessage />
          </FormItem>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField control={form.control} name="allowanceGroup" render={({ field }) => <FormItem><FormLabel>กลุ่ม <span className="text-red-500">*</span></FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="เลือกกลุ่ม" /></SelectTrigger></FormControl><SelectContent>{[...new Set(allowanceRates.map(r => r.allowanceGroup))].map(group => (<SelectItem key={group} value={group}>{group}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>} />
            <FormField control={form.control} name="tier" render={({ field }) => <FormItem><FormLabel>ระดับ <span className="text-red-500">*</span></FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedGroup}><FormControl><SelectTrigger><SelectValue placeholder="เลือกระดับ" /></SelectTrigger></FormControl><SelectContent>{[...new Set(allowanceRates.filter(r => r.allowanceGroup === selectedGroup).map(r => r.tier))].map(tier => (<SelectItem key={tier} value={tier}>{tier}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>} />
            <FormField control={form.control} name="monthlyRate" render={({ field }) => <FormItem><FormLabel>ในอัตราเดือนละ <span className="text-red-500">*</span></FormLabel><FormControl><Input type="number" readOnly {...field} value={field.value || ''} className="bg-gray-100" /></FormControl><FormMessage /></FormItem>} />
          </div>
          <FormField control={form.control} name="effectiveDate" render={({ field }) => <FormItem><FormLabel>ขอเบิกตั้งแต่วันที่ <span className="text-red-500">*</span></FormLabel><FormControl><Input type="date" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>} />
          <FormField control={form.control} name="certificate" render={({ field }) => <FormItem><FormLabel>วุฒิบัตร สาขา</FormLabel><FormControl><Input placeholder="ระบุสาขา (ถ้ามี)" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>} />
        </div>

        {/* File Attachment Section */}
        <div className="space-y-4">
          <h3 className="text-xl font-serif font-semibold">เอกสารแนบ</h3>
          <Separator />
          <FormField
            control={form.control}
            name="documents"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FileUploadComponent
                    files={field.value || []}
                    onFilesChange={field.onChange}
                    folder="allowance-requests"
                    maxFiles={5}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Footer Warning */}
        <div className="prose prose-sm max-w-none text-gray-600 border-t pt-4 mt-6">
          <p className="font-bold">คำเตือน:</p>
          <p>กรณีเปลี่ยนแปลงการปฏิบัติงาน เปลี่ยนแปลงตำแหน่ง หรือเปลี่ยนแปลงหน่วยงานที่ปฏิบัติงาน ผู้มีสิทธิได้รับเงิน พ.ต.ส. มีหน้าที่แจ้งแก่เจ้าหน้าที่งานบริหารทรัพยากรบุคคลของส่วนราชการ/หัวหน้างานบริหารทั่วไป (ในกรณีที่ส่วนราชการไม่มีเจ้าหน้าที่งานบริหารทรัพยากรบุคคล) เพื่อแก้ไขข้อมูลสิทธิการรับเงิน พ.ต.ส. ให้ถูกต้องและเป็นปัจจุบันตลอดเวลาที่รับเงิน พ.ต.ส. และหากผู้มีสิทธิคนใดแจ้งข้อมูลสิทธิการรับเงิน พ.ต.ส. เป็นเท็จ หรือละเว้นไม่แจ้งแก้ไขข้อมูลสิทธิของตนให้ถูกต้อง โดยเจตนาให้เกิดความเสียหายแก่หน่วยงานของรัฐ อาจมีความผิดตามประมวลกฎหมายอาญา มาตรา ๑๓๗ หรือมาตรา ๒๖๗ และอาจถูกดำเนินการทางวินัยฐานทุจริตเงิน พ.ต.ส. ได้</p>
        </div>

        <div className="flex justify-end space-x-4">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
              ยกเลิก
            </Button>
          )}
          <Button type="button" variant="outline" onClick={form.handleSubmit(data => onSubmit(data, true))} disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            บันทึกฉบับร่าง
          </Button>
          <Button type="button" onClick={form.handleSubmit(data => onSubmit(data, false))} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            ส่งคำขอ
          </Button>
        </div>
      </form>
    </Form>
  )
}
