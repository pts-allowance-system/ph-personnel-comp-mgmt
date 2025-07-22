import { v4 as uuidv4 } from "uuid";
import { Database, getPool } from "../database";
import { PoolConnection } from "mysql2/promise";
import { getCurrentBangkokTimestampForDB } from "../utils/date-utils";
import { AllowanceRequest, FileUpload, Comment } from "../models";

const mapRowToRequest = async (row: any): Promise<AllowanceRequest> => {
  const documents = await RequestsDAL.getRequestDocuments(row.id);
  const comments = await RequestsDAL.getRequestComments(row.id);

  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    status: row.status,
    employeeType: row.employee_type,
    requestType: row.request_type,
    position: row.position,
    department: row.department,
    mainDuties: row.main_duties,
    standardDuties: 
      row.standard_duties 
        ? typeof row.standard_duties === 'string' 
          ? JSON.parse(row.standard_duties) 
          : row.standard_duties 
        : { operations: false, planning: false, coordination: false, service: false },
    assignedTask: row.assigned_task,
    monthlyRate: Number.parseFloat(row.monthly_rate),
    totalAmount: Number.parseFloat(row.total_amount),
    effectiveDate: row.effective_date,
    startDate: row.start_date,
    endDate: row.end_date,
    totalDays: row.total_days,
    allowanceGroup: row.allowance_group,
    tier: row.tier,
    notes: row.notes,
    documents,
    comments,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    approvedAt: row.approved_at,
    approvedBy: row.approved_by,
    approverName: row.approver_name,
  };
};

export class RequestsDAL {
  private static readonly fullSelectQuery = `
    SELECT 
      r.*, 
      CONCAT(u.firstName, ' ', u.lastName) as employee_name,
      CONCAT(approver.firstName, ' ', approver.lastName) as approver_name
    FROM allowance_requests r
    JOIN users u ON r.employee_id = u.id
    LEFT JOIN users approver ON r.approved_by = approver.id
  `;

  static async findById(id: string): Promise<AllowanceRequest | null> {
    const sql = `${this.fullSelectQuery} WHERE r.id = ?`;
    const row = await Database.queryOne<any>(sql, [id]);
    if (!row) return null;
    return mapRowToRequest(row);
  }

  static async findByUserId(userId: string, fetchAll?: boolean): Promise<AllowanceRequest[]> {
    let sql = `${this.fullSelectQuery} WHERE r.employee_id = ?`;
    if (!fetchAll) {
      sql += ` AND r.status NOT IN ('draft', 'archived')`;
    }
    sql += ` ORDER BY r.created_at DESC`;

    const rows = await Database.query<any>(sql, [userId]);
    return Promise.all(rows.map(mapRowToRequest));
  }

  static async findByStatus(status: string): Promise<AllowanceRequest[]> {
    const sql = `${this.fullSelectQuery} WHERE r.status = ? ORDER BY r.created_at DESC`;
    const rows = await Database.query<any>(sql, [status]);
    return Promise.all(rows.map(mapRowToRequest));
  }

  static async create(
    requestData: Omit<AllowanceRequest, "id" | "createdAt" | "updatedAt" | "comments" | "employeeName" | "approverName" | "approvedAt" | "approvedBy" | "dateOfRequest">
  ): Promise<string> {
    const id = uuidv4();
    const now = getCurrentBangkokTimestampForDB();

    const dataToInsert = {
      id,
      employee_id: requestData.employeeId,
      status: requestData.status,
      employee_type: requestData.employeeType,
      request_type: requestData.requestType,
      position: requestData.position,
      department: requestData.department,
      main_duties: requestData.mainDuties,
      standard_duties: JSON.stringify(requestData.standardDuties),
      assigned_task: requestData.assignedTask,
      monthly_rate: requestData.monthlyRate,
      total_amount: requestData.totalAmount,
      effective_date: requestData.effectiveDate,
      start_date: requestData.startDate,
      end_date: requestData.endDate,
      total_days: requestData.totalDays,
      allowance_group: requestData.allowanceGroup,
      tier: requestData.tier,
      notes: requestData.notes,
      created_at: now,
      updated_at: now,
    };

    await Database.insert("allowance_requests", dataToInsert);

    if (requestData.documents && requestData.documents.length > 0) {
      for (const doc of requestData.documents) {
        await this.addDocument(id, doc);
      }
    }

    return id;
  }

