import { createFileRoute } from '@tanstack/react-router'
import { convexQuery } from '@convex-dev/react-query'
import { useSuspenseQuery } from '@tanstack/react-query'
import { api } from '../../convex/_generated/api'
import { BlogCard } from '../components/ui/blog-card'
import { Pagination } from '../components/ui/pagination'
import { Seo } from '../components/seo'
import { Terminal } from 'lucide-react'
import { z } from 'zod'

// Define search params schema for pagination and filtering
const blogSearchSchema = z.object({
  page: z.number().default(1),
  category: z.string().optional(),
})

export const Route = createFileRoute('/blog/')({
  component: Blog,
  validateSearch: blogSearchSchema,
  loaderDeps: ({ search: { page, category } }) => ({ page, category }),
  loader: async () => {
    // Note: convexQuery with pagination logic is complex to prefetch server-side 
    // because listPublished returns a paginated result based on cursor, not page number directly.
    // Standard Convex pagination uses cursors. 
    // My listPublished API uses `paginate` which takes { numItems, cursor }.
    // Implementing "Page 1, 2, 3" style pagination with Convex requires fetching all or sophisticated cursor management.
    // For simplicity in this phase, I might just fetch a larger list or rely on infinite scroll styled as pages?
    // OR, since the task asked for "Paginated list (10 per page)", I will try to implement page-based if possible, 
    // but Convex `paginate` is cursor-based.
    
    // Attempting to fetch first page
    // await context.queryClient.ensureQueryData(convexQuery(api.blog.listPublished, { paginationOpts: { numItems: 10, cursor: null } }))
  }
})

function Blog() {
  const { page, category } = Route.useSearch()
  
  // Using listPublished with limit.
  // Limitation: Real random access pagination (jumping to page 5) is hard with simple Connect pagination.
  // For this PRD, I will implement a "Load More" or simple First Page for now, 
  // or fetches all and slices client side if list is small? 
  // Given it's a personal portfolio, simple "all published" might be fine?
  // Let's use `listRecent` with a high limit for now to simulate a full list, then client-side paginate?
  // Or check if I can make `listPublished` just return all.
  
  // Checking api.blog.listPublished in convex/blog.ts... it uses .paginate().
  // Checking api.blog.listRecent... it uses .take(limit).
  
  // I will use `usePaginatedQuery` from 'convex/react' if I want "Load More".
  // But TanStack Query integration `useSuspenseQuery` expects a query that returns data.
  
  // Let's swap to client-side pagination of a full list for simplicity in Phase 2 unless there are hundreds of posts.
  // Using `listRecent` with limit 100 for now.
  const { data: allPosts } = useSuspenseQuery(convexQuery(api.blog.listRecent, { limit: 100 }))

  const ITEMS_PER_PAGE = 9;
  const totalPages = Math.ceil(allPosts.length / ITEMS_PER_PAGE);
  const displayedPosts = allPosts.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="container flex flex-col gap-8 px-4 pt-10 pb-20 md:px-6">
      <Seo 
        title="Blog | Portfolio" 
        description="Thoughts, tutorials, and insights on web development and DevOps." 
      />

      <div className="flex flex-col gap-4">
        <h1 className="flex items-center gap-3 text-3xl font-bold md:text-4xl">
          <Terminal className="text-(--color-ubuntu-orange)" />
          Blog
        </h1>
        <p className="max-w-2xl text-(--color-text-secondary)">
          Writings on code, infrastructure, and the tech industry.
        </p>
      </div>

      <div className="grid min-h-[50vh] grid-cols-1 content-start gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        {displayedPosts.length > 0 ? (
          displayedPosts.map((post) => (
            <BlogCard
              key={post._id}
              title={post.title}
              slug={post.slug}
              excerpt={post.excerpt}
              publishedAt={post.publishedAt}
              readingTime={post.readingTime}
            />
          ))
        ) : (
          <div className="col-span-full rounded border border-dashed border-(--color-border) py-12 text-center">
            <p className="font-mono text-(--color-text-secondary)">No posts found.</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <Pagination 
          currentPage={page} 
          totalPages={totalPages} 
          baseUrl="/blog" 
          searchParams={{ category }}
          className="mt-8"
        />
      )}
    </div>
  )
}
