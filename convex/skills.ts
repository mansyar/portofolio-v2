import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";
import { internal } from "./_generated/api";

// =============================================================================
// Public Queries
// =============================================================================

/**
 * Get all visible skills, ordered by displayOrder.
 * Used on the public skills page.
 */
export const listVisible = query({
  args: {},
  handler: async (ctx) => {
    const skills = await ctx.db
      .query("skills")
      .withIndex("by_order")
      .filter((q) => q.eq(q.field("isVisible"), true))
      .collect();

    return skills;
  },
});

/**
 * Get visible skills by category.
 * Used for filtering on the skills page.
 */
export const byCategory = query({
  args: {
    category: v.union(
      v.literal("devops"),
      v.literal("backend"),
      v.literal("frontend"),
      v.literal("tools")
    ),
  },
  handler: async (ctx, args) => {
    const skills = await ctx.db
      .query("skills")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .filter((q) => q.eq(q.field("isVisible"), true))
      .collect();

    // Sort by displayOrder since we used category index
    return skills.sort((a, b) => a.displayOrder - b.displayOrder);
  },
});

/**
 * Get all unique skill categories that have visible skills.
 */
export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    const skills = await ctx.db
      .query("skills")
      .filter((q) => q.eq(q.field("isVisible"), true))
      .collect();

    const categories = [...new Set(skills.map((s) => s.category))];
    return categories;
  },
});

// =============================================================================
// Admin Queries
// =============================================================================

/**
 * Get all skills (including hidden ones).
 * Admin only.
 */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const skills = await ctx.db
      .query("skills")
      .withIndex("by_order")
      .collect();

    return skills;
  },
});

/**
 * Get a single skill by ID.
 * Admin only.
 */
export const getById = query({
  args: { id: v.id("skills") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.get(args.id);
  },
});

// =============================================================================
// Admin Mutations
// =============================================================================

/**
 * Create a new skill.
 * Admin only.
 */
export const create = mutation({
  args: {
    name: v.string(),
    category: v.union(
      v.literal("devops"),
      v.literal("backend"),
      v.literal("frontend"),
      v.literal("tools")
    ),
    icon: v.optional(v.string()),
    proficiency: v.number(),
    yearsOfExperience: v.optional(v.number()),
    description: v.optional(v.string()),
    displayOrder: v.number(),
    isVisible: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { email } = await requireAdmin(ctx);

    // Validate proficiency range
    if (args.proficiency < 0 || args.proficiency > 100) {
      throw new Error("Proficiency must be between 0 and 100");
    }

    const id = await ctx.db.insert("skills", args);

    await ctx.runMutation(internal.activity.log, {
      actorEmail: email,
      action: "create",
      entityType: "skill",
      entityId: id,
      entityTitle: args.name,
    });

    return id;
  },
});

/**
 * Update an existing skill.
 * Admin only.
 */
export const update = mutation({
  args: {
    id: v.id("skills"),
    name: v.optional(v.string()),
    category: v.optional(
      v.union(
        v.literal("devops"),
        v.literal("backend"),
        v.literal("frontend"),
        v.literal("tools")
      )
    ),
    icon: v.optional(v.string()),
    proficiency: v.optional(v.number()),
    yearsOfExperience: v.optional(v.number()),
    description: v.optional(v.string()),
    displayOrder: v.optional(v.number()),
    isVisible: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { email } = await requireAdmin(ctx);

    const { id, ...updates } = args;

    // Validate proficiency if provided
    if (
      updates.proficiency !== undefined &&
      (updates.proficiency < 0 || updates.proficiency > 100)
    ) {
      throw new Error("Proficiency must be between 0 and 100");
    }

    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );

    if (Object.keys(cleanUpdates).length === 0) {
      return; // Nothing to update
    }

    await ctx.db.patch(id, cleanUpdates);

    const skill = await ctx.db.get(id);
    await ctx.runMutation(internal.activity.log, {
      actorEmail: email,
      action: "update",
      entityType: "skill",
      entityId: id,
      entityTitle: skill?.name,
      metadata: { fields: Object.keys(cleanUpdates) },
    });
  },
});

/**
 * Delete a skill.
 * Admin only.
 */
export const remove = mutation({
  args: { id: v.id("skills") },
  handler: async (ctx, args) => {
    const { email } = await requireAdmin(ctx);
    const skill = await ctx.db.get(args.id);
    await ctx.db.delete(args.id);

    await ctx.runMutation(internal.activity.log, {
      actorEmail: email,
      action: "delete",
      entityType: "skill",
      entityId: args.id,
      entityTitle: skill?.name,
    });
  },
});

/**
 * Reorder skills by updating their displayOrder.
 * Admin only.
 */
export const reorder = mutation({
  args: {
    orderedIds: v.array(v.id("skills")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Update each skill's displayOrder based on position in array
    for (let i = 0; i < args.orderedIds.length; i++) {
      await ctx.db.patch(args.orderedIds[i], { displayOrder: i });
    }
  },
});

/**
 * Toggle visibility of a skill.
 * Admin only.
 */
export const toggleVisibility = mutation({
  args: { id: v.id("skills") },
  handler: async (ctx, args) => {
    const { email } = await requireAdmin(ctx);

    const skill = await ctx.db.get(args.id);
    if (!skill) {
      throw new Error("Skill not found");
    }

    const newVisibility = !skill.isVisible;
    await ctx.db.patch(args.id, { isVisible: newVisibility });

    await ctx.runMutation(internal.activity.log, {
      actorEmail: email,
      action: "toggle_visibility",
      entityType: "skill",
      entityId: args.id,
      entityTitle: skill.name,
      metadata: { isVisible: newVisibility },
    });
  },
});

export const removeBulk = mutation({
  args: { ids: v.array(v.id("skills")) },
  handler: async (ctx, args) => {
    const { email } = await requireAdmin(ctx);
    for (const id of args.ids) {
      const skill = await ctx.db.get(id);
      await ctx.db.delete(id);

      await ctx.runMutation(internal.activity.log, {
        actorEmail: email,
        action: "delete",
        entityType: "skill",
        entityId: id,
        entityTitle: skill?.name,
        metadata: { bulk: true },
      });
    }
  },
});

export const toggleVisibilityBulk = mutation({
  args: { ids: v.array(v.id("skills")), isVisible: v.boolean() },
  handler: async (ctx, args) => {
    const { email } = await requireAdmin(ctx);
    for (const id of args.ids) {
      const skill = await ctx.db.get(id);
      await ctx.db.patch(id, { isVisible: args.isVisible });

      await ctx.runMutation(internal.activity.log, {
        actorEmail: email,
        action: "toggle_visibility",
        entityType: "skill",
        entityId: id,
        entityTitle: skill?.name,
        metadata: { isVisible: args.isVisible, bulk: true },
      });
    }
  },
});
