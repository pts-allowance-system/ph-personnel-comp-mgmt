import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils/utils"

interface StatusBadgeProps {
  status: string
  className?: string
}

const statusConfig = {
  draft: { label: "Draft", variant: "secondary" as const },
  submitted: { label: "Submitted", variant: "default" as const },
  pending: { label: "Pending", variant: "default" as const },
  approved: { label: "Approved", variant: "default" as const },
  "hr-checked": { label: "HR Checked", variant: "default" as const },
  disbursed: { label: "Disbursed", variant: "default" as const },
  rejected: { label: "Rejected", variant: "destructive" as const },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft

  return (
    <Badge variant={config.variant} className={cn(className)}>
      {config.label}
    </Badge>
  )
}
