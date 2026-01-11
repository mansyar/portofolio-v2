import { useState } from 'react';
import { cn } from '../../lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  aspectRatio?: '16/9' | '4/3' | '1/1' | 'auto';
  priority?: boolean; // Disable lazy loading for LCP
  className?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

export function OptimizedImage({
  src,
  alt,
  aspectRatio = '16/9',
  priority = false,
  className,
  objectFit = 'cover',
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Aspect ratio mapping to tailwind or css values
  const aspectRatioStyle = aspectRatio === 'auto' ? {} : { aspectRatio };

  return (
    <div 
      className={cn("relative overflow-hidden bg-(--color-terminal-bg-dark)/50", className)}
      style={aspectRatioStyle}
    >
      {/* Blur/Pulse placeholder */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 animate-pulse bg-(--color-terminal-green)/5" />
      )}
      
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={cn(
          "h-full w-full transition-opacity duration-300",
          objectFit === 'cover' && "object-cover",
          objectFit === 'contain' && "object-contain",
          objectFit === 'fill' && "object-fill",
          objectFit === 'none' && "object-none",
          objectFit === 'scale-down' && "object-scale-down",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
      />
      
      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-(--color-surface) text-xs font-mono text-(--color-terminal-red)">
          <span>[ERROR_LOADING_IMAGE]</span>
        </div>
      )}
    </div>
  );
}
