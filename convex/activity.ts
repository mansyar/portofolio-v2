import { v } from "convex/values";
import { query, internalMutation } from "./_generated/server";
import { requireAdmin } from "./lib/auth";

/**
 * Internal mutation to log admin activity.
 */
export const log = internalMutation({
  args: {
    actorEmail: v.string(),
    action: v.union(
      v.literal("create"),
      v.literal("update"),
      v.literal("delete"),
      v.literal("publish"),
      v.literal("unpublish"),
      v.literal("toggle_visibility"),
      v.literal("bulk_delete"),
      v.literal("bulk_update")
    ),
    entityType: v.union(
      v.literal("project"),
      v.literal("skill"),
      v.literal("blogPost"),
      v.literal("usesItem"),
      v.literal("setting"),
      v.literal("media")
    ),
    entityId: v.string(),
    entityTitle: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("activityLogs", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

/**
 * List recent activity logs.
 */
export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("activityLogs")
      .withIndex("by_timestamp")
      .order("desc")
      .take(args.limit || 50);
  },
});
