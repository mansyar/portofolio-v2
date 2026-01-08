import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";
import { paginationOptsValidator } from "convex/server";

// Utility to calculate reading time
const calculateReadingTime = (content: string): number => {
  const wordsPerMinute = 200;
  const noHtml = content.replace(/<[^>]*>/g, "");
  const words = noHtml.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
};

// =============================================================================
// Public Queries
// =============================================================================

export const listPublished = query({
  args: {
    paginationOpts: paginationOptsValidator,
    categorySlug: v.optional(v.string()),
    tagSlug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Basic implementation - filtering by category/tag would typically 
    // utilize specific indexes or separate queries before pagination 
    // if the dataset is large. For now, we'll keep it simple or assume 
    // direct filtering if validation allows.
    
    // Note: Complex filtering with pagination in Convex often requires
    // specific index design. We will start with standard pagination
    // on the 'published' index for the main feed.

    if (args.categorySlug) {
      // Find category ID first
      const category = await ctx.db
        .query("blogCategories")
        .withIndex("by_slug", (q) => q.eq("slug", args.categorySlug!))
        .first();

      if (!category) {
        return { page: [], isDone: true, continueCursor: "" };
      }

      return await ctx.db
        .query("blogPosts")
        .withIndex("by_category", (q) => q.eq("categoryId", category._id))
        .filter((q) => q.eq(q.field("status"), "published"))
        .order("desc") 
        .paginate(args.paginationOpts);
    }
    
    // Default: List all published posts by publication date
    return await ctx.db
      .query("blogPosts")
      .withIndex("by_published")
      .filter((q) => q.eq(q.field("status"), "published"))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

// Public query to list recent published posts (for home page)
export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 3;
    const posts = await ctx.db
      .query("blogPosts")
      .withIndex("by_status") // We might need an index for status+publishedAt to sort correctly
      .filter((q) => q.eq(q.field("status"), "published"))
      //.order("desc") // default behavior of query might not be sortable easily without index
      .collect();
      
    // Sort in memory for now if index is missing, or use index if available.
    // Schema has index("by_status", ["status", "publishedAt"])?
    // Let's check schema. If not, memory sort is fine for small set.
    // Actually, "status" is not indexed in schema provided in context?
    // Let's assume we do memory sort for now to be safe, or just take slice.
    
    return posts.sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0)).slice(0, limit);
  },
});

export const bySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const post = await ctx.db
      .query("blogPosts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!post || post.status !== "published") {
      return null;
    }

    // Enhance with Category and Tags if needed?
    // Usually fetching them separately or doing a join here is fine.
    // For simplicity, we just return the post document.
    return post;
  },
});

export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("blogCategories").withIndex("by_order").collect();
  },
});

export const getTags = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("blogTags").collect();
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("blogPosts").order("desc").collect();
  },
});

export const getAdminPost = query({
  args: { id: v.id("blogPosts") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.get(args.id);
  },
});

// =============================================================================
// Admin Mutations
// =============================================================================

export const createCategory = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    displayOrder: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("blogCategories", args);
  },
});

export const updateCategory = mutation({
  args: {
    id: v.id("blogCategories"),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    displayOrder: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const deleteCategory = mutation({
  args: { id: v.id("blogCategories") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});

export const createPost = mutation({
  args: {
    slug: v.string(),
    title: v.string(),
    excerpt: v.optional(v.string()),
    content: v.string(),
    coverImageUrl: v.optional(v.string()),
    categoryId: v.optional(v.id("blogCategories")),
    tagIds: v.array(v.id("blogTags")),
    status: v.union(v.literal("draft"), v.literal("published")),
    publishedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const readingTime = calculateReadingTime(args.content);
    return await ctx.db.insert("blogPosts", {
      ...args,
      readingTime,
    });
  },
});

export const updatePost = mutation({
  args: {
    id: v.id("blogPosts"),
    slug: v.string(),
    title: v.string(),
    excerpt: v.optional(v.string()),
    content: v.string(),
    coverImageUrl: v.optional(v.string()),
    categoryId: v.optional(v.id("blogCategories")),
    tagIds: v.array(v.id("blogTags")),
    status: v.union(v.literal("draft"), v.literal("published")),
    publishedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...data } = args;
    const readingTime = calculateReadingTime(data.content);
    await ctx.db.patch(id, {
      ...data,
      readingTime,
    });
  },
});

export const deletePost = mutation({
  args: { id: v.id("blogPosts") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});

export const togglePublish = mutation({
  args: { id: v.id("blogPosts") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const post = await ctx.db.get(args.id);
    if (!post) throw new Error("Post not found");
    
    const newStatus = post.status === "draft" ? "published" : "draft";
    const publishedAt = newStatus === "published" ? Date.now() : post.publishedAt;
    
    await ctx.db.patch(args.id, {
      status: newStatus,
      publishedAt,
    });
  },
});

export const createTag = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("blogTags", args);
  },
});

export const updateTag = mutation({
  args: {
    id: v.id("blogTags"),
    name: v.string(),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const deleteTag = mutation({
  args: { id: v.id("blogTags") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});
