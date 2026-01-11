import { Link } from "@tanstack/react-router";
import { Card } from "./card";
import { Calendar, Clock, Tag } from "lucide-react";

interface BlogCardProps {
  title: string;
  slug: string;
  excerpt?: string;
  publishedAt?: number;
  readingTime?: number;
  category?: { name: string; slug: string };
}

export function BlogCard({
  title,
  slug,
  excerpt,
  publishedAt,
  readingTime,
  category,
}: BlogCardProps) {
  const date = publishedAt 
    ? new Date(publishedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Draft';

  return (
    <Card title={`${slug}.md`} className="h-full transition-transform duration-200 hover:-translate-y-1">
      <div className="flex h-full flex-col">
        <div className="mb-3 flex flex-wrap gap-x-4 gap-y-2 font-mono text-xs text-(--color-text-secondary)">
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            <span>{date}</span>
          </div>
          {readingTime && (
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>{readingTime} min read</span>
            </div>
          )}
          {category && (
            <div className="flex items-center gap-1 text-(--color-ubuntu-orange)">
              <Tag size={12} />
              <span>{category.name}</span>
            </div>
          )}
        </div>

        <Link 
          to="/blog/$slug" 
          params={{ slug }} 
          className="group"
          data-umami-event="blog-click"
          data-umami-event-post={slug}
        >
          <h2 className="mb-3 text-xl font-bold transition-colors group-hover:text-(--color-ubuntu-orange)">
            {title}
          </h2>
        </Link>
        
        {excerpt && (
          <p className="mb-4 flex-1 text-sm leading-relaxed text-(--color-text-secondary)">
            {excerpt}
          </p>
        )}

        <div className="mt-auto pt-2">
          <Link 
            to="/blog/$slug" 
            params={{ slug }}
            className="inline-flex items-center font-mono text-sm text-(--color-terminal-cyan) hover:underline"
            data-umami-event="blog-click"
            data-umami-event-post={slug}
          >
            read_article() &gt;
          </Link>
        </div>
      </div>
    </Card>
  );
}
