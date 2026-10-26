import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "../../../../convex/_generated/api";
import { BlogCard } from "../../ui/blog-card";
import { Pagination } from "../../ui/pagination";

/** Listing page size. The route loader imports this so its prefetch key matches. */
export const BLOG_PAGE_SIZE = 9;

interface BlogContentProps {
  page: number;
  category?: string;
  tag?: string;
}

export function BlogContent({ page, category, tag }: BlogContentProps) {
  // The listing is filtered and paged by the backend: category and tag resolve to ids
  // there, so a slug that only appears inside a post's own slug never matches, and every
  // published post stays reachable no matter how many there are.
  const { data } = useSuspenseQuery(
    convexQuery(api.blog.listPublished, {
      page,
      pageSize: BLOG_PAGE_SIZE,
      categorySlug: category,
      tagSlug: tag,
    })
  );

  return (
    <>
      <div className="grid min-h-[50vh] grid-cols-1 content-start gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        {data.posts.length > 0 ? (
          data.posts.map((post) => (
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

      {data.totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={data.totalPages}
          baseUrl="/blog"
          searchParams={{ category, tag }}
          className="mt-8"
        />
      )}
    </>
  );
}
