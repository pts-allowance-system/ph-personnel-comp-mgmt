"use client"

import React from "react"
import { useParams } from "next/navigation"
import { useDataStore } from "@/lib/data-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { DocumentViewer } from "@/components/document-viewer"
import { Separator } from "@/components/ui/separator"
import { DollarSign, FileText, User } from "lucide-react"
import { format } from "date-fns"

export default function RequestDetailsPage() {
  const params = useParams()
  const { requests } = useDataStore()
  const [loading, setLoading] = React.useState(false)
  const [fetchedRequest, setFetchedRequest] = React.useState<any>(null)
  const request = requests.find((r) => r.id === params.id) || fetchedRequest

  React.useEffect(() => {
    if (!request && params.id) {
      setLoading(true)
      fetch(`/api/requests/${params.id}`)
        .then(res => res.ok ? res.json() : Promise.reject(res))
        .then(data => setFetchedRequest(data.request))
        .catch(() => setFetchedRequest(null))
        .finally(() => setLoading(false))
    }
  }, [params.id, request])

  if (loading) {
    return <div className="text-center py-8"><p className="text-gray-500">Loading request...</p></div>
  }

  if (!request) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Request not found</p>
      </div>
    )
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
          <h1 className="text-2xl font-bold text-gray-900">Request Details</h1>
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
            <div className="text-xs text-gray-500 mt-2">
              Calculation: ฿{request.baseRate.toLocaleString()} × {calculateDays()} days × {request.zoneMultiplier} = ฿
              {request.totalAmount.toLocaleString()}
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

      {/* Comments History */}
      {request.comments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Comments & History</CardTitle>
            <CardDescription>Communication history for this request</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {request.comments.map((comment) => (
                <div key={comment.id} className="border-l-4 border-blue-200 pl-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{comment.userName}</span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(comment.createdAt), "MMM dd, yyyy 'at' HH:mm")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{comment.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
