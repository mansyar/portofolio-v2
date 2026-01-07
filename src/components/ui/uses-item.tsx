import { Card } from "./card";
import { ExternalLink } from "lucide-react";

interface UsesItemProps {
  name: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  className?: string;
}

export function UsesItem({ name, description, url, imageUrl, className }: UsesItemProps) {
  return (
    <Card title={name} className={className}>
      <div className="flex items-start gap-4">
        {imageUrl && (
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded border border-(--color-border) bg-(--color-surface)">
            <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h3 className="truncate text-lg font-bold">{name}</h3>
            {url && (
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-(--color-text-secondary) transition-colors hover:text-(--color-ubuntu-orange)"
              >
                <ExternalLink size={14} />
              </a>
            )}
          </div>
          {description && (
            <p className="text-sm leading-relaxed text-(--color-text-secondary)">
              {description}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
