import { Card } from "./card";

interface SectionSkeletonProps {
  title: string;
  items?: number;
}

export function SectionSkeleton({ title, items = 3 }: SectionSkeletonProps) {
  return (
    <section className="container px-4 md:px-6">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="mb-2 text-2xl font-bold md:text-3xl">{title}</h2>
          <div className="h-4 w-48 animate-pulse rounded bg-(--color-surface-brighter)" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
    </section>
  );
}
