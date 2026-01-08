import { createFileRoute } from '@tanstack/react-router'
import { MediaUploader } from '@/components/features/MediaUploader'
import { MediaGrid } from '@/components/features/MediaGrid'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'

export const Route = createFileRoute('/admin/media/')({
  component: MediaPage,
})

function MediaPage() {
  const files = useQuery(api.media.list)
  
  // No need for manual refresh function, Convex is reactive! 
  // But we can pass a callback to Uploader for toast notifications or similar if desired.
  const handleUploadComplete = () => {
    // Optional: Show toast
    console.log("Upload completed, list will auto-update")
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-mono text-(--color-ubuntu-orange)">Media Storage</h1>
      </div>

      <div className="card p-6">
        <h3 className="text-sm font-bold font-mono text-(--color-text-secondary) mb-4">Upload New File</h3>
        <MediaUploader onUploadComplete={handleUploadComplete} />
      </div>

      <div className="space-y-4">
        <h3 className="section-title text-sm font-bold font-mono text-(--color-text-secondary) border-b border-(--color-border) pb-2 uppercase tracking-wider">
           Library ({files?.length || 0})
        </h3>
        
        {!files ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square bg-(--color-surface) rounded-lg" />
            ))}
          </div>
        ) : (
          <MediaGrid files={files} />
        )}
      </div>
    </div>
  )
}
