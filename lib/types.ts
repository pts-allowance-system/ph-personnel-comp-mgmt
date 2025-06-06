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

export interface AllowanceRequest {
  id: string
  employeeId: string
  employeeName: string
  group: string
  tier: string
  startDate: string
  endDate: string
  status: "draft" | "submitted" | "approved" | "hr-checked" | "disbursed" | "rejected"
  baseRate: number
  zoneMultiplier: number
  totalAmount: number
  documents: FileUpload[] // Changed from string[] to FileUpload[]
  comments: Comment[]
  createdAt: string
  updatedAt: string
}

export interface Comment {
  id: string
  userId: string
  userName: string
  message: string
  createdAt: string
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
