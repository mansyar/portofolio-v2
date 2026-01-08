import { useState, useRef } from 'react'
import { Upload, CheckCircle, AlertCircle } from 'lucide-react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'

interface MediaUploaderProps {
  onUploadComplete: () => void
}

export function MediaUploader({ onUploadComplete }: MediaUploaderProps) {
  const generateUploadUrl = useMutation(api.media.generateUploadUrl)
  const saveFile = useMutation(api.media.saveFile)
  
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files[0])
    }
  }

  const handleUpload = async (file: File) => {
    setIsUploading(true)
    setUploadStatus('idle')
    setErrorMessage('')

    try {
      // 1. Get Upload URL
      const postUrl = await generateUploadUrl()

      // 2. Upload File
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      })

      if (!result.ok) {
        throw new Error(`Upload failed: ${result.statusText}`)
      }

      const { storageId } = await result.json()

      // 3. Save Metadata
      await saveFile({
        storageId,
        filename: file.name,
        originalFilename: file.name,
        mimeType: file.type,
        size: file.size,
      })

      setUploadStatus('success')
      onUploadComplete()
      
      // Reset after delay
      setTimeout(() => setUploadStatus('idle'), 3000)

    } catch (error: any) {
      console.error(error)
      setUploadStatus('error')
      setErrorMessage(error.message || 'Upload failed')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div 
      className={`
        border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer font-mono
        ${isDragging 
          ? 'border-(--color-ubuntu-orange) bg-(--color-surface) bg-opacity-50' 
          : 'border-(--color-border) hover:border-(--color-text-secondary)'}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        className="hidden" 
        accept="image/*,application/pdf"
      />
      
      <div className="flex flex-col items-center gap-3">
        {isUploading ? (
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-(--color-ubuntu-orange) border-t-transparent" />
        ) : uploadStatus === 'success' ? (
          <CheckCircle className="h-10 w-10 text-(--color-terminal-green)" />
        ) : uploadStatus === 'error' ? (
          <AlertCircle className="h-10 w-10 text-(--color-terminal-red)" />
        ) : (
          <Upload className="h-10 w-10 text-(--color-text-secondary)" />
        )}

        <div className="text-sm">
          {isUploading ? (
            <span className="text-(--color-ubuntu-orange)">Uploading to Storage...</span>
          ) : uploadStatus === 'success' ? (
            <span className="text-(--color-terminal-green)">Upload Complete!</span>
          ) : uploadStatus === 'error' ? (
            <span className="text-(--color-terminal-red)">Error: {errorMessage}</span>
          ) : (
             <div className="space-y-1 text-(--color-text-secondary)">
               <p><span className="text-(--color-text-primary) font-bold">Click to upload</span> or drag and drop</p>
               <p className="text-xs">SVG, PNG, JPG or PDF</p>
             </div>
          )}
        </div>
      </div>
    </div>
  )
}
