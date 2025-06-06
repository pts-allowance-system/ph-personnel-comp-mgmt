"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import type { FileUpload } from "@/lib/types"

export default function NewRequestPage() {
  const { user, token } = useAuthStore()
  const { rates, fetchRates, addRequest, loading, error } = useDataStore()
  const router = useRouter()

  const [formData, setFormData] = useState({
    group: "",
    tier: "",
    startDate: "",
    endDate: "",
    documents: [] as FileUpload[],
    notes: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState("")

  // Fetch rates on component mount
  useEffect(() => {
    if (token) {
      fetchRates(token)
    }
  }, [token, fetchRates])

  const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault()
    setFormError("")
    setIsSubmitting(true)

    try {
      if (!user) throw new Error("User not found")

      // Validate required fields
      if (!formData.group || !formData.tier || !formData.startDate || !formData.endDate) {
        throw new Error("Please fill in all required fields")
      }

      // Find the rate for calculation
      const rate = rates.find((r) => r.group === formData.group && r.tier === formData.tier)
      if (!rate) {
        throw new Error("Rate not found for selected group and tier")
      }

      // Calculate total amount
      const startDate = new Date(formData.startDate)
      const endDate = new Date(formData.endDate)

      if (endDate <= startDate) {
        throw new Error("End date must be after start date")
      }

      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      const zoneMultiplier = 1.2 // This could be configurable based on location
      const totalAmount = rate.baseRate * days * zoneMultiplier

      const requestData = {
        employeeId: user.id,
        employeeName: user.name,
        group: formData.group,
        tier: formData.tier,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: isDraft ? "draft" : "submitted",
        baseRate: rate.baseRate,
        zoneMultiplier,
        totalAmount,
        documents: formData.documents,
        comments: [],
      }

      const requestId = await addRequest(requestData, token!)

      if (requestId) {
        router.push(`/requests/${requestId}`)
      } else {
        throw new Error("Failed to create request")
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create request")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get unique groups and tiers from rates
  const groups = [...new Set(rates.map((r) => r.group))]
  const tiers = formData.group ? [...new Set(rates.filter((r) => r.group === formData.group).map((r) => r.tier))] : []

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Allowance Request</h1>
        <p className="text-gray-600">Create a new special position allowance request</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
          <CardDescription>Fill in the details for your allowance request</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="group">Group *</Label>
                <Select
                  value={formData.group}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, group: value, tier: "" }))}
                  disabled={loading}
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
                  value={formData.tier}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, tier: value }))}
                  disabled={loading || !formData.group}
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

            {/* Show rate information if both group and tier are selected */}
            {formData.group && formData.tier && (
              <div className="p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Base Rate:</strong> ฿
                  {rates.find((r) => r.group === formData.group && r.tier === formData.tier)?.baseRate.toLocaleString()}{" "}
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
                  value={formData.startDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Supporting Documents</Label>
              <FileUploadComponent
                files={formData.documents}
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
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            {(error || formError) && (
              <Alert variant="destructive">
                <AlertDescription>{error || formError}</AlertDescription>
              </Alert>
            )}

            {loading && (
              <Alert>
                <AlertDescription>Loading rates...</AlertDescription>
              </Alert>
            )}

            <div className="flex space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={(e) => handleSubmit(e, true)}
                disabled={isSubmitting || loading}
              >
                Save as Draft
              </Button>
              <Button type="submit" disabled={isSubmitting || loading || !formData.group || !formData.tier}>
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
