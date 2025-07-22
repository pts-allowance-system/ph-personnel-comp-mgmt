"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"

import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { useAuthStore } from "@/lib/store/auth-store";
import { useDataStore } from "@/lib/store/data-store";
import { useUserProfile } from "@/hooks/use-user-profile"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AllowanceRequest, Rate, UserProfile } from "@/lib/models"
import { RequestForm } from "@/components/requests/request-form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { z } from "zod"
import { api } from "@/lib/utils/storage";

// Infer the form schema type from RequestForm's schema
// This schema should reflect the fields expected by the RequestForm component
// and what the API will ultimately receive.
const formSchema = z.object({
  // Personal Info (mostly for display, can be updated via onUpdateProfile)
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  nationalId: z.string().optional(),
  position: z.string().optional(),
  positionId: z.string().optional(),
  department: z.string().optional(),
  licenseNumber: z.string().optional(),

  // Core Allowance Request fields
  employeeType: z.string().min(1),
  requestType: z.string().min(1),
  allowanceGroup: z.string().min(1),
  tier: z.string().min(1),
  monthlyRate: z.number(),
  totalAmount: z.number().optional(), // Added to match the API requirements
  effectiveDate: z.string().min(1),
  mainDuties: z.string().min(1),
  standardDuties: z.object({
    operations: z.boolean().optional(),
    planning: z.boolean().optional(),
    coordination: z.boolean().optional(),
    service: z.boolean().optional(),
  }).optional(),
  certificate: z.string().optional(),
  documents: z.array(z.any()).optional(),
  specialTasks: z.array(z.string()).optional(), // Kept from original, might be part of profile
});

type FormValues = z.infer<typeof formSchema>;

