import { NextResponse } from "next/server";
import { z } from "zod";
import { RequestsDAL } from "@/lib/dal/requests";
import { withAuthorization, NextRequestWithAuth } from "@/lib/utils/authorization";
import { RouteContext } from "@/lib/utils/validation";
import { handleApiError, ApiError } from "@/lib/utils/error-handler";
import { StorageService } from "@/lib/utils/storage";
import cache from "@/lib/utils/cache";
import type { FileUpload } from "@/lib/models";
import { validateFileSecurely } from "@/lib/utils/file-security";

// Security constants for file validation
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

const fileSchema = z.custom<File>((val) => val instanceof File, "Please upload a file");

// Zod schema for file validation, providing immediate feedback
const uploadValidationSchema = z.object({
  file: fileSchema
    .refine((file) => file.size > 0, 'File cannot be empty.')
    .refine((file) => file.size <= MAX_FILE_SIZE, `File is too large. Max size is 10MB.`)
    .refine((file) => ALLOWED_MIME_TYPES.includes(file.type), 'Invalid file type. Only PDF, Word, JPEG, and PNG files are allowed.')
});

async function postHandler(
  request: NextRequestWithAuth, 
  { params }: RouteContext<{ id: string }>
) {
  try {
    const { id } = params;
    const { user } = request;

    // 1. Authorization: Check if user can upload to this request
    const currentRequest = await RequestsDAL.findById(id);
    if (!currentRequest) {
      throw new ApiError(404, "Request not found");
    }
    if (currentRequest.employeeId !== user.id) {
      throw new ApiError(403, "You can only upload documents to your own requests.");
    }
    if (currentRequest.status !== 'draft') {
      throw new ApiError(403, "Documents can only be added to requests in draft status.");
    }

    // 2. Parse and Validate File
    const formData = await request.formData();
    const file = formData.get('file');
    const validation = uploadValidationSchema.safeParse({ file });

    if (!validation.success) {
      const errorMessage = validation.error.format().file?._errors[0] || 'Invalid file';
      throw new ApiError(400, errorMessage);
    }
    const validatedFile = validation.data.file;
    
    // 2.5 Enhanced Security Validation - Content verification and filename sanitization
    const securityValidation = await validateFileSecurely(validatedFile);
    if (!securityValidation.isValid) {
      console.error('File security validation failed:', securityValidation.error);
      throw new ApiError(400, `File validation failed: ${securityValidation.error || 'Security check failed'}`);
    }
    
    // Log file security validation for audit purposes
    console.log(`[SECURITY] File upload validated for request ${id} - Original: ${validatedFile.name}, Sanitized: ${securityValidation.sanitizedName}`);

    // 3. Upload to Storage Service
    const uploadResult = await StorageService.uploadFile(validatedFile, `requests/${id}`);
    if (!uploadResult.success || !uploadResult.url) {
      throw new ApiError(500, `Failed to upload file: ${uploadResult.error || 'Unknown error'}`);
    }

    // 4. Create FileUpload object and save to DB
    const fileUpload: FileUpload = {
      id: crypto.randomUUID(),
      name: validatedFile.name,
      path: uploadResult.path || `requests/${id}/${validatedFile.name}`,
      type: validatedFile.type,
      size: validatedFile.size,
      url: uploadResult.url,
      uploadedAt: new Date().toISOString()
    };
    await RequestsDAL.addDocument(id, fileUpload);

    // 5. Invalidate Cache
    cache.invalidateRequestCache(id);

    return NextResponse.json({
      success: true,
      message: "Document uploaded successfully",
      document: {
        id: fileUpload.id,
        filename: fileUpload.name,
        size: fileUpload.size,
        mimeType: fileUpload.type,
        url: fileUpload.url,
      }
    });

  } catch (error) {
    return handleApiError(error);
  }
}

export const POST = withAuthorization([], postHandler);
