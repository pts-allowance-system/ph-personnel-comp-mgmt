export interface User {
  id: string
  nationalId: string
  firstName: string
  lastName: string
  email: string
  role: "employee" | "supervisor" | "hr" | "finance" | "admin"
  department?: string
  position?: string
  positionId?: string
  licenseNumber?: string
  hasSpecialOrder?: boolean;
  certifications?: string[];
  specialTasks?: string[];
  specializations?: string[]
  isActive: boolean
}

export enum RuleOperator {
  Equal = 'equal',
  NotEqual = 'notEqual',
  In = 'in',
  NotIn = 'notIn',
}

export interface RuleCondition {
  fact: keyof User;
  operator: RuleOperator;
  value: any;
}

export interface RuleEvent {
  type: string;
  params: {
    group: string;
    tier: string;
  };
}

export interface Rule {
  id: string;
  name: string;
  description?: string;
  priority: number;
  isActive: boolean;
  conditions: any;
  outcome: any;
}

export interface FileUpload {
  id: string
  name: string
  url: string
  path: string
  size: number
  type: string
  uploadedAt: string
}

export interface AllowanceRequest {
  id: string;
  firstName?: string;
  lastName?: string;
  employeeId: string;
  employeeName: string;
  status: string; // Changed from RequestStatus enum
  documents: FileUpload[];
  notes?: string;
  comments?: Comment[];
  createdAt?: string;
  updatedAt?: string;

  // Approval tracking
  approvedAt?: string;
  approvedBy?: string;
  approverName?: string;

  // New form fields
  employeeType: string;
  requestType: string;
  position: string;
  department: string;
  mainDuties: string;
  standardDuties: {
    operations: boolean;
    planning: boolean;
    coordination: boolean;
    service: boolean;
  };
  assignedTask: string;
  monthlyRate: number;
  totalAmount: number;
  effectiveDate: string;
  startDate?: string;
  endDate?: string;
  totalDays?: number;
  allowanceGroup?: string; // Corrected from 'group'
  tier?: string;
}

export type UserRole = "employee" | "supervisor" | "hr" | "finance" | "admin";

export interface Comment {
  id: string;
  requestId: string;
  user: { id: string; name: string }; // Changed from 'author' to 'user' for consistency
  timestamp: string;
  content: string;
  message?: string;
}

export interface Rate {
  id: string
  allowanceGroup: string
  tier: string
  monthlyRate: number
  effectiveDate: string
  isActive: boolean
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  position: string | null;
  department: string | null;
  allowanceGroup: string | null;
  tier: string | null;
  nationalId: string | null;
  positionId: string | null;
  licenseNumber: string | null;
  specialTasks?: string[];
}
