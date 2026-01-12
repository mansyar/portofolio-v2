import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from '../../convex/_generated/api';
import { Seo } from '../components/seo';
import { Calendar, Clock, ChevronLeft, Tag } from 'lucide-react';
import { format } from 'date-fns';
import '../components/editor/RichTextEditor.css';
import { ErrorFallback } from '../components/ui/error-fallback';

import { sanitizeHtml } from '../lib/sanitize';
import { OptimizedImage } from '../components/ui/optimized-image';
import { RelatedPosts } from '../components/features/RelatedPosts';
import { ReadingProgress } from '../components/ui/ReadingProgress';
import { Suspense, useMemo } from 'react';
import { useTheme } from '../hooks/useTheme';
import { GiscusComments } from '../components/features/GiscusComments';
import { ShareButtons } from '../components/features/ShareButtons';
import { TableOfContents } from '../components/features/TableOfContents';

export const Route = createFileRoute('/blog/$slug')({
  component: BlogPostDetail,
  loader: async ({ context, params: { slug } }) => {
    const post = await context.queryClient.ensureQueryData(
      convexQuery(api.blog.bySlug, { slug })
    );
    if (!post) throw notFound();
  },
  errorComponent: ({ error, reset }) => (
    <ErrorFallback 
      error={error} 
      reset={reset} 
      title="BLOG_POST_FETCH_FAILED" 
    />
  ),
});

function BlogPostDetail() {
  const { slug } = Route.useParams();
  const { data: post } = useSuspenseQuery(convexQuery(api.blog.bySlug, { slug }));
  const theme = useTheme();
  
  const sanitizedContent = useMemo(() => {
    return post ? sanitizeHtml(post.content) : '';
  }, [post]);

  if (!post) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <article className="container max-w-6xl px-4 pt-10 pb-20 md:px-6">
      <ReadingProgress />
      <Seo 
        title={`${post.title} | Blog`} 
        description={post.excerpt || ''}
        image={post.coverImageUrl || ''}
      />

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Main Content */}
        <div className="flex-1 max-w-4xl">
          <Link 
            to="/blog" 
            className="mb-8 flex items-center gap-2 text-sm text-(--color-text-secondary) hover:text-(--color-ubuntu-orange) transition-colors font-mono"
          >
            <ChevronLeft size={16} />
            <span>BACK_TO_LOGS</span>
          </Link>

          <header className="mb-10 space-y-4">
            <h1 className="text-4xl font-bold md:text-5xl leading-tight">{post.title}</h1>
            
            <div className="flex flex-wrap items-center gap-6 text-sm text-(--color-text-secondary) font-mono">
              <div className="flex items-center gap-2">
                <Calendar size={14} />
                <span>{post.publishedAt ? format(post.publishedAt, 'yyyy-MM-dd') : 'DRAFT'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} />
                <span>{post.readingTime} MIN READ</span>
              </div>
            </div>

            {post.coverImageUrl && (
              <div className="mt-8 overflow-hidden rounded-lg border border-(--color-border)">
                <OptimizedImage 
                  src={post.coverImageUrl} 
                  alt={post.title} 
                  aspectRatio="16/9"
                  priority
                />
              </div>
            )}
          </header>

          <div className="mb-12">
            <ShareButtons url={currentUrl} title={post.title} />
          </div>

          <div 
            className="editor-content prose prose-invert prose-orange max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />

          <footer className="mt-16 pt-8 border-t border-(--color-border)">
            <div className="flex items-center gap-4 text-sm text-(--color-text-secondary) font-mono">
              <Tag size={16} />
              <span>END_OF_TRANSMISSION</span>
            </div>
          </footer>

          <Suspense fallback={<div className="h-48 animate-pulse bg-(--color-surface) rounded mt-16" />}>
            <RelatedPosts currentPostId={post._id} />
          </Suspense>

          <section className="mt-20">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-(--color-border)" />
              <span className="text-xs font-mono text-(--color-text-secondary)">BEGIN_COMMENTS</span>
              <div className="h-px flex-1 bg-(--color-border)" />
            </div>
            <Suspense fallback={<div className="h-48 animate-pulse bg-(--color-surface) rounded" />}>
              <GiscusComments theme={theme} />
            </Suspense>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24">
            <TableOfContents content={post.content} />
          </div>
        </aside>
      </div>
    </article>
  );
}
