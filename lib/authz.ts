import type { User, AllowanceRequest, UserRole } from "@/lib/models";

// Define the possible statuses for a request
export type RequestStatus =
  | 'draft'
  | 'submitted'
  | 'approved_by_supervisor'
  | 'rejected_by_supervisor'
  | 'approved_by_hr'
  | 'rejected_by_hr'
  | 'processed'
  | 'rejected_by_finance'
  | 'archived';

// Define the transition rules for the workflow state machine
const transitions: Record<UserRole, Partial<Record<RequestStatus, RequestStatus[]>>> = {
  employee: {
    draft: ['submitted', 'archived'],
  },
  supervisor: {
    submitted: ['approved_by_supervisor', 'rejected_by_supervisor'],
  },
  hr: {
    approved_by_supervisor: ['approved_by_hr', 'rejected_by_hr'],
    rejected_by_supervisor: ['archived'],
  },
  finance: {
    approved_by_hr: ['processed', 'rejected_by_finance'],
    rejected_by_hr: ['archived'],
  },
  admin: {
    draft: ['submitted', 'archived'],
    submitted: ['approved_by_supervisor', 'rejected_by_supervisor', 'archived'],
    approved_by_supervisor: ['approved_by_hr', 'rejected_by_hr', 'archived'],
    rejected_by_supervisor: ['archived', 'submitted'],
    approved_by_hr: ['processed', 'rejected_by_finance', 'archived'],
    rejected_by_hr: ['archived', 'submitted'],
    processed: ['archived'],
    rejected_by_finance: ['archived'],
  },
};

/**
 * Checks if a user can transition a request from its current status to a new status.
 */
export function canTransition(role: UserRole, currentStatus: RequestStatus, nextStatus: RequestStatus): boolean {
  if (!role || !currentStatus || !nextStatus) {
    return false;
  }
  const allowedTransitions = transitions[role]?.[currentStatus];
  if (!allowedTransitions) {
    return false;
  }
  return allowedTransitions.includes(nextStatus);
}

/**
 * Checks if a user has permission to view a specific request.
 */
export function canViewRequest(user: User, request: AllowanceRequest): boolean {
  if (!user || !request) return false;

  switch (user.role) {
    case 'admin':
      return true; // Admins can see everything
    case 'employee':
      return user.id === request.employeeId; // Employees can only see their own requests
    case 'supervisor':
      // Supervisors can see requests from their own department
      return user.department === request.department;
    case 'hr':
      // HR can see requests that have been submitted (not drafts)
      return request.status !== 'draft';
    case 'finance':
      // Finance can see requests that have been approved by HR
      return request.status === 'approved_by_hr' || request.status === 'processed' || request.status === 'rejected_by_finance';
    default:
      return false;
  }
}
