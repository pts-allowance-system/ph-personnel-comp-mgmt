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

// A value can be a string, number, boolean, or an array of those.
type RuleValue = string | number | boolean | string[] | number[];

export interface RuleCondition {
  fact: keyof User;
  operator: RuleOperator;
  value: RuleValue;
}

export interface RuleConditions {
  all?: RuleCondition[];
  any?: RuleCondition[];
}

export interface RuleOutcome {
  allowanceGroup: string;
  tier: string;
}

export interface Rule {
  id: string;
  name: string;
  description?: string;
  priority: number;
  isActive: boolean;
  conditions: RuleConditions;
  outcome: RuleOutcome;
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
  status: string;
  documents: FileUpload[];
  notes?: string;
  comments?: Comment[];
  createdAt?: string;
  updatedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  approverName?: string;
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
  allowanceGroup?: string;
  tier?: string;
}

export type UserRole = "employee" | "supervisor" | "hr" | "finance" | "admin";

export interface Comment {
  id: string;
  requestId: string;
  user: { id: string; name: string };
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
