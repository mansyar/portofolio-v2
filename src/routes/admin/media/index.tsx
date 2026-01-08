import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { MediaUploader } from '../../../components/features/MediaUploader';
import { Copy, Trash2, ExternalLink } from 'lucide-react';

export const Route = createFileRoute('/admin/media/')({
  component: MediaLibraryPage,
});

function MediaLibraryPage() {
  const files = useQuery(api.media.list);
  const deleteFile = useMutation(api.media.remove);
  
  const [deletingId, setDeletingId] = useState<Id<"mediaFiles"> | null>(null);

  const handleDelete = async (id: Id<"mediaFiles">) => {
    if (confirm('Permanently delete this file?')) {
      setDeletingId(id);
      try {
        await deleteFile({ id });
      } catch (error) {
        console.error('Failed to delete file:', error);
        alert('Failed to delete file');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    // Could add toast notification here
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-(--color-text-primary)">Media Library</h1>
        <p className="text-sm text-(--color-text-secondary) font-mono mt-1">
          Manage images and assets stored in Convex/R2
        </p>
      </div>

      <MediaUploader />

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-(--color-text-primary) border-b border-(--color-border) pb-2">
          Uploaded Files
        </h2>

        {files === undefined ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-(--color-ubuntu-orange) border-t-transparent" />
          </div>
        ) : files.length === 0 ? (
          <p className="text-center py-8 text-(--color-text-secondary)">
            No files managed. Upload something above.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {files.map((file) => (
              <div 
                key={file._id} 
                className="group relative rounded-lg border border-(--color-border) bg-(--color-surface) overflow-hidden"
              >
                {/* Preview */}
                <div className="aspect-square w-full bg-[#111] flex items-center justify-center overflow-hidden">
                  {file.mimeType.startsWith('image/') && file.url ? (
                    <img 
                      src={file.url} 
                      alt={file.altText || file.filename} 
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <span className="text-xs font-mono text-(--color-text-secondary)">
                      {file.mimeType}
                    </span>
                  )}
                </div>

                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                   {file.url && (
                    <button
                      onClick={() => copyToClipboard(file.url!)}
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                      title="Copy URL"
                    >
                      <Copy size={16} />
                    </button>
                   )}
                   {file.url && (
                     <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                      title="Open Original"
                    >
                      <ExternalLink size={16} />
                    </a>
                   )}
                   <button
                    onClick={() => handleDelete(file._id)}
                    disabled={deletingId === file._id}
                    className="p-2 rounded-full bg-red-500/80 hover:bg-red-500 text-white transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Footer Info */}
                <div className="p-2 text-xs border-t border-(--color-border)">
                  <div className="font-medium truncate text-(--color-text-primary)" title={file.filename}>
                    {file.filename}
                  </div>
                  <div className="text-[10px] text-(--color-text-secondary) flex justify-between mt-1">
                    <span>{(file.size / 1024).toFixed(1)} KB</span>
                    <span className="uppercase">{file.mimeType.split('/')[1]}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
