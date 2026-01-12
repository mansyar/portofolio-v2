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
    const { email } = await requireAdmin(ctx);
    const id = await ctx.db.insert("usesItems", args);

    await ctx.runMutation(internal.activity.log, {
      actorEmail: email,
      action: "create",
      entityType: "usesItem",
      entityId: id,
      entityTitle: args.name,
    });

    return id;
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
    const { email } = await requireAdmin(ctx);
    const { id, ...data } = args;
    await ctx.db.patch(id, data);

    await ctx.runMutation(internal.activity.log, {
      actorEmail: email,
      action: "update",
      entityType: "usesItem",
      entityId: id,
      entityTitle: args.name,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("usesItems") },
  handler: async (ctx, args) => {
    const { email } = await requireAdmin(ctx);
    const item = await ctx.db.get(args.id);
    await ctx.db.delete(args.id);

    await ctx.runMutation(internal.activity.log, {
      actorEmail: email,
      action: "delete",
      entityType: "usesItem",
      entityId: args.id,
      entityTitle: item?.name,
    });
  },
});

export const toggleVisibility = mutation({
  args: { id: v.id("usesItems") },
  handler: async (ctx, args) => {
    const { email } = await requireAdmin(ctx);
    const item = await ctx.db.get(args.id);
    if (item) {
      const newVisibility = !item.isVisible;
      await ctx.db.patch(args.id, { isVisible: newVisibility });

      await ctx.runMutation(internal.activity.log, {
        actorEmail: email,
        action: "toggle_visibility",
        entityType: "usesItem",
        entityId: args.id,
        entityTitle: item.name,
        metadata: { isVisible: newVisibility },
      });
    }
  },
});

export const removeBulk = mutation({
  args: { ids: v.array(v.id("usesItems")) },
  handler: async (ctx, args) => {
    const { email } = await requireAdmin(ctx);
    for (const id of args.ids) {
      const item = await ctx.db.get(id);
      await ctx.db.delete(id);

      await ctx.runMutation(internal.activity.log, {
        actorEmail: email,
        action: "delete",
        entityType: "usesItem",
        entityId: id,
        entityTitle: item?.name,
        metadata: { bulk: true },
      });
    }
  },
});

export const toggleVisibilityBulk = mutation({
  args: { ids: v.array(v.id("usesItems")), isVisible: v.boolean() },
  handler: async (ctx, args) => {
    const { email } = await requireAdmin(ctx);
    for (const id of args.ids) {
      const item = await ctx.db.get(id);
      await ctx.db.patch(id, { isVisible: args.isVisible });

      await ctx.runMutation(internal.activity.log, {
        actorEmail: email,
        action: "toggle_visibility",
        entityType: "usesItem",
        entityId: id,
        entityTitle: item?.name,
        metadata: { isVisible: args.isVisible, bulk: true },
      });
    }
  },
});
