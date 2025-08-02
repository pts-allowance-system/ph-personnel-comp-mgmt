export type UserRole = "employee" | "supervisor" | "hr" | "finance" | "admin";

export type RequestStatus = 
  | "draft"
  | "submitted"
  | "approved"
  | "hr-checked"
  | "disbursed"
  | "rejected"
  | "rejected_by_finance"
  | "approved_by_hr"
  | "processed";

export interface User {
  id: string;
  nationalId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  department?: string;
  position?: string;
  positionId?: string;
  licenseNumber?: string;
  hasSpecialOrder?: boolean;
  certifications?: string[];
  specialTasks?: string[];
  isActive: boolean;
}

export interface UserProfile extends Omit<User, "id" | "role" | "isActive"> {
  allowanceGroup?: string;
  tier?: string;
}

export enum RuleOperator {
  Equal = "equal",
  NotEqual = "notEqual",
  In = "in",
  NotIn = "notIn",
}

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

export interface AllowanceRequest {
  id: string;
  employeeId: string;
  employeeName?: string;
  status: string;
  employeeType: string;
  requestType: string;
  position?: string;
  department?: string;
  mainDuties: string;
  standardDuties: {
    operations: boolean;
    planning: boolean;
    coordination: boolean;
    service: boolean;
  };
  assignedTask?: string;
  monthlyRate: number;
  totalAmount: number;
  effectiveDate: string;
  startDate?: string;
  endDate?: string;
  totalDays?: number;
  allowanceGroup?: string;
  tier?: string;
  notes?: string;
  documents: FileUpload[];
  comments: Comment[];
  createdAt?: string;
  updatedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  approverName?: string;
}

export interface FileUpload {
  id: string;
  name: string;
  url: string;
  path: string;
  size: number;
  type: string;
  uploadedAt?: string;
}

export interface Comment {
  id: string;
  requestId: string;
  user: {
    id: string;
    name: string;
  };
  content: string;
  timestamp: string;
}

export interface Rate {
  id: string;
  allowanceGroup: string;
  tier: string;
  monthlyRate: number;
  effectiveDate: string;
  isActive: boolean;
}
