import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";
import { internal } from "./_generated/api";

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

export const getRelated = query({
  args: { 
    currentProjectId: v.id("projects"),
    limit: v.optional(v.number()) 
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 3;
    const currentProject = await ctx.db.get(args.currentProjectId);
    if (!currentProject) return [];

    const allProjects = await ctx.db
      .query("projects")
      .filter((q) => q.eq(q.field("isVisible"), true))
      .collect();

    // Score projects by number of shared tech stack items
    const scored = allProjects
      .filter((p) => p._id !== args.currentProjectId)
      .map((p) => ({
        ...p,
        sharedTech: p.techStack.filter((t) => 
          currentProject.techStack.includes(t)
        ).length,
      }))
      .filter((p) => p.sharedTech > 0)
      .sort((a, b) => b.sharedTech - a.sharedTech);

    return scored.slice(0, limit);
  },
});

// =============================================================================
// Admin Queries & Mutations
// =============================================================================

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("projects")
      .withIndex("by_order")
      .collect();
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
    challenge: v.optional(v.string()),
    approach: v.optional(v.string()),
    outcome: v.optional(v.string()),
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

    const id = await ctx.db.insert("projects", args);

    await ctx.runMutation(internal.activity.log, {
      actorEmail: (await requireAdmin(ctx)).email,
      action: "create",
      entityType: "project",
      entityId: id,
      entityTitle: args.title,
    });

    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("projects"),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    shortDescription: v.optional(v.string()),
    fullDescription: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    techStack: v.optional(v.array(v.string())),
    liveDemoUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    isFeatured: v.optional(v.boolean()),
    displayOrder: v.optional(v.number()),
    isVisible: v.optional(v.boolean()),
    challenge: v.optional(v.string()),
    approach: v.optional(v.string()),
    outcome: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...updates } = args;

    // Check slug if changed
    if (updates.slug) {
      const newSlug = updates.slug;
      const current = await ctx.db.get(id);
      if (!current) throw new Error("Project not found");
  
      if (current.slug !== newSlug) {
         const existing = await ctx.db
          .query("projects")
          .withIndex("by_slug", (q) => q.eq("slug", newSlug))
          .first();
        if (existing) throw new Error(`Slug "${newSlug}" is already in use.`);
      }
    }

    // Filter out undefined
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );

    if (Object.keys(cleanUpdates).length > 0) {
      await ctx.db.patch(id, cleanUpdates);
      
      const project = await ctx.db.get(id);
      await ctx.runMutation(internal.activity.log, {
        actorEmail: (await requireAdmin(ctx)).email,
        action: "update",
        entityType: "project",
        entityId: id,
        entityTitle: project?.title,
        metadata: { fields: Object.keys(cleanUpdates) },
      });
    }
  },
});

export const remove = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.id);
    await ctx.db.delete(args.id);

    await ctx.runMutation(internal.activity.log, {
      actorEmail: (await requireAdmin(ctx)).email,
      action: "delete",
      entityType: "project",
      entityId: args.id,
      entityTitle: project?.title,
    });
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

export const reorder = mutation({
  args: {
    orderedIds: v.array(v.id("projects")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    for (let i = 0; i < args.orderedIds.length; i++) {
      await ctx.db.patch(args.orderedIds[i], { displayOrder: i });
    }
  },
});


export const removeBulk = mutation({
  args: { ids: v.array(v.id("projects")) },
  handler: async (ctx, args) => {
    const { email } = await requireAdmin(ctx);
    for (const id of args.ids) {
      const project = await ctx.db.get(id);
      await ctx.db.delete(id);
      
      await ctx.runMutation(internal.activity.log, {
        actorEmail: email,
        action: "delete",
        entityType: "project",
        entityId: id,
        entityTitle: project?.title,
        metadata: { bulk: true },
      });
    }
  },
});

export const toggleVisibilityBulk = mutation({
  args: { ids: v.array(v.id("projects")), isVisible: v.boolean() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    for (const id of args.ids) {
      await ctx.db.patch(id, { isVisible: args.isVisible });
    }
  },
});

export const toggleFeaturedBulk = mutation({
  args: { ids: v.array(v.id("projects")), isFeatured: v.boolean() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    for (const id of args.ids) {
      await ctx.db.patch(id, { isFeatured: args.isFeatured });
    }
  },
});
