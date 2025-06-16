import { Database } from "../database"
import { getCurrentBangkokTimestampForDB } from "../date-utils"
import type { AllowanceRequest, FileUpload, Comment } from "../types"

export class RequestsDAL {
  static async findById(id: string): Promise<AllowanceRequest | null> {
    const sql = `
      SELECT 
        r.id,
        r.employee_id,
        u.name as employee_name,
        r.group_name as group_name,
        r.tier,
        r.start_date,
        r.end_date,
        r.status,
        r.base_rate,
        r.zone_multiplier,
        r.total_amount,
        r.notes,
        r.created_at,
        r.updated_at
      FROM allowance_requests r
      JOIN users u ON r.employee_id = u.id
      WHERE r.id = ?
    `

    const request = await Database.queryOne<any>(sql, [id])
    if (!request) return null

    // Get documents
    const documents = await this.getRequestDocuments(id)

    // Get comments
    const comments = await this.getRequestComments(id)

    return {
      id: request.id,
      employeeId: request.employee_id,
      employeeName: request.employee_name,
      group: request.group_name,
      tier: request.tier,
      startDate: request.start_date,
      endDate: request.end_date,
      status: request.status,
      baseRate: Number.parseFloat(request.base_rate),
      zoneMultiplier: Number.parseFloat(request.zone_multiplier),
      totalAmount: Number.parseFloat(request.total_amount),
      documents,
      comments,
      createdAt: request.created_at,
      updatedAt: request.updated_at,
    }
  }

  static async findByUserId(userId: string): Promise<AllowanceRequest[]> {
    const sql = `
      SELECT 
        r.id,
        r.employee_id,
        u.name as employee_name,
        r.group_name,
        r.tier,
        r.start_date,
        r.end_date,
        r.status,
        r.base_rate,
        r.zone_multiplier,
        r.total_amount,
        r.created_at,
        r.updated_at
      FROM allowance_requests r
      JOIN users u ON r.employee_id = u.id
      WHERE r.employee_id = ?
      ORDER BY r.created_at DESC
    `

    const requests = await Database.query<any>(sql, [userId])

    // Get documents and comments for each request
    const requestsWithDetails = await Promise.all(
      requests.map(async (request) => {
        const documents = await this.getRequestDocuments(request.id)
        const comments = await this.getRequestComments(request.id)

        return {
          id: request.id,
          employeeId: request.employee_id,
          employeeName: request.employee_name,
          group: request.group_name,
          tier: request.tier,
          startDate: request.start_date,
          endDate: request.end_date,
          status: request.status,
          baseRate: Number.parseFloat(request.base_rate),
          zoneMultiplier: Number.parseFloat(request.zone_multiplier),
          totalAmount: Number.parseFloat(request.total_amount),
          documents,
          comments,
          createdAt: request.created_at,
          updatedAt: request.updated_at,
        }
      }),
    )

    return requestsWithDetails
  }

  static async findByStatus(status: string): Promise<AllowanceRequest[]> {
    const sql = `
      SELECT 
        r.id,
        r.employee_id,
        u.name as employee_name,
        r.group_name,
        r.tier,
        r.start_date,
        r.end_date,
        r.status,
        r.base_rate,
        r.zone_multiplier,
        r.total_amount,
        r.created_at,
        r.updated_at
      FROM allowance_requests r
      JOIN users u ON r.employee_id = u.id
      WHERE r.status = ?
      ORDER BY r.created_at DESC
    `

    const requests = await Database.query<any>(sql, [status])

    const requestsWithDetails = await Promise.all(
      requests.map(async (request) => {
        const documents = await this.getRequestDocuments(request.id)
        const comments = await this.getRequestComments(request.id)

        return {
          id: request.id,
          employeeId: request.employee_id,
          employeeName: request.employee_name,
          group: request.group_name,
          tier: request.tier,
          startDate: request.start_date,
          endDate: request.end_date,
          status: request.status,
          baseRate: Number.parseFloat(request.base_rate),
          zoneMultiplier: Number.parseFloat(request.zone_multiplier),
          totalAmount: Number.parseFloat(request.total_amount),
          documents,
          comments,
          createdAt: request.created_at,
          updatedAt: request.updated_at,
        }
      }),
    )

    return requestsWithDetails
  }

    static async create(requestData: Omit<AllowanceRequest, "id" | "createdAt" | "updatedAt">): Promise<string> {
    const id = Database.generateId()

    const now = getCurrentBangkokTimestampForDB();
    const data = {
      id,
      employee_id: requestData.employeeId,
      group_name: requestData.group,
      tier: requestData.tier,
      start_date: requestData.startDate,
      end_date: requestData.endDate,
      status: requestData.status,
      base_rate: requestData.baseRate,
      zone_multiplier: requestData.zoneMultiplier,
      total_amount: requestData.totalAmount,
      notes: requestData.notes || null,
      created_at: now,
      updated_at: now,
    }

    await Database.insert("allowance_requests", data)

    // Insert documents
    for (const doc of requestData.documents) {
      await this.addDocument(id, doc)
    }

    return id
  }

