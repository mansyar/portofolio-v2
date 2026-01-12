import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";
import { paginationOptsValidator } from "convex/server";
import { internal } from "./_generated/api";

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
      .filter((q) => q.eq(q.field("status"), "published"))
      .collect();
    
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

export const getRelated = query({
  args: { 
    currentPostId: v.id("blogPosts"),
    limit: v.optional(v.number()) 
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 3;
    const currentPost = await ctx.db.get(args.currentPostId);
    if (!currentPost || !currentPost.categoryId) return [];

    const relatedPosts = await ctx.db
      .query("blogPosts")
      .withIndex("by_category", (q) => q.eq("categoryId", currentPost.categoryId!))
      .filter((q) => 
        q.and(
          q.eq(q.field("status"), "published"),
          q.neq(q.field("_id"), args.currentPostId)
        )
      )
      .order("desc")
      .take(limit);

    return relatedPosts;
  },
});

export const getTagsWithCounts = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db
      .query("blogPosts")
      .filter((q) => q.eq(q.field("status"), "published"))
      .collect();

    const tagCounts = new Map<string, number>();
    posts.forEach((post) => {
      post.tagIds.forEach((tagId) => {
        tagCounts.set(tagId.toString(), (tagCounts.get(tagId.toString()) || 0) + 1);
      });
    });

    const tags = await ctx.db.query("blogTags").collect();
    return tags.map((tag) => ({
      ...tag,
      count: tagCounts.get(tag._id.toString()) || 0,
    })).filter((t) => t.count > 0);
  },
});

export const listForRss = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("blogPosts")
      .filter((q) => q.eq(q.field("status"), "published"))
      .order("desc")
      .take(50);
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
    const id = await ctx.db.insert("blogCategories", args);
    return id;
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
    scheduledAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { email } = await requireAdmin(ctx);
    const readingTime = calculateReadingTime(args.content);
    const id = await ctx.db.insert("blogPosts", {
      ...args,
      readingTime,
    });

    await ctx.runMutation(internal.activity.log, {
      actorEmail: email,
      action: "create",
      entityType: "blogPost",
      entityId: id,
      entityTitle: args.title,
    });

    return id;
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
    scheduledAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { email } = await requireAdmin(ctx);
    const { id, ...data } = args;
    const readingTime = calculateReadingTime(data.content);
    await ctx.db.patch(id, {
      ...data,
      readingTime,
    });

    await ctx.runMutation(internal.activity.log, {
      actorEmail: email,
      action: "update",
      entityType: "blogPost",
      entityId: id,
      entityTitle: args.title,
    });
  },
});

export const deletePost = mutation({
  args: { id: v.id("blogPosts") },
  handler: async (ctx, args) => {
    const { email } = await requireAdmin(ctx);
    const post = await ctx.db.get(args.id);
    await ctx.db.delete(args.id);

    await ctx.runMutation(internal.activity.log, {
      actorEmail: email,
      action: "delete",
      entityType: "blogPost",
      entityId: args.id,
      entityTitle: post?.title,
    });
  },
});

export const togglePublish = mutation({
  args: { id: v.id("blogPosts") },
  handler: async (ctx, args) => {
    const { email } = await requireAdmin(ctx);
    const post = await ctx.db.get(args.id);
    if (!post) throw new Error("Post not found");
    
    const newStatus = post.status === "draft" ? "published" : "draft";
    const publishedAt = newStatus === "published" ? Date.now() : post.publishedAt;
    
    await ctx.db.patch(args.id, {
      status: newStatus,
      publishedAt,
    });

    await ctx.runMutation(internal.activity.log, {
      actorEmail: email,
      action: newStatus === "published" ? "publish" : "unpublish",
      entityType: "blogPost",
      entityId: args.id,
      entityTitle: post.title,
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

export const removePostsBulk = mutation({
  args: { ids: v.array(v.id("blogPosts")) },
  handler: async (ctx, args) => {
    const { email } = await requireAdmin(ctx);
    for (const id of args.ids) {
      const post = await ctx.db.get(id);
      await ctx.db.delete(id);

      await ctx.runMutation(internal.activity.log, {
        actorEmail: email,
        action: "delete",
        entityType: "blogPost",
        entityId: id,
        entityTitle: post?.title,
        metadata: { bulk: true },
      });
    }
  },
});

export const toggleStatusBulk = mutation({
  args: { 
    ids: v.array(v.id("blogPosts")), 
    status: v.union(v.literal("draft"), v.literal("published")) 
  },
  handler: async (ctx, args) => {
    const { email } = await requireAdmin(ctx);
    const publishedAt = args.status === "published" ? Date.now() : undefined;
    
    for (const id of args.ids) {
      const post = await ctx.db.get(id);
      if (post) {
        await ctx.db.patch(id, { 
          status: args.status,
          publishedAt: args.status === "published" ? (post.publishedAt || publishedAt) : post.publishedAt
        });

        await ctx.runMutation(internal.activity.log, {
          actorEmail: email,
          action: args.status === "published" ? "publish" : "unpublish",
          entityType: "blogPost",
          entityId: id,
          entityTitle: post.title,
          metadata: { bulk: true },
        });
      }
    }
  },
});

export const publishScheduled = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const scheduledPosts = await ctx.db
      .query("blogPosts")
      .filter((q) => 
        q.and(
          q.eq(q.field("status"), "draft"),
          q.neq(q.field("scheduledAt"), undefined),
          q.lte(q.field("scheduledAt"), now)
        )
      )
      .collect();

    for (const post of scheduledPosts) {
      await ctx.db.patch(post._id, {
        status: "published",
        publishedAt: post.scheduledAt || now,
        scheduledAt: undefined,
      });

      await ctx.runMutation(internal.activity.log, {
        actorEmail: "system@scheduler",
        action: "publish",
        entityType: "blogPost",
        entityId: post._id,
        entityTitle: post.title,
        metadata: { scheduled: true },
      });
    }
  },
});
