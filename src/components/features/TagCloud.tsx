import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { api } from '../../../convex/_generated/api';
import { Tag } from 'lucide-react';

export function TagCloud() {
  const { data: tags } = useSuspenseQuery(
    convexQuery(api.blog.getTagsWithCounts, {})
  );

  if (tags.length === 0) return null;

  const maxCount = Math.max(...tags.map((t) => t.count));
  const getSize = (count: number) => {
    const ratio = count / maxCount;
    if (ratio >= 0.75) return 'text-lg font-bold';
    if (ratio >= 0.5) return 'text-base font-medium';
    if (ratio >= 0.25) return 'text-sm';
    return 'text-xs';
  };

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-bold font-mono text-(--color-ubuntu-orange)">
        <Tag size={14} /> TAGS
      </h3>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Link
            key={tag._id}
            to="/blog"
            search={{ tag: tag.slug }}
            className={`px-2 py-1 rounded bg-(--color-surface) border border-(--color-border) 
                       hover:border-(--color-ubuntu-orange) transition-colors ${getSize(tag.count)}`}
          >
            {tag.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