  static async update(
    id: string,
    updates: Partial<AllowanceRequest> & Record<string, any>
  ): Promise<boolean> {
    const { documents, ...otherUpdates } = updates;

    const pool = getPool();
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const mappedUpdates: Record<string, any> = {};
      if (otherUpdates.status) mappedUpdates.status = otherUpdates.status;
      if (otherUpdates.employeeType) mappedUpdates.employee_type = otherUpdates.employeeType;
      if (otherUpdates.requestType) mappedUpdates.request_type = otherUpdates.requestType;
      if (otherUpdates.position) mappedUpdates.position = otherUpdates.position;
      if (otherUpdates.department) mappedUpdates.department = otherUpdates.department;
      if (otherUpdates.mainDuties) mappedUpdates.main_duties = otherUpdates.mainDuties;
      if (otherUpdates.standardDuties) mappedUpdates.standard_duties = JSON.stringify(otherUpdates.standardDuties);
      if (otherUpdates.assignedTask) mappedUpdates.assigned_task = otherUpdates.assignedTask;
      if (otherUpdates.monthlyRate) mappedUpdates.monthly_rate = otherUpdates.monthlyRate;
      if (otherUpdates.totalAmount) mappedUpdates.total_amount = otherUpdates.totalAmount;
      if (otherUpdates.effectiveDate) mappedUpdates.effective_date = otherUpdates.effectiveDate;
      if (otherUpdates.startDate) mappedUpdates.start_date = otherUpdates.startDate;
      if (otherUpdates.endDate) mappedUpdates.end_date = otherUpdates.endDate;
      if (otherUpdates.totalDays) mappedUpdates.total_days = otherUpdates.totalDays;
      if (otherUpdates.allowanceGroup) mappedUpdates.allowance_group = otherUpdates.allowanceGroup;
      if (otherUpdates.tier) mappedUpdates.tier = otherUpdates.tier;
      if (otherUpdates.notes) mappedUpdates.notes = otherUpdates.notes;
      if (otherUpdates.approvedBy) mappedUpdates.approved_by = otherUpdates.approvedBy;
      if (otherUpdates.approvedAt) mappedUpdates.approved_at = otherUpdates.approvedAt;

      if (Object.keys(mappedUpdates).length > 0) {
        mappedUpdates.updated_at = getCurrentBangkokTimestampForDB();
        await Database.update("allowance_requests", mappedUpdates, { id }, connection);
      }

      if (documents !== undefined) {
        await connection.execute("DELETE FROM request_documents WHERE request_id = ?", [id]);
        if (Array.isArray(documents) && documents.length > 0) {
          for (const doc of documents) {
            await this.addDocument(id, doc, connection);
          }
        }
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      console.error("DAL Error: Failed to update request:", error);
      throw new Error("Failed to update request due to a database error.");
    } finally {
      connection.release();
    }
  }

  static async addDocument(
    requestId: string,
    document: FileUpload,
    connection?: PoolConnection
  ): Promise<void> {
    const data = {
      id: uuidv4(),
      request_id: requestId,
      file_name: document.name,
      file_url: document.url,
      file_path: document.path,
      file_size: document.size,
      file_type: document.type,
    };
    await Database.insert("request_documents", data, connection);
  }

  static async getRequestDocuments(requestId: string): Promise<FileUpload[]> {
    const sql = `SELECT * FROM request_documents WHERE request_id = ? ORDER BY uploaded_at`;
    const docs = await Database.query<any>(sql, [requestId]);
    return docs.map((doc) => ({
      id: doc.id,
      name: doc.file_name,
      url: doc.file_url,
      path: doc.file_path,
      size: doc.file_size,
      type: doc.file_type,
      uploadedAt: doc.uploaded_at,
    }));
  }

  static async addComment(
    requestId: string,
    authorId: string,
    content: string
  ): Promise<string> {
    const id = Database.generateId();
    const data = {
      id,
      request_id: requestId,
      user_id: authorId,
      message: content,
      created_at: getCurrentBangkokTimestampForDB(),
    };
    await Database.insert("request_comments", data);
    return id;
  }

  static async getRequestComments(requestId: string): Promise<Comment[]> {
    const sql = `
      SELECT c.id, c.request_id, c.user_id, c.message, c.created_at, CONCAT(u.firstName, ' ', u.lastName) as author_name
      FROM request_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.request_id = ?
      ORDER BY c.created_at
    `;
    const rows = await Database.query<any>(sql, [requestId]);
    return rows.map((row) => ({
      id: row.id,
      requestId: row.request_id,
      user: { id: row.user_id, name: row.author_name },
      content: row.message,
      timestamp: row.created_at,
    }));
  }

  static async findByDepartment(department: string): Promise<AllowanceRequest[]> {
    const sql = `${this.fullSelectQuery} WHERE u.department = ? ORDER BY r.created_at DESC`;
    const rows = await Database.query<any>(sql, [department]);
    return Promise.all(rows.map(mapRowToRequest));
  }

  static async findAllWithDetails(): Promise<AllowanceRequest[]> {
    const sql = `${this.fullSelectQuery} ORDER BY r.created_at DESC`;
    const rows = await Database.query<any>(sql);
    return Promise.all(rows.map(mapRowToRequest));
  }
}
