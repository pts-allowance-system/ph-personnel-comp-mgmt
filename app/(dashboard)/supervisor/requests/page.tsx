"use client"

import { RequestListView } from "@/components/requests/request-list-view"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { Eye } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { th } from "date-fns/locale"
import { formatToThb } from "@/lib/utils/currency-utils"
import type { AllowanceRequest } from "@/lib/models"

const columns = [
  { key: "employee", header: "Employee" },
  { key: "group", header: "Group/Tier" },
  { key: "amount", header: "Amount" },
  { key: "status", header: "Status" },
  { key: "date", header: "Submitted" },
];

const renderCell = (request: AllowanceRequest, key: string) => {
  switch (key) {
    case "employee":
      return request.employeeName;
    case "group":
      return `${request.allowanceGroup} / ${request.tier}`;
    case "amount":
      return formatToThb(request.totalAmount);
    case "status":
      return <StatusBadge status={request.status} />;
    case "date":
      return request.createdAt ? format(new Date(request.createdAt), "d MMM yy", { locale: th }) : "N/A";
    default:
      return null;
  }
};

const renderActions = (request: AllowanceRequest) => (
  <Button variant="ghost" size="sm" asChild>
    <Link href={`/supervisor/requests/${request.id}`}>
      <Eye className="h-4 w-4 mr-2" />
      Review
    </Link>
  </Button>
);

const emptyState = (
  <div className="text-center py-8">
    <p className="text-gray-500">No pending requests to review.</p>
  </div>
);

export default function SupervisorRequestsPage() {
  return (
    <RequestListView
      title="Review Requests"
      description="Review and approve allowance requests from your team."
      fetchFilters={(user) => ({ status: "submitted", department: user.department })}
      tableColumns={columns}
      renderCell={renderCell}
      renderActions={renderActions}
      emptyState={emptyState}
    />
  )
}
