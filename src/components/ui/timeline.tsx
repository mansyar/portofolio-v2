import { Card } from "./card";

interface TimelineItemProps {
  year: string;
  title: string;
  subtitle?: string;
  description?: string;
  isLast?: boolean;
}

function TimelineItem({ year, title, subtitle, description, isLast }: TimelineItemProps) {
  return (
    <div className={`relative flex gap-6 pb-12 ${isLast ? 'pb-0' : ''}`}>
      {/* Line */}
      {!isLast && (
        <div className="absolute top-8 bottom-0 left-[19px] w-px bg-(--color-border)" />
      )}
      
      {/* Dot */}
      <div className="relative z-10 mt-1 shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-(--color-border) bg-(--color-surface) font-mono text-xs font-bold text-(--color-ubuntu-orange)">
           {year}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 pt-1">
        <h3 className="text-xl font-bold">{title}</h3>
        {subtitle && (
          <p className="mb-2 font-medium text-(--color-ubuntu-purple)">{subtitle}</p>
        )}
        {description && (
          <p className="leading-relaxed text-(--color-text-secondary)">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

interface TimelineProps {
  items: Array<{
    _id: string;
    year: string;
    title: string;
    subtitle?: string;
    description?: string;
  }>;
}

export function Timeline({ items }: TimelineProps) {
  return (
    <Card className="p-6 md:p-8">
      <div className="flex flex-col">
        {items.map((item, index) => (
          <TimelineItem
            key={item._id}
            year={item.year}
            title={item.title}
            subtitle={item.subtitle}
            description={item.description}
            isLast={index === items.length - 1}
          />
        ))}
      </div>
    </Card>
  );
}
