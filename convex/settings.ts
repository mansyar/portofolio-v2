import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

/**
 * Public query to fetch site settings for SEO and social links.
 */
export const getPublic = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("siteSettings").collect();
    
    // Transform array to key-value object
    return settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, unknown>);
  },
});

/**
 * Admin-only query to fetch all settings.
 */
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const settings = await ctx.db.query("siteSettings").collect();
    
    return settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, unknown>);
  },
});

/**
 * Create or update a single setting.
 */
export const set = mutation({
  args: {
    key: v.string(),
    value: v.any(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    
    const existing = await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
      
    if (existing) {
      await ctx.db.patch(existing._id, { value: args.value });
    } else {
      await ctx.db.insert("siteSettings", {
        key: args.key,
        value: args.value,
      });
    }
  },
});

/**
 * Create or update multiple settings at once.
 */
export const setBulk = mutation({
  args: {
    settings: v.any(), // Expected Record<string, any>
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    
    const keys = Object.keys(args.settings);
    
    for (const key of keys) {
      const value = args.settings[key];
      
      const existing = await ctx.db
        .query("siteSettings")
        .withIndex("by_key", (q) => q.eq("key", key))
        .unique();
        
      if (existing) {
        await ctx.db.patch(existing._id, { value });
      } else {
        await ctx.db.insert("siteSettings", {
          key,
          value,
        });
      }
    }
  },
});
