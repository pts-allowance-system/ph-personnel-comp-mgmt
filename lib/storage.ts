import { createClient } from "@supabase/supabase-js"

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Only create client if we have real credentials
let supabase: any = null
if (supabaseUrl && supabaseAnonKey && supabaseUrl !== "https://demo.supabase.co" && supabaseAnonKey !== "demo-key") {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
}

// Storage bucket name
export const STORAGE_BUCKET = "pts-documents"

// File upload utilities
export interface UploadResult {
  success: boolean
  url?: string
  path?: string
  error?: string
}

export class StorageService {
  static async uploadFile(file: File, folder = "general"): Promise<UploadResult> {
    try {
      // Check if Supabase is configured
      if (!supabase) {
        return {
          success: false,
          error: "File storage not configured. Please set up Supabase credentials.",
        }
      }

      // Generate unique filename
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const fileExtension = file.name.split(".").pop()
      const fileName = `${timestamp}-${randomString}.${fileExtension}`
      const filePath = `${folder}/${fileName}`

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (error) {
        console.error("Upload error:", error)
        return { success: false, error: error.message }
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath)

      return {
        success: true,
        url: urlData.publicUrl,
        path: filePath,
      }
    } catch (error) {
      console.error("Upload error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      }
    }
  }

  static async deleteFile(filePath: string): Promise<boolean> {
    try {
      if (!supabase) {
        console.warn("File storage not configured")
        return false
      }

      const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([filePath])

      if (error) {
        console.error("Delete error:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Delete error:", error)
      return false
    }
  }

  static async getSignedUrl(filePath: string, expiresIn = 3600): Promise<string | null> {
    try {
      if (!supabase) {
        return null
      }

      const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(filePath, expiresIn)

      if (error) {
        console.error("Signed URL error:", error)
        return null
      }

      return data.signedUrl
    } catch (error) {
      console.error("Signed URL error:", error)
      return null
    }
  }

  static getPublicUrl(filePath: string): string {
    if (!supabase) {
      return "/placeholder.svg?height=400&width=600"
    }

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath)
    return data.publicUrl
  }

  static validateFile(file: File): { valid: boolean; error?: string } {
    // File size limit: 10MB
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return { valid: false, error: "File size must be less than 10MB" }
    }

    // Allowed file types
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: "File type not allowed. Please upload PDF, Word, or image files.",
      }
    }

    return { valid: true }
  }

  static isConfigured(): boolean {
    return supabase !== null
  }
}
