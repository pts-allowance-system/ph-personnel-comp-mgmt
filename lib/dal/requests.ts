import { v4 as uuidv4 } from "uuid"
import { Database, getPool } from "../database"
import { PoolConnection } from "mysql2/promise"
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
    const { documents, ...otherUpdates } = updates

    const pool = getPool()
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      // 1. Update the main request table
      const mappedUpdates: Record<string, any> = {}
      if (otherUpdates.group) mappedUpdates.group_name = otherUpdates.group
      if (otherUpdates.tier) mappedUpdates.tier = otherUpdates.tier
      if (otherUpdates.startDate) mappedUpdates.start_date = otherUpdates.startDate
      if (otherUpdates.endDate) mappedUpdates.end_date = otherUpdates.endDate
      if (otherUpdates.status) mappedUpdates.status = otherUpdates.status
      if (otherUpdates.baseRate) mappedUpdates.base_rate = otherUpdates.baseRate
      if (otherUpdates.zoneMultiplier) mappedUpdates.zone_multiplier = otherUpdates.zoneMultiplier
      if (otherUpdates.totalAmount) mappedUpdates.total_amount = otherUpdates.totalAmount
      if (otherUpdates.notes) mappedUpdates.notes = otherUpdates.notes

      // Always update the `updated_at` timestamp if there are other changes
      if (Object.keys(mappedUpdates).length > 0) {
        mappedUpdates.updated_at = getCurrentBangkokTimestampForDB()
        await Database.update("allowance_requests", mappedUpdates, { id }, connection)
      }

      // 2. Handle documents if they are part of the update
      if (documents !== undefined) {
        // First, delete all existing documents for this request
        await connection.execute("DELETE FROM request_documents WHERE request_id = ?", [id])

        // Then, add the new documents
        if (Array.isArray(documents) && documents.length > 0) {
          const docInsertSql = "INSERT INTO request_documents (request_id, file_name, file_url, uploaded_at) VALUES ?"
          const docValues = documents.map((doc: FileUpload) => [
            id,
            doc.name,
            doc.url,
            getCurrentBangkokTimestampForDB(),
          ])
          await connection.query(docInsertSql, [docValues])
        }
      }

      await connection.commit()
      return true
    } catch (error) {
      await connection.rollback()
      console.error("DAL Error: Failed to update request:", error)
      // Re-throw the error so the API layer can handle it
      throw new Error("Failed to update request due to a database error.")
    } finally {
      if (connection) {
        connection.release()
      }
    }
  }

  static async addDocument(requestId: string, document: FileUpload): Promise<void> {
    const data = {
      id: uuidv4(),
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
