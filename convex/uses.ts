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
      .query("usesItems")
      .withIndex("by_order")
      .filter((q) => q.eq(q.field("isVisible"), true))
      .collect();
  },
});

export const byCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("usesItems")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .filter((q) => q.eq(q.field("isVisible"), true))
      .collect();
  },
});

// =============================================================================
// Admin Queries
// =============================================================================

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("usesItems")
      .withIndex("by_order")
      .collect();
  },
});

export const getById = query({
  args: { id: v.id("usesItems") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.get(args.id);
  },
});

// =============================================================================
// Admin Mutations
// =============================================================================

export const create = mutation({
  args: {
    category: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    url: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    displayOrder: v.number(),
    isVisible: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("usesItems", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("usesItems"),
    category: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    url: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    displayOrder: v.number(),
    isVisible: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const remove = mutation({
  args: { id: v.id("usesItems") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});

export const toggleVisibility = mutation({
  args: { id: v.id("usesItems") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const item = await ctx.db.get(args.id);
    if (item) {
      await ctx.db.patch(args.id, { isVisible: !item.isVisible });
    }
  },
});
