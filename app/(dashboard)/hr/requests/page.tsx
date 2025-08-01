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
  { key: "position", header: "Position" },
  { key: "group", header: "Group/Tier" },
  { key: "amount", header: "Amount" },
  { key: "status", header: "Status" },
  { key: "date", header: "Submitted" },
];

const renderCell = (request: AllowanceRequest, key: string) => {
  switch (key) {
    case "employee":
      return request.employeeName;
    case "position":
      return request.position;
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
    <Link href={`/hr/requests/${request.id}`}>
      <Eye className="h-4 w-4 mr-2" />
      Review
    </Link>
  </Button>
);

const emptyState = (
  <div className="text-center py-8">
    <p className="text-gray-500">No requests pending HR review.</p>
  </div>
);

export default function HrRequestsPage() {
  return (
    <RequestListView
      title="HR Review"
      description="Review approved requests for rule compliance."
      fetchFilters={() => ({ status: "approved_by_supervisor" })}
      tableColumns={columns}
      renderCell={renderCell}
      renderActions={renderActions}
      emptyState={emptyState}
    />
  )
}
