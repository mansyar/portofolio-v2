import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Copy, Trash2, File as FileIcon, Check } from 'lucide-react'
import { useState } from 'react'

interface MediaFile {
  _id: string
  storageId: string
  url: string | null
  filename: string
  mimeType: string
  size: number
  _creationTime: number
}

interface MediaGridProps {
  files: MediaFile[]
}

export function MediaGrid({ files }: MediaGridProps) {
  const removeFile = useMutation(api.media.remove)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = (url: string | null, id: string) => {
    if (!url) return
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDelete = async (id: any, storageId: any) => {
    if (confirm('Delete this file permanently?')) {
      await removeFile({ id, storageId })
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  if (files.length === 0) {
    return (
      <div className="text-center p-8 border border-(--color-border) rounded-lg bg-black/20 text-(--color-text-secondary) font-mono text-sm">
        No media files found.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {files.map((file) => (
        <div key={file._id} className="group relative card p-0 overflow-hidden border border-(--color-border) hover:border-(--color-ubuntu-orange) transition-colors">
            
            {/* Preview */}
            <div className="aspect-square bg-(--color-terminal-bg-dark) flex items-center justify-center overflow-hidden">
               {file.mimeType.startsWith('image/') && file.url ? (
                 <img src={file.url} alt={file.filename} className="w-full h-full object-cover" />
               ) : (
                 <FileIcon size={32} className="text-(--color-text-secondary)" />
               )}
            </div>

            {/* Info Overlay (always visible partial, full on hover) */}
            <div className="p-2 bg-(--color-surface) border-t border-(--color-border)">
               <div className="truncate text-xs font-mono font-bold text-(--color-text-primary)" title={file.filename}>
                 {file.filename}
               </div>
               <div className="flex justify-between items-center mt-1">
                 <span className="text-[10px] text-(--color-text-secondary)">{formatSize(file.size)}</span>
                 <div className="flex gap-1">
                    <button 
                      onClick={() => handleCopy(file.url, file._id)}
                      className="p-1 hover:bg-black/20 rounded text-(--color-text-secondary) hover:text-(--color-ubuntu-orange)"
                      title="Copy URL"
                    >
                      {copiedId === file._id ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                    <button 
                      onClick={() => handleDelete(file._id, file.storageId)}
                      className="p-1 hover:bg-black/20 rounded text-(--color-text-secondary) hover:text-(--color-terminal-red)"
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                 </div>
               </div>
            </div>
        </div>
      ))}
    </div>
  )
}
