"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StatusBadge } from "@/components/status-badge"
import { DocumentViewer } from "@/components/document-viewer"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileUploadComponent } from "@/components/file-upload"
import { DollarSign, FileText, User, Check, Receipt, Calendar } from "lucide-react"
import { format } from "date-fns"
import type { AllowanceRequest, FileUpload } from "@/lib/types"

export default function FinanceRequestDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user, token } = useAuthStore()
  const [request, setRequest] = useState<AllowanceRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [disbursementDate, setDisbursementDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [referenceNumber, setReferenceNumber] = useState("")
  const [proofDocuments, setProofDocuments] = useState<FileUpload[]>([])

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
        setRequest(data.request)
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

  const handleDisbursement = async () => {
    if (!referenceNumber) {
      setError("Please enter a reference number")
      return
    }

    try {
      setSubmitting(true)

      // Upload proof documents if any
      if (proofDocuments.length > 0) {
        await fetch(`/api/requests/${params.id}/documents`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            documents: proofDocuments,
            documentType: "disbursement_proof",
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
          status: "disbursed",
          disbursementDate,
          referenceNumber,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update request")
      }

      // Add comment about disbursement
      await fetch(`/api/requests/${params.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: `Disbursed on ${format(new Date(disbursementDate), "MMM dd, yyyy")} with reference number: ${referenceNumber}`,
        }),
      })

      // Redirect back to the list
      router.push("/finance/requests")
    } catch (err) {
      setError("Error processing disbursement")
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
          <h1 className="text-2xl font-bold text-gray-900">Process Disbursement</h1>
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
            <span>Payment Details</span>
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

      {/* Disbursement Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Receipt className="h-5 w-5" />
            <span>Disbursement Information</span>
          </CardTitle>
          <CardDescription>Enter payment details and upload proof of disbursement</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="disbursementDate">Disbursement Date</Label>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                <Input
                  id="disbursementDate"
                  type="date"
                  value={disbursementDate}
                  onChange={(e) => setDisbursementDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="referenceNumber">Reference Number</Label>
              <div className="flex items-center">
                <Receipt className="h-4 w-4 mr-2 text-gray-500" />
                <Input
                  id="referenceNumber"
                  type="text"
                  placeholder="e.g., TRX-12345"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Label>Proof of Disbursement (Optional)</Label>
            <FileUploadComponent
              files={proofDocuments}
              onFilesChange={setProofDocuments}
              folder="disbursements"
              maxFiles={3}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-end space-x-4">
          <Button variant="outline" onClick={() => router.push("/finance/requests")} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="default" onClick={handleDisbursement} disabled={submitting || !referenceNumber}>
            <Check className="h-4 w-4 mr-2" />
            Mark as Disbursed
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