export default function NewRequestPage() {
  const { user, token, isAuthenticated } = useAuthStore();
  const addRequest = useDataStore(state => state.addRequest);
  const router = useRouter()
  const { profile, isLoading, error } = useUserProfile()
  
  // Check authentication status on component mount
  useEffect(() => {
    // Get the fresh authentication state
    const { isAuthenticated, token } = useAuthStore.getState();
    if (!isAuthenticated || !token) {
      // Redirect to login if not authenticated
      console.log("Not authenticated, redirecting to login");
      router.replace("/login?redirect=/requests/new");
    }
  }, [router]);

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState("")
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [requestData, setRequestData] = useState<Partial<FormValues> | null>(null)
  const [isSubmittingAsDraft, setIsSubmittingAsDraft] = useState(false);

  const [allowanceRates, setAllowanceRates] = useState<Pick<Rate, 'allowanceGroup' | 'tier' | 'monthlyRate'>[]>([])
  const [isEditingInfo, setIsEditingInfo] = useState(false)

  // DEBUG: Log the profile data to check if calculated fields are present
  // console.log("Profile data received in page:", profile);

  const initialDataForForm = useMemo(() => {
    // Ensure all fields have a default value (e.g., '' or null) to prevent
    // uncontrolled-to-controlled input errors.
    const defaults = {
      firstName: '',
      lastName: '',
      nationalId: '',
      positionId: '',
      position: '',
      department: '',
      licenseNumber: '',
      employeeType: '',
      requestType: '',
      allowanceGroup: '',
      tier: '',
      monthlyRate: 0,
      effectiveDate: '',
      mainDuties: '',
      standardDuties: {
        operations: false,
        planning: false,
        coordination: false,
        service: false,
      },
      certificate: '',
      documents: [],
      specialTasks: [],
    };

    if (!profile) return defaults;

    return {
      ...defaults,
      ...profile,
      position: profile.position ?? '',
      department: profile.department ?? '', // Ensure null is converted to empty string
      nationalId: profile.nationalId ?? '',
      positionId: profile.positionId ?? '',
      licenseNumber: profile.licenseNumber ?? '',
      allowanceGroup: profile.allowanceGroup ?? '',
      tier: profile.tier ?? '',
      specialTasks: profile.specialTasks ?? [],
    };
  }, [profile]);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const ratesResponse = await fetch("/api/rates?distinct=true")
        if (ratesResponse.ok) {
          const ratesData = await ratesResponse.json()
          setAllowanceRates(ratesData)
        } else {
          console.error("Failed to fetch allowance rates")
        }
      } catch (error) {
        console.error("Error fetching rates:", error)
      }
    }

    fetchRates()
  }, [])

  const handleUpdateProfile = async (data: Partial<UserProfile>) => {
    if (!user || !token) {
      setFormError("Authentication error. Please log in again.")
      return
    }

    setIsSubmitting(true)
    setFormError("")

    try {
      const response = await fetch(`/api/users/${user.id}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update profile.")
      }
      // Ideally, you would re-fetch the profile data here or have the useUserProfile hook handle it.
    } catch (error) {
      console.error("Error updating profile:", error)
      setFormError((error as Error).message)
    } finally {
      setIsSubmitting(false)
      setIsEditingInfo(false)
    }
  }

  const onSubmit = (values: FormValues, isDraft: boolean) => {
    setFormError("")
    setRequestData(values)
    setIsSubmittingAsDraft(isDraft);
    setIsConfirmOpen(true)
    // Always set totalAmount equal to monthlyRate if not explicitly set
    const dataToSubmit = {
      ...values,
      totalAmount: values.totalAmount || values.monthlyRate, // Ensure totalAmount is included
      status: isDraft ? 'draft' : 'pending',
    }

    // Set state to display data in the dialog and open it.
    setRequestData(dataToSubmit);
    setIsConfirmOpen(true);
  }

  const handleConfirmSubmit = async (data: Partial<FormValues> | null) => {
    if (isSubmitting || !data) return; // Prevent duplicate submissions and handle null data

    try {
      setIsSubmitting(true);
      
      // Check authentication status again before submission
      const authState = useAuthStore.getState();
      console.log("Auth state before submission:", { 
        isAuthenticated: authState.isAuthenticated, 
        hasToken: !!authState.token 
      });
      
      if (!authState.isAuthenticated || !authState.token) {
        // Handle authentication failure gracefully
        setIsConfirmOpen(false);
        setFormError("Your session has expired. Please log in again.");
        return;
      }

      // Ensure totalAmount is set if it's missing but we have monthlyRate
      if (!data?.totalAmount && data?.monthlyRate) {
        data.totalAmount = data.monthlyRate;
      }
      
      // Extra validation before submission
      if (!data?.monthlyRate || !data?.totalAmount) {
        throw new Error("Monthly rate and total amount are required");
      }

      setIsConfirmOpen(false);

      const normalizedData = {
        ...data,
        status: isSubmittingAsDraft ? 'draft' : 'pending',
        standardDuties: {
          operations: data.standardDuties?.operations || false,
          planning: data.standardDuties?.planning || false,
          coordination: data.standardDuties?.coordination || false,
          service: data.standardDuties?.service || false,
        },
      };

      const newRequest = await addRequest(normalizedData);

      if (newRequest && newRequest.id) {
        // Redirect to the newly created request's page
        router.push(`/requests/${newRequest.id}`);
      } else {
        // Fallback in case the response format is unexpected
        console.error("Failed to get request ID from response, redirecting to success page.");
        router.push("/requests?status=success");
      }

    } catch (error) {
      console.error("Error submitting request:", error);
      setFormError(error instanceof Error ? error.message : "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <p>Loading...</p>
  }

  if (error) {
    return <p>Error loading profile: {error.message}</p>
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>สร้างคำขอรับเงินเพิ่มสำหรับตำแหน่งที่มีเหตุพิเศษ (พ.ต.ส.)</CardTitle>
            <CardDescription>กรุณากรอกรายละเอียดให้ครบถ้วนและถูกต้อง</CardDescription>
          </CardHeader>
          <CardContent>
            {formError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <RequestForm
              key={JSON.stringify(initialDataForForm)} // Re-mount form when initialData changes
              initialData={initialDataForForm}
              onSubmit={onSubmit}
              onUpdateProfile={handleUpdateProfile}
              allowanceRates={allowanceRates}
              isSubmitting={isSubmitting}
              isEditingInfo={isEditingInfo}
              setIsEditingInfo={setIsEditingInfo}
            />
          </CardContent>
        </Card>
        <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>ยืนยันการส่งคำขอ</AlertDialogTitle>
              <AlertDialogDescription>
                กรุณาตรวจสอบรายละเอียดคำขอรับเงิน พ.ต.ส. ก่อนส่งเพื่ออนุมัติ การดำเนินการนี้ไม่สามารถย้อนกลับได้
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleConfirmSubmit(requestData)}>ยืนยัน</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