  static async update(id: string, updates: Partial<AllowanceRequest> & Record<string, any>): Promise<boolean> {
    const data: Record<string, any> = {}

    if (updates.status) data.status = updates.status
    if (updates.baseRate) data.base_rate = updates.baseRate
    if (updates.zoneMultiplier) data.zone_multiplier = updates.zoneMultiplier
    if (updates.totalAmount) data.total_amount = updates.totalAmount

    // Additional fields for finance
    if (updates.disbursementDate) data.disbursement_date = updates.disbursementDate
    if (updates.referenceNumber) data.reference_number = updates.referenceNumber

    // Additional fields for HR
    if (updates.hrOverride !== undefined) data.hr_override = updates.hrOverride

    // Store rule check results as JSON if provided
    if (updates.ruleCheckResults) {
      data.rule_check_results = JSON.stringify(updates.ruleCheckResults)
    }

    data.updated_at = getCurrentBangkokTimestampForDB()

    return await Database.update("allowance_requests", data, { id })
  }

  static async addDocument(requestId: string, document: FileUpload): Promise<void> {
    const data = {
      id: document.id || Database.generateId(),
      request_id: requestId,
      file_name: document.name,
      file_url: document.url,
      file_path: document.path,
      file_size: document.size,
      file_type: document.type,
    }

    await Database.insert("request_documents", data)
  }

  static async getRequestDocuments(requestId: string): Promise<FileUpload[]> {
    const sql = `
      SELECT id, file_name, file_url, file_path, file_size, file_type, uploaded_at
      FROM request_documents
      WHERE request_id = ?
      ORDER BY uploaded_at
    `

    const docs = await Database.query<any>(sql, [requestId])

    return docs.map((doc) => ({
      id: doc.id,
      name: doc.file_name,
      url: doc.file_url,
      path: doc.file_path,
      size: doc.file_size,
      type: doc.file_type,
      uploadedAt: doc.uploaded_at,
    }))
  }

  static async addComment(requestId: string, userId: string, message: string): Promise<void> {
    const data = {
      id: Database.generateId(),
      request_id: requestId,
      user_id: userId,
      message,
    }

    await Database.insert("request_comments", data)
  }

  static async getRequestComments(requestId: string): Promise<Comment[]> {
    const sql = `
      SELECT c.id, c.user_id, c.message, c.created_at, u.name as user_name
      FROM request_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.request_id = ?
      ORDER BY c.created_at
    `

    const comments = await Database.query<any>(sql, [requestId])

    return comments.map((comment) => ({
      id: comment.id,
      userId: comment.user_id,
      userName: comment.user_name,
      message: comment.message,
      createdAt: comment.created_at,
    }))
  }

  // Add method to get requests by department (for supervisors)
  static async findByDepartment(department: string, status = "submitted"): Promise<AllowanceRequest[]> {
    const sql = `
      SELECT 
        r.id,
        r.employee_id,
        u.name as employee_name,
        r.group_name,
        r.tier,
        r.start_date,
        r.end_date,
        r.status,
        r.base_rate,
        r.zone_multiplier,
        r.total_amount,
        r.created_at,
        r.updated_at
      FROM allowance_requests r
      JOIN users u ON r.employee_id = u.id
      WHERE u.department = ? AND r.status = ?
      ORDER BY r.created_at DESC
    `

    const requests = await Database.query<any>(sql, [department, status])

    const requestsWithDetails = await Promise.all(
      requests.map(async (request) => {
        const documents = await this.getRequestDocuments(request.id)
        const comments = await this.getRequestComments(request.id)

        return {
          id: request.id,
          employeeId: request.employee_id,
          employeeName: request.employee_name,
          group: request.group_name,
          tier: request.tier,
          startDate: request.start_date,
          endDate: request.end_date,
          status: request.status,
          baseRate: Number.parseFloat(request.base_rate),
          zoneMultiplier: Number.parseFloat(request.zone_multiplier),
          totalAmount: Number.parseFloat(request.total_amount),
          documents,
          comments,
          createdAt: request.created_at,
          updatedAt: request.updated_at,
        }
      }),
    )

    return requestsWithDetails
  }

  static async findAllWithDetails(): Promise<AllowanceRequest[]> {
    const sql = `
    SELECT 
      r.id,
      r.employee_id,
      u.name as employee_name,
      r.group_name,
      r.tier,
      r.start_date,
      r.end_date,
      r.status,
      r.base_rate,
      r.zone_multiplier,
      r.total_amount,
      r.created_at,
      r.updated_at,
      DATEDIFF(COALESCE(r.updated_at, NOW()), r.created_at) as processing_time
    FROM allowance_requests r
    JOIN users u ON r.employee_id = u.id
    ORDER BY r.created_at DESC
  `

    const requests = await Database.query<any>(sql)

    const requestsWithDetails = await Promise.all(
      requests.map(async (request) => {
        const documents = await this.getRequestDocuments(request.id)
        const comments = await this.getRequestComments(request.id)

        // Get approver information from comments
        const approverComment = comments.find((c) => c.message.includes("approved") || c.message.includes("rejected"))

        return {
          id: request.id,
          employeeId: request.employee_id,
          employeeName: request.employee_name,
          group: request.group_name,
          tier: request.tier,
          startDate: request.start_date,
          endDate: request.end_date,
          status: request.status,
          baseRate: Number.parseFloat(request.base_rate),
          zoneMultiplier: Number.parseFloat(request.zone_multiplier),
          totalAmount: Number.parseFloat(request.total_amount),
          documents,
          comments,
          createdAt: request.created_at,
          updatedAt: request.updated_at,
          approverName: approverComment?.userName,
          processingTime: request.processing_time,
        }
      }),
    )

    return requestsWithDetails
  }
}
