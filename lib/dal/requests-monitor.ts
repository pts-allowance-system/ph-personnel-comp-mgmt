import { RequestsDAL } from './requests';
import { withQueryPerformance } from '../utils/performance-monitor';
import type { FileUpload } from '../models';

/**
 * Performance-monitored version of the RequestsDAL
 * 
 * This wrapper adds performance monitoring to all RequestsDAL methods
 * without modifying the original implementation.
 */
export const MonitoredRequestsDAL = {
  /**
   * Find all requests with optional filtering criteria
   */
  findAllWithDetails: (params: Parameters<typeof RequestsDAL.findAllWithDetails>[0]) => {
    return withQueryPerformance(
      () => RequestsDAL.findAllWithDetails(params),
      'RequestsDAL.findAllWithDetails',
      { queryParams: params }
    );
  },

  /**
   * Find a specific request by ID
   */
  findById: (id: string) => {
    return withQueryPerformance(
      () => RequestsDAL.findById(id),
      'RequestsDAL.findById',
      { queryParams: { id } }
    );
  },

  /**
   * Create a new request
   */
  create: (data: Parameters<typeof RequestsDAL.create>[0]) => {
    return withQueryPerformance(
      () => RequestsDAL.create(data),
      'RequestsDAL.create',
      {}
    );
  },

  /**
   * Update an existing request
   */
  update: (id: string, data: Parameters<typeof RequestsDAL.update>[1]) => {
    return withQueryPerformance(
      () => RequestsDAL.update(id, data),
      'RequestsDAL.update',
      { queryParams: { id } }
    );
  },

  /**
   * Find all comments for a specific request
   */
  getRequestComments: (requestId: string) => {
    return withQueryPerformance(
      () => RequestsDAL.getRequestComments(requestId),
      'RequestsDAL.getRequestComments',
      { queryParams: { requestId } }
    );
  },

  /**
   * Find all documents for a specific request
   */
  getRequestDocuments: (requestId: string) => {
    return withQueryPerformance(
      () => RequestsDAL.getRequestDocuments(requestId),
      'RequestsDAL.getRequestDocuments',
      { queryParams: { requestId } }
    );
  },

  /**
   * Add a comment to a request
   */
  addComment: (requestId: string, authorId: string, content: string) => {
    return withQueryPerformance(
      () => RequestsDAL.addComment(requestId, authorId, content),
      'RequestsDAL.addComment',
      { queryParams: { requestId } }
    );
  },

  /**
   * Add a document to a request
   */
  addDocument: (requestId: string, document: FileUpload) => {
    return withQueryPerformance(
      () => RequestsDAL.addDocument(requestId, document),
      'RequestsDAL.addDocument',
      { queryParams: { requestId } }
    );
  }
};
