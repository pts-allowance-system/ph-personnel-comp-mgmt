"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import type { FileUpload } from "@/lib/models"
import Image from "next/image"
import { File, Download, Eye, ExternalLink } from "lucide-react"

interface DocumentViewerProps {
  documents: FileUpload[]
  title?: string
}

export function DocumentViewer({ documents, title = "Documents" }: DocumentViewerProps) {
  const [selectedDoc, setSelectedDoc] = useState<FileUpload | null>(null)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileTypeColor = (type: string) => {
    if (type.includes("pdf")) return "bg-red-100 text-red-800"
    if (type.includes("image")) return "bg-green-100 text-green-800"
    if (type.includes("word") || type.includes("document")) return "bg-blue-100 text-blue-800"
    return "bg-gray-100 text-gray-800"
  }

  const getFileTypeLabel = (type: string) => {
    if (type.includes("pdf")) return "PDF"
    if (type.includes("image")) return "Image"
    if (type.includes("word") || type.includes("document")) return "Word"
    return "File"
  }

  const downloadFile = async (file: FileUpload) => {
    try {
      const response = await fetch(file.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Download failed:", error)
    }
  }

  const openInNewTab = (file: FileUpload) => {
    window.open(file.url, "_blank")
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <File className="mx-auto h-12 w-12 text-gray-300 mb-4" />
        <p>No documents uploaded</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documents.map((doc) => (
          <div key={doc.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <File className="h-8 w-8 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(doc.size)}</p>
                </div>
              </div>
              <Badge className={getFileTypeColor(doc.type)}>{getFileTypeLabel(doc.type)}</Badge>
            </div>

            {doc.uploadedAt && <div className="text-xs text-gray-500 mb-3">Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</div>}

            <div className="flex space-x-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => setSelectedDoc(doc)}>
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>{selectedDoc?.name}</DialogTitle>
                  </DialogHeader>
                  <div className="flex-1 overflow-auto">
                    {selectedDoc?.type.includes("image") ? (
                      <div className="relative w-full h-[60vh]">
                        <Image
                          src={selectedDoc.url || "/placeholder.svg"}
                          alt={selectedDoc.name}
                          fill
                          style={{ objectFit: "contain" }}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                    ) : selectedDoc?.type.includes("pdf") ? (
                      <iframe src={selectedDoc.url} className="w-full h-96" title={selectedDoc.name} />
                    ) : (
                      <div className="text-center py-8">
                        <File className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                        <p className="text-gray-500">Preview not available for this file type</p>
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => selectedDoc && openInNewTab(selectedDoc)}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open in New Tab
                        </Button>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <Button variant="outline" size="sm" onClick={() => downloadFile(doc)}>
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>

              <Button variant="outline" size="sm" onClick={() => openInNewTab(doc)}>
                <ExternalLink className="h-4 w-4 mr-1" />
                Open
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
