import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "../../../../convex/_generated/api";
import { BlogCard } from "../../ui/blog-card";
import { Pagination } from "../../ui/pagination";

interface BlogContentProps {
  page: number;
  category?: string;
}

export function BlogContent({ page, category }: BlogContentProps) {
  const { data: allPosts } = useSuspenseQuery(convexQuery(api.blog.listRecent, { limit: 100 }));

  const ITEMS_PER_PAGE = 9;
  const filteredPosts = category 
    ? allPosts.filter(p => !category || p.slug.includes(category)) // Placeholder filter logic
    : allPosts;

  const totalPages = Math.ceil(filteredPosts.length / ITEMS_PER_PAGE);
  const displayedPosts = filteredPosts.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <>
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
    </>
  );
}
