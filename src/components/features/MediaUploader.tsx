import { useState, useRef } from 'react';
import { useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { UploadCloud } from 'lucide-react';

interface MediaUploaderProps {
  onUploadComplete?: () => void;
}

// Allowed file types and max size (must match backend validation.ts)
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf'];
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

export function MediaUploader({ onUploadComplete }: MediaUploaderProps) {
  const uploadFileAction = useAction(api.mediaActions.upload);
  
  const [isUploading, setIsUploading] = useState(false);
  const [shouldOptimize, setShouldOptimize] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    // Process first file only for now, or loop for multiple
    const file = e.target.files[0];
    await uploadFile(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async (file: File) => {
    // Client-side validation
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
      setError(`Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
      return;
    }
    
    if (file.size > MAX_FILE_SIZE) {
      setError(`File too large. Maximum size: ${MAX_FILE_SIZE_MB}MB`);
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // 1. Read file as ArrayBuffer
      const fileData = await file.arrayBuffer();

      // 2. Upload via Convex Action
      await uploadFileAction({
        fileData,
        filename: file.name,
        mimeType: file.type,
        shouldOptimize,
      });

      if (onUploadComplete) {
        onUploadComplete();
      }

    } catch (err: unknown) {
      console.error('Upload Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload file';
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="rounded-lg border-2 border-dashed border-(--color-border) p-8 text-center hover:border-(--color-ubuntu-orange) transition-colors bg-(--color-surface)">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        id="file-upload"
        accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.pdf"
      />
      
      {isUploading ? (
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-(--color-ubuntu-orange) border-t-transparent" />
          <p className="font-mono text-sm text-(--color-text-secondary)">
            Uploading data stream...
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-[rgba(255,255,255,0.05)] text-(--color-text-secondary)">
            <UploadCloud size={32} />
          </div>
          <div>
            <h3 className="text-lg font-medium text-(--color-text-primary)">
              Upload Media
            </h3>
            <p className="mt-1 text-sm text-(--color-text-secondary) font-mono">
              Drag & drop or Click to browse
            </p>
          </div>

          <div className="flex items-center gap-2 py-2">
            <input
              type="checkbox"
              id="should-optimize"
              checked={shouldOptimize}
              onChange={(e) => setShouldOptimize(e.target.checked)}
              className="accent-(--color-ubuntu-orange)"
            />
            <label htmlFor="should-optimize" className="text-xs font-mono cursor-pointer select-none">
              AUTO-OPTIMIZE IMAGES (WEBP)
            </label>
          </div>
          
          {error && (
             <p className="text-xs text-(--color-terminal-red)">Error: {error}</p>
          )}

          <label
            htmlFor="file-upload"
            className="terminal-button cursor-pointer"
          >
            Select File
          </label>
        </div>
      )}
    </div>
  );
}
