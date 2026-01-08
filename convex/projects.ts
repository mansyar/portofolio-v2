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
// Admin Queries & Mutations
// =============================================================================

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("projects").order("desc").collect();
  },
});

export const getById = query({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    shortDescription: v.optional(v.string()),
    fullDescription: v.optional(v.string()), 
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
    
    // Check slug uniqueness
    const existing = await ctx.db
      .query("projects")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    
    if (existing) {
      throw new Error(`Slug "${args.slug}" is already in use.`);
    }

    return await ctx.db.insert("projects", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("projects"),
    title: v.string(),
    slug: v.string(),
    shortDescription: v.optional(v.string()),
    fullDescription: v.optional(v.string()),
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
    const { id, ...updates } = args;

    // Check slug if changed
    const current = await ctx.db.get(id);
    if (!current) throw new Error("Project not found");

    if (current.slug !== updates.slug) {
       const existing = await ctx.db
        .query("projects")
        .withIndex("by_slug", (q) => q.eq("slug", updates.slug))
        .first();
      if (existing) throw new Error(`Slug "${updates.slug}" is already in use.`);
    }

    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});

export const toggleVisibility = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const project = await ctx.db.get(args.id);
    if (project) {
      await ctx.db.patch(args.id, { isVisible: !project.isVisible });
    }
  },
});

