"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { useAuthStore } from "@/lib/auth-store"
import { useDataStore } from "@/lib/data-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileUploadComponent } from "@/components/file-upload"
import type { FileUpload, AllowanceRequest } from "@/lib/types"
import { formatToThb } from "@/lib/currency-utils"

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
      fetchRates(token)
    }
  }, [token, fetchRates])

  useEffect(() => {
    async function fetchRequest() {
      try {
        const response = await fetch(`/api/requests/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) throw new Error("Failed to fetch request")
        const data = await response.json()
        setFormData(data)
      } catch (err) {
        setFormError("Failed to load request data.")
      }
    }
    if (params.id && token) {
      fetchRequest()
    }
  }, [params.id, token])

  const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault()
    setFormError("")

    if (!user) throw new Error("User not found")
    if (!formData.group || !formData.tier || !formData.startDate || !formData.endDate) {
      throw new Error("Please fill in all required fields")
    }

    const rate = rates.find((r) => r.group === formData.group && r.tier === formData.tier)
    if (!rate) throw new Error("Rate not found for selected group and tier")

    const startDate = new Date(formData.startDate)
    const endDate = new Date(formData.endDate)
    if (endDate <= startDate) throw new Error("End date must be after start date")

    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const zoneMultiplier = 1.2
    const totalAmount = rate.baseRate * days * zoneMultiplier

    const newStatus: AllowanceRequest['status'] = isDraft ? "draft" : "submitted"

    const dataToUpdate = {
      ...formData,
      baseRate: rate.baseRate,
      zoneMultiplier,
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
      await updateRequest(params.id as string, updateData, token!)
      router.push(`/requests/${params.id}`)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to update request")
    } finally {
      setIsSubmitting(false)
    }
  }

  const groups = [...new Set(rates.map((r) => r.group))]
  const tiers = formData.group ? [...new Set(rates.filter((r) => r.group === formData.group).map((r) => r.tier))] : []

  if (loading || !formData.id) return <div>Loading...</div>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Allowance Request</CardTitle>
          <CardDescription>Update the details of your request.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="group">Group *</Label>
                <Select
                  value={formData.group || ""}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, group: value, tier: "" }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select group" />
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
                <Label htmlFor="tier">Tier *</Label>
                <Select
                  value={formData.tier || ""}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, tier: value }))}
                  disabled={!formData.group}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tier" />
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

            {formData.group && formData.tier && (
              <div className="p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Base Rate:</strong>
                  {formatToThb(rates.find((r) => r.group === formData.group && r.tier === formData.tier)?.baseRate)}
                  per day
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate?.split('T')[0] || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
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
              <Label>Supporting Documents</Label>
              <FileUploadComponent
                files={formData.documents || []}
                onFilesChange={(files) => setFormData((prev) => ({ ...prev, documents: files }))}
                folder="requests"
                maxFiles={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes or comments"
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
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={(e) => handleSubmit(e, true)}
                disabled={isSubmitting}
              >
                Save as Draft
              </Button>
              <Button type="submit" disabled={isSubmitting || !formData.group || !formData.tier}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={handleConfirmUpdate}
        title="Confirm Changes"
        description="Are you sure you want to save these changes?"
      />
    </div>
  )
}
