import { Card } from "./card";

interface SectionSkeletonProps {
  title?: string;
  items?: number;
  columns?: number;
  variant?: 'grid' | 'timeline' | 'list';
}

export function SectionSkeleton({ title, items = 3, columns = 3, variant = 'grid' }: SectionSkeletonProps) {
  const gridColsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }[columns as 1|2|3|4] || 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

  return (
    <section className="container px-4 md:px-6">
      {title && (
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="mb-2 text-2xl font-bold md:text-3xl">{title}</h2>
            <div className="h-4 w-48 animate-pulse rounded bg-(--color-surface-brighter)" />
          </div>
        </div>
      )}
      
      {variant === 'grid' && (
        <div className={`grid gap-6 ${gridColsClass}`}>
          {Array.from({ length: items }).map((_, i) => (
            <Card key={i} title="...">
              <div className="space-y-4">
                <div className="h-32 w-full animate-pulse rounded bg-(--color-surface-brighter)" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-(--color-surface-brighter)" />
                <div className="h-4 w-full animate-pulse rounded bg-(--color-surface-brighter)" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {variant === 'timeline' && (
        <div className="space-y-8 rounded-lg border border-(--color-border) bg-(--color-surface)/50 p-6 md:p-10">
          {Array.from({ length: items }).map((_, i) => (
            <div key={i} className="relative pl-8 border-l border-(--color-border)">
              <div className="absolute -left-1.5 h-3 w-3 rounded-full bg-(--color-surface-brighter) animate-pulse" />
              <div className="h-4 w-24 mb-2 animate-pulse rounded bg-(--color-surface-brighter)" />
              <div className="h-6 w-1/2 mb-2 animate-pulse rounded bg-(--color-surface-brighter)" />
              <div className="h-4 w-1/4 mb-4 animate-pulse rounded bg-(--color-surface-brighter)" />
              <div className="h-20 w-full animate-pulse rounded bg-(--color-surface-brighter)" />
            </div>
          ))}
        </div>
      )}

      {variant === 'list' && (
        <div className="space-y-4">
          {Array.from({ length: items }).map((_, i) => (
            <div key={i} className="h-20 w-full animate-pulse rounded border border-(--color-border) bg-(--color-surface-brighter)" />
          ))}
        </div>
      )}
    </section>
  );
}
