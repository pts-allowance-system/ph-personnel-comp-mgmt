"use client"

import { RequestListView } from "@/components/requests/request-list-view"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { Plus, Eye, Edit } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { th } from "date-fns/locale"
import { formatToThb } from "@/lib/utils/currency-utils"
import type { AllowanceRequest } from "@/lib/models"

const columns = [
  { key: "group", header: "Allowance Group/Tier" },
  { key: "amount", header: "Amount" },
  { key: "status", header: "Status" },
  { key: "date", header: "Submitted" },
];

const renderCell = (request: AllowanceRequest, key: string) => {
  switch (key) {
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
  <div className="flex space-x-2">
    <Button variant="ghost" size="sm" asChild>
      <Link href={`/requests/${request.id}`}>
        <Eye className="h-4 w-4" />
      </Link>
    </Button>
    {request.status === 'draft' && (
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/requests/${request.id}/edit`}>
          <Edit className="h-4 w-4" />
        </Link>
      </Button>
    )}
  </div>
);

const emptyState = (
  <div className="text-center py-8">
    <p className="text-gray-500 mb-4">No allowance requests found.</p>
    <Button asChild>
      <Link href="/requests/new">Create your first request</Link>
    </Button>
  </div>
);

const headerButton = (
    <Button asChild>
        <Link href="/requests/new">
        <Plus className="h-4 w-4 mr-2" />
        Create New Request
        </Link>
    </Button>
);

export default function RequestsPage() {
  return (
    <RequestListView
      title="Allowance Requests"
      description="Manage your special position allowance requests."
      fetchFilters={(user) => ({ userId: user.id })}
      tableColumns={columns}
      renderCell={renderCell}
      renderActions={renderActions}
      emptyState={emptyState}
      headerButton={headerButton}
    />
  )
}
