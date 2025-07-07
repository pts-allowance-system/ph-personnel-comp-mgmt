export interface User {
  id: string
  nationalId: string
  name: string
  email: string
  role: "employee" | "supervisor" | "hr" | "finance" | "admin"
  department?: string
  position?: string
  isActive: boolean
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

export enum RequestStatus {
  Draft = "draft",
  Submitted = "submitted",
  Processing = "processing",
  Approved = "approved",
  Rejected = "rejected",
}

export interface AllowanceRequest {
  id: string
  employeeId: string
  employeeName: string
  status: RequestStatus
  documents: FileUpload[]
  notes?: string
  comments?: Comment[]
  createdAt?: string
  updatedAt?: string

  // New form fields
  employeeType: string
  requestType: string
  position: string
  department: string
  mainDuties: string
  standardDuties: {
    operations: boolean
    planning: boolean
    coordination: boolean
    service: boolean
  }
  assignedTask: string
  monthlyRate: number 
  totalAmount: number 
  effectiveDate: string
  startDate?: string
  endDate?: string
  totalDays?: number
  group?: string
  tier?: string
}

export interface Comment {
  id: string
  requestId: string 
  author: string
  timestamp: string
  content: string
}

export interface Rate {
  id: string
  group: string
  tier: string
  baseRate: number
  effectiveDate: string
  isActive: boolean
}

export interface Rule {
  id: string
  name: string
  description: string
  conditions: any
  isActive: boolean
}
