import { db } from "@/lib/db";
import { allowanceRequests, users, requestDocuments, requestComments } from "@/lib/db/schema";
import { eq, and, desc, notInArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import type { AllowanceRequest, FileUpload, Comment } from "../models";

const mapRowToRequest = async (row: any): Promise<AllowanceRequest> => {
  const documents = await RequestsDAL.getRequestDocuments(row.id);
  const comments = await RequestsDAL.getRequestComments(row.id);

  return {
    id: row.id,
    employeeId: row.employeeId,
    employeeName: row.employeeName,
    status: row.status,
    employeeType: row.employeeType,
    requestType: row.requestType,
    position: row.position,
    department: row.department,
    mainDuties: row.mainDuties,
    standardDuties:
      row.standardDuties
        ? typeof row.standardDuties === 'string'
          ? JSON.parse(row.standardDuties)
          : row.standardDuties
        : { operations: false, planning: false, coordination: false, service: false },
    assignedTask: row.assignedTask,
    monthlyRate: row.monthlyRate ? Number(row.monthlyRate) : 0,
    totalAmount: row.totalAmount ? Number(row.totalAmount) : 0,
    effectiveDate: row.effectiveDate,
    startDate: row.startDate,
    endDate: row.endDate,
    totalDays: row.totalDays,
    allowanceGroup: row.allowanceGroup,
    tier: row.tier,
    notes: row.notes,
    documents,
    comments,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    approvedAt: row.approvedAt,
    approvedBy: row.approvedBy,
    approverName: row.approverName,
  };
};

export class RequestsDAL {
  private static getFullSelectQuery() {
    const approver = alias(users, "approver");
    return db
      .select({
        id: allowanceRequests.id,
        employeeId: allowanceRequests.employeeId,
        status: allowanceRequests.status,
        employeeType: allowanceRequests.employeeType,
        requestType: allowanceRequests.requestType,
        position: allowanceRequests.position,
        department: allowanceRequests.department,
        mainDuties: allowanceRequests.mainDuties,
        standardDuties: allowanceRequests.standardDuties,
        assignedTask: allowanceRequests.assignedTask,
        monthlyRate: allowanceRequests.monthlyRate,
        totalAmount: allowanceRequests.totalAmount,
        effectiveDate: allowanceRequests.effectiveDate,
        startDate: allowanceRequests.startDate,
        endDate: allowanceRequests.endDate,
        totalDays: allowanceRequests.totalDays,
        allowanceGroup: allowanceRequests.allowanceGroup,
        tier: allowanceRequests.tier,
        notes: allowanceRequests.notes,
        createdAt: allowanceRequests.createdAt,
        updatedAt: allowanceRequests.updatedAt,
        approvedAt: allowanceRequests.approvedAt,
        approvedBy: allowanceRequests.approvedBy,
        employeeName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
        approverName: sql<string>`CONCAT(${approver.firstName}, ' ', ${approver.lastName})`,
      })
      .from(allowanceRequests)
      .leftJoin(users, eq(allowanceRequests.employeeId, users.id))
      .leftJoin(approver, eq(allowanceRequests.approvedBy, approver.id));
  }

  static async findById(id: string): Promise<AllowanceRequest | null> {
    const rows = await this.getFullSelectQuery().where(eq(allowanceRequests.id, id));
    if (rows.length === 0) return null;
    return mapRowToRequest(rows[0]);
  }

  static async findByUserId(userId: string, fetchAll?: boolean): Promise<AllowanceRequest[]> {
    const conditions = [eq(allowanceRequests.employeeId, userId)];
    if (!fetchAll) {
      conditions.push(notInArray(allowanceRequests.status, ['draft', 'archived']));
    }
    const query = this.getFullSelectQuery().where(and(...conditions));
    const rows = await query.orderBy(desc(allowanceRequests.createdAt));
    return Promise.all(rows.map(mapRowToRequest));
  }

  static async findByStatus(status: string): Promise<AllowanceRequest[]> {
    const rows = await this.getFullSelectQuery()
      .where(eq(allowanceRequests.status, status))
      .orderBy(desc(allowanceRequests.createdAt));
    return Promise.all(rows.map(mapRowToRequest));
  }

  static async create(
    requestData: Omit<AllowanceRequest, "id" | "createdAt" | "updatedAt" | "comments" | "documents" | "employeeName" | "approverName" | "approvedAt" | "approvedBy">
  ): Promise<string> {
    const id = crypto.randomUUID();
    const dataToInsert = {
      ...requestData,
      id,
      effectiveDate: new Date(requestData.effectiveDate),
      startDate: requestData.startDate ? new Date(requestData.startDate) : null,
      endDate: requestData.endDate ? new Date(requestData.endDate) : null,
      monthlyRate: requestData.monthlyRate.toString(),
      totalAmount: requestData.totalAmount.toString(),
      standardDuties: JSON.stringify(requestData.standardDuties),
    };
    await db.insert(allowanceRequests).values(dataToInsert);
    return id;
  }

  static async update(
    id: string,
    updates: Partial<Omit<AllowanceRequest, "documents">>
  ): Promise<boolean> {
    const { standardDuties, effectiveDate, startDate, endDate, monthlyRate, totalAmount, ...otherUpdates } = updates;
    const dataToUpdate: Record<string, any> = { ...otherUpdates };

    if (standardDuties) {
      dataToUpdate.standardDuties = JSON.stringify(standardDuties);
    }
    if (effectiveDate) {
      dataToUpdate.effectiveDate = new Date(effectiveDate);
    }
    if (startDate) {
      dataToUpdate.startDate = new Date(startDate);
    }
    if (endDate) {
      dataToUpdate.endDate = new Date(endDate);
    }
    if (monthlyRate) {
        dataToUpdate.monthlyRate = monthlyRate.toString();
    }
    if (totalAmount) {
        dataToUpdate.totalAmount = totalAmount.toString();
    }

    if (Object.keys(dataToUpdate).length === 0) return true;

    const result = await db
      .update(allowanceRequests)
      .set(dataToUpdate)
      .where(eq(allowanceRequests.id, id));
    return result[0].affectedRows > 0;
  }

  static async addDocument(
    requestId: string,
    document: FileUpload
  ): Promise<void> {
    await db.insert(requestDocuments).values({
      id: crypto.randomUUID(),
      requestId: requestId,
      fileName: document.name,
      fileUrl: document.url,
      filePath: document.path,
      fileSize: document.size,
      fileType: document.type,
    });
  }

  static async getRequestDocuments(requestId: string): Promise<FileUpload[]> {
    const docs = await db
      .select()
      .from(requestDocuments)
      .where(eq(requestDocuments.requestId, requestId))
      .orderBy(desc(requestDocuments.uploadedAt));
    return docs.map((doc) => ({
      id: doc.id,
      name: doc.fileName,
      url: doc.fileUrl,
      path: doc.filePath,
      size: doc.fileSize,
      type: doc.fileType,
    }));
  }

  static async addComment(
    requestId: string,
    authorId: string,
    content: string
  ): Promise<string> {
    const id = crypto.randomUUID();
    await db.insert(requestComments).values({
      id,
      requestId: requestId,
      userId: authorId,
      message: content,
    });
    return id;
  }

  static async getRequestComments(requestId: string): Promise<Comment[]> {
    const rows = await db
      .select({
        id: requestComments.id,
        requestId: requestComments.requestId,
        userId: requestComments.userId,
        message: requestComments.message,
        createdAt: requestComments.createdAt,
        authorName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
      })
      .from(requestComments)
      .leftJoin(users, eq(requestComments.userId, users.id))
      .where(eq(requestComments.requestId, requestId))
      .orderBy(desc(requestComments.createdAt));

    return rows.map((row) => ({
      id: row.id,
      requestId: row.requestId,
      user: { id: row.userId, name: row.authorName },
      content: row.message,
      timestamp: row.createdAt?.toISOString() || '',
    }));
  }

  static async findByDepartment(department: string): Promise<AllowanceRequest[]> {
    const rows = await this.getFullSelectQuery()
      .where(eq(users.department, department))
      .orderBy(desc(allowanceRequests.createdAt));
    return Promise.all(rows.map(mapRowToRequest));
  }

  static async findAllWithDetails(): Promise<AllowanceRequest[]> {
    const rows = await this.getFullSelectQuery().orderBy(desc(allowanceRequests.createdAt));
    return Promise.all(rows.map(mapRowToRequest));
  }
}
