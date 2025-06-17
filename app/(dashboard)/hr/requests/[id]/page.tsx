"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"
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
import type { AllowanceRequest } from "@/lib/types"

export default function HrRequestDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user, token } = useAuthStore()
  const [request, setRequest] = useState<AllowanceRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [ruleChecks, setRuleChecks] = useState([
    { id: "rule1", name: "Valid License", checked: false },
    { id: "rule2", name: "Correct Position", checked: false },
    { id: "rule3", name: "Within Allowance Limit", checked: false },
    { id: "rule4", name: "Complete Documentation", checked: false },
  ])
  const [override, setOverride] = useState(false)

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
        setRequest(data)
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

  const handleRuleCheck = (id: string, checked: boolean) => {
    setRuleChecks(ruleChecks.map((rule) => (rule.id === id ? { ...rule, checked } : rule)))
  }

  const allRulesChecked = ruleChecks.every((rule) => rule.checked)

  const handleApprove = async () => {
    if (!allRulesChecked && !override) {
      setError("All rules must be checked or override must be selected")
      return
    }

    await updateRequest("hr-checked")
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

      // Update the request status
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
        throw new Error("Failed to update request")
      }

      // Redirect back to the list
      router.push("/hr/requests")
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
    const start = new Date(request.startDate)
    const end = new Date(request.endDate)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HR Review</h1>
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
                  {format(new Date(request.startDate), "MMM dd, yyyy")} -{" "}
                  {format(new Date(request.endDate), "MMM dd, yyyy")}
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
                  {format(new Date(request.createdAt), "MMM dd, yyyy 'at' HH:mm")}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Updated</label>
                <p className="text-sm text-gray-900">
                  {format(new Date(request.updatedAt), "MMM dd, yyyy 'at' HH:mm")}
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

      {/* HR Rule Check */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ClipboardCheck className="h-5 w-5" />
            <span>Rule Verification</span>
          </CardTitle>
          <CardDescription>Verify that this request meets all eligibility rules</CardDescription>
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
                  Override Rule Check
                </label>
                <p className="text-sm text-muted-foreground">
                  Use this option only in exceptional cases with proper justification
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-4">
            <label className="text-sm font-medium text-gray-700">Comments</label>
            <Textarea
              placeholder="Add your comments or feedback here..."
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
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleReject} disabled={submitting || comment.trim() === ""}>
            <X className="h-4 w-4 mr-2" />
            Reject
          </Button>
          <Button variant="default" onClick={handleApprove} disabled={submitting || (!allRulesChecked && !override)}>
            <Check className="h-4 w-4 mr-2" />
            Mark as Checked
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
