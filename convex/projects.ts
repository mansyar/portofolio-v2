import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

// =============================================================================
// Public Queries
// =============================================================================

export const listVisible = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("projects")
      .withIndex("by_order")
      .filter((q) => q.eq(q.field("isVisible"), true))
      .collect();
  },
});

export const listFeatured = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("projects")
      .withIndex("by_featured", (q) => q.eq("isFeatured", true))
      .filter((q) => q.eq(q.field("isVisible"), true))
      .collect();
  },
});

export const bySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const project = await ctx.db
      .query("projects")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!project || !project.isVisible) {
      return null;
    }

    return project;
  },
});

export const getUniqueTechStacks = query({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db
      .query("projects")
      .filter((q) => q.eq(q.field("isVisible"), true))
      .collect();

    const techStacks = new Set<string>();
    projects.forEach((p) => {
      p.techStack.forEach((t) => techStacks.add(t));
    });

    return Array.from(techStacks).sort();
  },
});

// =============================================================================
// Admin Queries & Mutations (Stubs / Basic Implementation)
// =============================================================================

export const create = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    shortDescription: v.optional(v.string()),
    fullDescription: v.optional(v.string()), // can be markdown or generic text
    thumbnailUrl: v.optional(v.string()),
    images: v.array(v.string()),
    techStack: v.array(v.string()),
    liveDemoUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    isFeatured: v.boolean(),
    displayOrder: v.number(),
    isVisible: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("projects", args);
  },
});
