import { db } from "@/lib/db";
import { allowanceRequests, users, requestDocuments, requestComments } from "@/lib/db/schema";
import { eq, and, desc, inArray, notInArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import type { AllowanceRequest, FileUpload, Comment, UserProfile as User } from "../models";
import { InferSelectModel } from "drizzle-orm";

// Define proper types using Drizzle ORM inference
type AllowanceRequestRow = InferSelectModel<typeof allowanceRequests>;
type UserRow = InferSelectModel<typeof users>;

// Extend the row type for joined queries that include user data
interface AllowanceRequestWithUserRow extends AllowanceRequestRow {
  employeeName?: string;
  approverName?: string;
}

// New helper method to efficiently map relations for lists
export class RequestsDAL {
  private static getFullSelectQuery() {
    const approver = alias(users, "approver");
    return db
      .select({
        id: allowanceRequests.id,
        employeeId: allowanceRequests.employeeId,
        status: allowanceRequests.status,
        createdAt: allowanceRequests.createdAt,
        updatedAt: allowanceRequests.updatedAt,
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
        hrOverride: allowanceRequests.hrOverride,
        ruleCheckResults: allowanceRequests.ruleCheckResults,
        disbursementDate: allowanceRequests.disbursementDate,
        referenceNumber: allowanceRequests.referenceNumber,
        approvedAt: allowanceRequests.approvedAt,
        approvedBy: allowanceRequests.approvedBy,
        employeeName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
        approverName: sql<string>`CONCAT(${approver.firstName}, ' ', ${approver.lastName})`,
      })
      .from(allowanceRequests)
      .leftJoin(users, eq(allowanceRequests.employeeId, users.id))
      .leftJoin(approver, eq(allowanceRequests.approvedBy, approver.id));
  }

  private static async _mapRequestsWithRelations(rows: AllowanceRequestWithUserRow[]): Promise<AllowanceRequest[]> {
    if (rows.length === 0) return [];

    const requestIds = rows.map(r => r.id);

    // Fetch all documents and comments for the given request IDs in single queries
    const allDocuments = await db.select().from(requestDocuments).where(inArray(requestDocuments.requestId, requestIds));
    const allCommentsData = await db
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
      .where(inArray(requestComments.requestId, requestIds))
      .orderBy(desc(requestComments.createdAt));

    // Group documents and comments by request ID for efficient mapping
    const documentsMap = allDocuments.reduce((acc, doc) => {
      if (!acc[doc.requestId]) acc[doc.requestId] = [];
      acc[doc.requestId].push({
        id: doc.id,
        name: doc.fileName,
        url: doc.fileUrl,
        path: doc.filePath,
        size: doc.fileSize,
        type: doc.fileType,
      });
      return acc;
    }, {} as Record<string, FileUpload[]>);

    const commentsMap = allCommentsData.reduce((acc, comment) => {
      if (!acc[comment.requestId]) acc[comment.requestId] = [];
      acc[comment.requestId].push({
        id: comment.id,
        requestId: comment.requestId,
        user: { id: comment.userId, name: comment.authorName || 'Unknown' },
        content: comment.message,
        timestamp: comment.createdAt?.toISOString() || '',
      });
      return acc;
    }, {} as Record<string, Comment[]>);

    // Map the rows to the final AllowanceRequest structure
    return rows.map((row) => ({
      ...row,
      // Ensure all nullable fields are converted to their correct types
      employeeType: row.employeeType || '', // required string
      requestType: row.requestType || '', // required string
      position: row.position || undefined, // optional string
      department: row.department || undefined, // optional string
      assignedTask: row.assignedTask || undefined, // optional string
      allowanceGroup: row.allowanceGroup || undefined, // optional string
      tier: row.tier || undefined, // optional string
      notes: row.notes || undefined, // optional string
      approvedBy: row.approvedBy || undefined, // optional string

      // Handle status and other transformations
      status: row.status || 'DRAFT', // required string
      documents: documentsMap[row.id] || [],
      comments: commentsMap[row.id] || [],
      standardDuties: typeof row.standardDuties === 'string' ? JSON.parse(row.standardDuties) : row.standardDuties || {},
      monthlyRate: row.monthlyRate ? parseFloat(row.monthlyRate) : 0,
      totalAmount: row.totalAmount ? parseFloat(row.totalAmount) : 0,
      effectiveDate: row.effectiveDate ? new Date(row.effectiveDate).toISOString() : new Date().toISOString(),
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : undefined,
      updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : undefined,
      approvedAt: row.approvedAt ? new Date(row.approvedAt).toISOString() : undefined,
      startDate: row.startDate ? new Date(row.startDate).toISOString() : undefined,
      endDate: row.endDate ? new Date(row.endDate).toISOString() : undefined,
    }));
  }

  static async findById(id: string): Promise<AllowanceRequest | null> {
    const rows = await this.getFullSelectQuery().where(eq(allowanceRequests.id, id));
    if (rows.length === 0) return null;
    const results = await this._mapRequestsWithRelations(rows as AllowanceRequestWithUserRow[]);
    return results[0];
  }

  static async findByUserId(userId: string, fetchAll?: boolean): Promise<AllowanceRequest[]> {
    const conditions = [eq(allowanceRequests.employeeId, userId)];
    if (!fetchAll) {
      conditions.push(notInArray(allowanceRequests.status, ['draft', 'archived']));
    }
    const query = this.getFullSelectQuery().where(and(...conditions));
    const rows = await query.orderBy(desc(allowanceRequests.createdAt));
    return this._mapRequestsWithRelations(rows as AllowanceRequestWithUserRow[]);
  }

  static async findByStatus(status: string): Promise<AllowanceRequest[]> {
    const rows = await this.getFullSelectQuery()
      .where(eq(allowanceRequests.status, status))
      .orderBy(desc(allowanceRequests.createdAt));
    return this._mapRequestsWithRelations(rows as AllowanceRequestWithUserRow[]);
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
      user: { id: row.userId, name: row.authorName || 'Unknown' },
      content: row.message,
      timestamp: row.createdAt?.toISOString() || '',
    }));
  }

  static async findByDepartment(department: string): Promise<AllowanceRequest[]> {
    const rows = await this.getFullSelectQuery()
      .where(eq(users.department, department))
      .orderBy(desc(allowanceRequests.createdAt));
    return this._mapRequestsWithRelations(rows as AllowanceRequestWithUserRow[]);
  }

  static async findPendingHrReview(): Promise<AllowanceRequest[]> {
    const rows = await this.getFullSelectQuery()
      .where(eq(allowanceRequests.status, "approved"))
      .orderBy(desc(allowanceRequests.createdAt));
    return this._mapRequestsWithRelations(rows as AllowanceRequestWithUserRow[]);
  }

  static async findAllWithDetails(): Promise<AllowanceRequest[]> {
    const rows = await this.getFullSelectQuery().orderBy(desc(allowanceRequests.createdAt));
    return this._mapRequestsWithRelations(rows as AllowanceRequestWithUserRow[]);
  }
}
