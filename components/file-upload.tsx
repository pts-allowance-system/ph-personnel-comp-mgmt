"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { StorageService } from "@/lib/storage"
import type { FileUpload } from "@/lib/types"
import { Upload, X, File, Eye } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  files: FileUpload[]
  onFilesChange: (files: FileUpload[]) => void
  folder?: string
  maxFiles?: number
  className?: string
}

export function FileUploadComponent({
  files,
  onFilesChange,
  folder = "requests",
  maxFiles = 5,
  className,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState("")
  const [dragActive, setDragActive] = useState(false)

  const handleFiles = useCallback(
    async (fileList: FileList) => {
      if (files.length + fileList.length > maxFiles) {
        setError(`Maximum ${maxFiles} files allowed`)
        return
      }

      setUploading(true)
      setError("")
      setUploadProgress(0)

      const newFiles: FileUpload[] = []
      const totalFiles = fileList.length

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i]

        // Validate file
        const validation = StorageService.validateFile(file)
        if (!validation.valid) {
          setError(validation.error || "Invalid file")
          continue
        }

        try {
          // Upload file
          const result = await StorageService.uploadFile(file, folder)

          if (result.success && result.url && result.path) {
            newFiles.push({
              id: Date.now().toString() + i,
              name: file.name,
              url: result.url,
              path: result.path,
              size: file.size,
              type: file.type,
              uploadedAt: new Date().toISOString(),
            })
          } else {
            setError(result.error || "Upload failed")
          }
        } catch (err) {
          setError("Upload failed")
          console.error("Upload error:", err)
        }

        // Update progress
        setUploadProgress(((i + 1) / totalFiles) * 100)
      }

      if (newFiles.length > 0) {
        onFilesChange([...files, ...newFiles])
      }

      setUploading(false)
      setUploadProgress(0)
    },
    [files, onFilesChange, folder, maxFiles],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files)
      }
    },
    [handleFiles],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }, [])

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files)
      }
    },
    [handleFiles],
  )

  const removeFile = async (fileToRemove: FileUpload) => {
    // Delete from storage
    await StorageService.deleteFile(fileToRemove.path)

    // Remove from state
    onFilesChange(files.filter((file) => file.id !== fileToRemove.id))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const openFile = (file: FileUpload) => {
    window.open(file.url, "_blank")
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300",
          uploading ? "opacity-50 pointer-events-none" : "hover:border-gray-400",
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <div className="mt-4">
          <label htmlFor="file-upload" className="cursor-pointer">
            <span className="mt-2 block text-sm font-medium text-gray-900">
              {uploading ? "Uploading..." : "Upload documents"}
            </span>
            <span className="mt-1 block text-sm text-gray-500">Drag and drop files here, or click to select</span>
            <span className="mt-1 block text-xs text-gray-400">
              PDF, Word, Images (Max 10MB each, {maxFiles} files total)
            </span>
          </label>
          <input
            id="file-upload"
            name="file-upload"
            type="file"
            className="sr-only"
            multiple
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
            onChange={handleFileInput}
            disabled={uploading}
          />
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} className="w-full" />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Uploaded Files</h4>
          <div className="space-y-2">
            {files.map((file) => (
              <div key={file.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center space-x-3">
                  <File className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{file.name}</div>
                    <div className="text-xs text-gray-500">
                      {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => openFile(file)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(file)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
