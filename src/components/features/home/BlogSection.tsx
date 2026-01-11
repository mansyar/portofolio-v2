import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { api } from "../../../../convex/_generated/api";
import { BlogCard } from "../../ui/blog-card";

export function BlogSection() {
  const { data: latestPosts } = useSuspenseQuery(convexQuery(api.blog.listRecent, { limit: 3 }));

  return (
    <section className="container px-4 md:px-6">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="mb-2 text-2xl font-bold md:text-3xl">Latest from Blog</h2>
          <p className="text-(--color-text-secondary)">Thoughts on tech and development</p>
        </div>
        <Link to="/blog" className="hidden items-center font-mono text-(--color-ubuntu-orange) hover:underline md:inline-flex">
          read_more_posts() &gt;
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {latestPosts.length > 0 ? (
          latestPosts.map((post) => (
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
            <p className="font-mono text-(--color-text-secondary)">No blog posts found.</p>
          </div>
        )}
      </div>
    </section>
  );
}
