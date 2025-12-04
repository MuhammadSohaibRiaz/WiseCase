"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, X } from "lucide-react"
import Image from "next/image"

interface FileUploadProps {
  onFileSelect: (file: File) => void
  accept?: string
  maxSize?: number // in MB
  preview?: boolean
  currentImageUrl?: string
}

export function FileUpload({
  onFileSelect,
  accept = "image/*",
  maxSize = 5,
  preview = true,
  currentImageUrl,
}: FileUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`)
      return
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file")
      return
    }

    // Create preview
    if (preview) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }

    onFileSelect(file)
  }

  const handleClear = () => {
    setPreviewUrl(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-3">
      <div
        onClick={() => fileInputRef.current?.click()}
        className="relative border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:border-primary hover:bg-accent transition-colors"
      >
        <input ref={fileInputRef} type="file" accept={accept} onChange={handleFileChange} className="hidden" />

        {previewUrl ? (
          <div className="relative w-32 h-32 mx-auto">
            <Image src={previewUrl || "/placeholder.svg"} alt="Preview" fill className="object-cover rounded" />
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleClear()
              }}
              className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">Click to upload image</p>
            <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to {maxSize}MB</p>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
