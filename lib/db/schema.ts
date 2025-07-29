import {
  mysqlTable,
  char,
  varchar,
  boolean,
  json,
  datetime,
  text,
  mysqlEnum,
  decimal,
  date,
  int,
  bigint,
} from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: char('id', { length: 36 }).primaryKey(),
  nationalId: varchar('national_id', { length: 13 }).unique().notNull(),
  firstName: varchar('firstName', { length: 128 }).notNull(),
  lastName: varchar('lastName', { length: 128 }).notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: mysqlEnum('role', ['employee', 'supervisor', 'hr', 'finance', 'admin']).notNull(),
  department: varchar('department', { length: 255 }),
  position: varchar('position', { length: 255 }),
  hasSpecialOrder: boolean('hasSpecialOrder').default(false),
  certifications: json('certifications'),
  specialTasks: json('specialTasks'),
  isActive: boolean('isActive').default(true),
  createdAt: datetime('created_at').notNull().default(new Date()),
  updatedAt: datetime('updated_at').notNull(),
});

export const allowanceRates = mysqlTable('allowance_rates', {
    id: char('id', { length: 36 }).primaryKey(),
    groupName: varchar('group_name', { length: 100 }).notNull(),
    tier: varchar('tier', { length: 100 }).notNull(),
    baseRate: decimal('base_rate', { precision: 10, scale: 2 }).notNull(),
    effectiveDate: date('effective_date').notNull(),
    isActive: boolean('isActive').default(true),
    createdAt: datetime('created_at').notNull().default(new Date()),
    updatedAt: datetime('updated_at').notNull(),
});

export const allowanceRules = mysqlTable('allowance_rules', {
    id: char('id', { length: 36 }).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    priority: int('priority').notNull().default(0),
    conditions: json('conditions').notNull(),
    outcome: json('outcome').notNull(),
    isActive: boolean('isActive').default(true),
    createdAt: datetime('created_at').default(new Date()),
    updatedAt: datetime('updated_at'),
});

export const allowanceRequests = mysqlTable('allowance_requests', {
    id: char('id', { length: 36 }).primaryKey(),
    employeeId: char('employee_id', { length: 36 }).notNull(),
    status: varchar('status', { length: 50 }).default('draft'),
    createdAt: datetime('created_at').default(new Date()),
    updatedAt: datetime('updated_at'),
    employeeType: varchar('employee_type', { length: 100 }),
    requestType: varchar('request_type', { length: 100 }),
    position: varchar('position', { length: 255 }),
    department: varchar('department', { length: 255 }),
    mainDuties: text('main_duties'),
    standardDuties: json('standard_duties'),
    assignedTask: text('assigned_task'),
    monthlyRate: decimal('monthly_rate', { precision: 10, scale: 2 }),
    totalAmount: decimal('total_amount', { precision: 12, scale: 2 }),
    effectiveDate: date('effective_date'),
    startDate: date('start_date'),
    endDate: date('end_date'),
    totalDays: int('total_days'),
    allowanceGroup: varchar('allowance_group', { length: 100 }),
    tier: varchar('tier', { length: 100 }),
    notes: text('notes'),
    hrOverride: boolean('hr_override').default(false),
    ruleCheckResults: text('rule_check_results', { mode: 'long' }),
    disbursementDate: date('disbursement_date'),
    referenceNumber: varchar('reference_number', { length: 100 }),
    approvedAt: datetime('approved_at'),
    approvedBy: char('approved_by', { length: 36 }),
});

export const requestDocuments = mysqlTable('request_documents', {
    id: char('id', { length: 36 }).primaryKey(),
    requestId: char('request_id', { length: 36 }).notNull(),
    fileName: varchar('file_name', { length: 255 }).notNull(),
    fileUrl: varchar('file_url', { length: 500 }).notNull(),
    filePath: varchar('file_path', { length: 500 }).notNull(),
    fileSize: bigint('file_size', { mode: 'number' }).notNull(),
    fileType: varchar('file_type', { length: 100 }).notNull(),
    documentType: varchar('document_type', { length: 50 }).default('supporting'),
    uploadedAt: datetime('uploaded_at').default(new Date()),
});

export const requestComments = mysqlTable('request_comments', {
    id: char('id', { length: 36 }).primaryKey(),
    requestId: char('request_id', { length: 36 }).notNull(),
    userId: char('user_id', { length: 36 }).notNull(),
    message: text('message').notNull(),
    createdAt: datetime('created_at').default(new Date()),
});

export const systemRules = mysqlTable('system_rules', {
    id: char('id', { length: 36 }).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    conditions: text('conditions', { mode: 'long' }).notNull(),
    isActive: boolean('isActive').default(true),
    createdAt: datetime('created_at').default(new Date()),
    updatedAt: datetime('updated_at'),
});

export const auditLogs = mysqlTable('audit_logs', {
    id: char('id', { length: 36 }).primaryKey(),
    userId: char('user_id', { length: 36 }),
    action: varchar('action', { length: 100 }).notNull(),
    targetType: varchar('target_type', { length: 50 }).notNull(),
    targetId: char('target_id', { length: 36 }),
    metadata: text('metadata', { mode: 'long' }),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    createdAt: datetime('created_at').default(new Date()),
});
