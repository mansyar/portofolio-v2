import { query } from "./_generated/server";

export const getSitemapData = query({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db
      .query("projects")
      .filter((q) => q.eq(q.field("isVisible"), true))
      .collect();

    const blogPosts = await ctx.db
      .query("blogPosts")
      .filter((q) => q.eq(q.field("status"), "published"))
      .collect();

    const staticRoutes = [
      "",
      "/about",
      "/skills",
      "/projects",
      "/blog",
      "/uses",
      "/contact",
    ];

    return {
      staticRoutes,
      projects: projects.map((p) => p.slug),
      blogPosts: blogPosts.map((p) => p.slug),
    };
  },
});
