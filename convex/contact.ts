import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

// =============================================================================
// Public Mutations
// =============================================================================

export const submit = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    // In a real app, you might want to rate limit here or trigger an email
    // via an internal action (using 'scheduler').
    
    await ctx.db.insert("contactSubmissions", {
      ...args,
      isRead: false,
    });

    return { success: true };
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
      .query("contactSubmissions")
      .order("desc")
      .collect();
  },
});

export const getById = query({
  args: { id: v.id("contactSubmissions") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.get(args.id);
  },
});

export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const unread = await ctx.db
      .query("contactSubmissions")
      .withIndex("by_read", (q) => q.eq("isRead", false))
      .collect();
    return unread.length;
  },
});

// =============================================================================
// Admin Mutations
// =============================================================================

export const markAsRead = mutation({
  args: { id: v.id("contactSubmissions"), isRead: v.boolean() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.id, { isRead: args.isRead });
  },
});

export const remove = mutation({
  args: { id: v.id("contactSubmissions") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});
