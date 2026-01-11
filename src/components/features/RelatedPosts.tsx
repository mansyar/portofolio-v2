import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { BlogCard } from '../ui/blog-card';
import { FileText } from 'lucide-react';

interface Props {
  currentPostId: Id<"blogPosts">;
}

export function RelatedPosts({ currentPostId }: Props) {
  const { data: posts } = useSuspenseQuery(
    convexQuery(api.blog.getRelated, { currentPostId, limit: 3 })
  );

  if (posts.length === 0) return null;

  return (
    <section className="mt-16 pt-8 border-t border-(--color-border)">
      <h2 className="flex items-center gap-2 mb-6 text-xl font-bold font-mono">
        <FileText className="text-(--color-ubuntu-orange)" size={20} />
        RELATED_LOGS
      </h2>
      <div className="grid gap-6 md:grid-cols-3">
        {posts.map((post) => (
          <BlogCard 
            key={post._id} 
            title={post.title}
            slug={post.slug}
            excerpt={post.excerpt}
            publishedAt={post.publishedAt}
            readingTime={post.readingTime}
          />
        ))}
      </div>
    </section>
  );
}
