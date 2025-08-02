import { z } from 'zod';

// Schema for creating a new user
export const createUserSchema = z.object({
  nationalId: z.string().min(13).max(13),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["employee", "supervisor", "hr", "finance", "admin"]),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  department: z.string().optional(),
  position: z.string().optional(),
});

// Schema for creating a new rate
export const createRateSchema = z.object({
  allowanceGroup: z.string().min(1, "Allowance group is required"),
  tier: z.string().min(1, "Tier is required"),
  monthlyRate: z.number().positive("Monthly rate must be a positive number"),
  effectiveDate: z.string().datetime("Invalid date format"),
});

// Schema for updating a request
// This is likely for changing status or adding comments, so most fields are optional.
export const updateRequestSchema = z.object({
  status: z.string().optional(),
  notes: z.string().optional(),
  comments: z.array(z.object({
    content: z.string(),
  })).optional(),
});

// Schema for updating a user
export const updateUserSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  role: z.enum(["employee", "supervisor", "hr", "finance", "admin"]).optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Enum for request statuses to be used in schemas
export const RequestStatusEnum = z.enum([
  'draft',
  'submitted',
  'approved',
  'rejected',
  'hr-checked',
  'disbursed',
  'cancelled',
]);
