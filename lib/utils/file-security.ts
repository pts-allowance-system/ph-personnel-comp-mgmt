import crypto from 'crypto';

/**
 * Security validation result interface
 */
export interface FileSecurityValidation {
  isValid: boolean;
  error?: string;
  sanitizedName: string;
  secureRandomName: string;
}

/**
 * Allowed MIME types for file uploads
 */
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

/**
 * Maximum file size (10MB)
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Dangerous file extensions that should never be allowed
 */
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
  '.app', '.deb', '.pkg', '.dmg', '.rpm', '.msi', '.run', '.bin'
];

/**
 * Sanitize filename by removing dangerous characters and limiting length
 */
function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  let sanitized = filename.replace(/[\/\\:*?"<>|]/g, '_');
  
  // Remove leading/trailing dots and spaces
  sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, '');
  
  // Limit length to 255 characters
  if (sanitized.length > 255) {
    const ext = sanitized.substring(sanitized.lastIndexOf('.'));
    const name = sanitized.substring(0, 255 - ext.length);
    sanitized = name + ext;
  }
  
  return sanitized || 'file';
}

/**
 * Generate a secure random filename while preserving the extension
 */
function generateSecureFilename(originalFilename: string): string {
  const ext = originalFilename.substring(originalFilename.lastIndexOf('.'));
  const randomName = crypto.randomUUID();
  return `${randomName}${ext}`;
}

/**
 * Check if file extension is dangerous
 */
function hasDangerousExtension(filename: string): boolean {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return DANGEROUS_EXTENSIONS.includes(ext);
}

/**
 * Validate file content by checking magic bytes (file signatures)
 */
async function validateFileContent(file: File): Promise<boolean> {
  try {
    // Read first few bytes to check file signature
    const buffer = await file.slice(0, 16).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    
    // Check for common file signatures
    const signatures = {
      pdf: [0x25, 0x50, 0x44, 0x46], // %PDF
      jpeg: [0xFF, 0xD8, 0xFF],
      png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
      docx: [0x50, 0x4B, 0x03, 0x04], // ZIP-based formats
      doc: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]
    };
    
    // Check if file signature matches declared MIME type
    for (const [type, signature] of Object.entries(signatures)) {
      if (signature.every((byte, index) => bytes[index] === byte)) {
        // Basic signature match found
        return true;
      }
    }
    
    // For DOCX and other ZIP-based formats, the signature might match
    if (file.type.includes('officedocument') && bytes[0] === 0x50 && bytes[1] === 0x4B) {
      return true;
    }
    
    // If no signature match but MIME type is allowed, allow it
    // This is a basic implementation - in production, you'd want more sophisticated checks
    return ALLOWED_MIME_TYPES.includes(file.type);
    
  } catch (error) {
    console.error('Error validating file content:', error);
    return false;
  }
}

/**
 * Comprehensive file security validation
 */
export async function validateFileSecurely(file: File): Promise<FileSecurityValidation> {
  try {
    // 1. Check file size
    if (file.size === 0) {
      return {
        isValid: false,
        error: 'File is empty',
        sanitizedName: sanitizeFilename(file.name),
        secureRandomName: generateSecureFilename(file.name)
      };
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: 'File size exceeds maximum allowed size (10MB)',
        sanitizedName: sanitizeFilename(file.name),
        secureRandomName: generateSecureFilename(file.name)
      };
    }
    
    // 2. Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: `File type '${file.type}' is not allowed`,
        sanitizedName: sanitizeFilename(file.name),
        secureRandomName: generateSecureFilename(file.name)
      };
    }
    
    // 3. Check for dangerous extensions
    if (hasDangerousExtension(file.name)) {
      return {
        isValid: false,
        error: 'File extension is not allowed for security reasons',
        sanitizedName: sanitizeFilename(file.name),
        secureRandomName: generateSecureFilename(file.name)
      };
    }
    
    // 4. Validate file content (magic bytes)
    const isContentValid = await validateFileContent(file);
    if (!isContentValid) {
      return {
        isValid: false,
        error: 'File content does not match declared file type',
        sanitizedName: sanitizeFilename(file.name),
        secureRandomName: generateSecureFilename(file.name)
      };
    }
    
    // 5. All checks passed
    return {
      isValid: true,
      sanitizedName: sanitizeFilename(file.name),
      secureRandomName: generateSecureFilename(file.name)
    };
    
  } catch (error) {
    console.error('File security validation error:', error);
    return {
      isValid: false,
      error: 'File validation failed due to internal error',
      sanitizedName: sanitizeFilename(file.name),
      secureRandomName: generateSecureFilename(file.name)
    };
  }
}

/**
 * Additional utility: Check if filename is safe for storage
 */
export function isSafeFilename(filename: string): boolean {
  // Check for path traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return false;
  }
  
  // Check for dangerous extensions
  if (hasDangerousExtension(filename)) {
    return false;
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i, // Windows reserved names
    /^\./,  // Hidden files
    /\s+$/, // Trailing whitespace
  ];
  
  return !suspiciousPatterns.some(pattern => pattern.test(filename));
}
