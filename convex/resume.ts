import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

// =============================================================================
// Public Queries
// =============================================================================

export const getProfile = query({
  args: {},
  handler: async (ctx) => {
    // Singleton pattern: just get the first one usually
    const profile = await ctx.db.query("resumeProfile").first();
    return profile;
  },
});

export const getExperiences = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("workExperiences")
      .withIndex("by_order")
      .filter((q) => q.eq(q.field("isVisible"), true))
      .collect();
  },
});

export const getEducation = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("education")
      .withIndex("by_order")
      .filter((q) => q.eq(q.field("isVisible"), true))
      .collect();
  },
});

export const getCertifications = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("certifications")
      .withIndex("by_order")
      .filter((q) => q.eq(q.field("isVisible"), true))
      .collect();
  },
});

export const listAllExperiences = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("workExperiences").order("desc").collect();
  },
});

export const listAllEducation = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("education").order("desc").collect();
  },
});

export const listAllCertifications = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("certifications").order("desc").collect();
  },
});

// =============================================================================
// Admin Mutations
// =============================================================================

export const updateProfile = mutation({
  args: {
    fullName: v.string(),
    title: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    location: v.optional(v.string()),
    summary: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    services: v.optional(v.array(v.string())),
    interests: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.query("resumeProfile").first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("resumeProfile", args);
    }
  },
});

export const createExperience = mutation({
  args: {
    company: v.string(),
    role: v.string(),
    location: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    description: v.optional(v.string()),
    displayOrder: v.number(),
    isVisible: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("workExperiences", args);
  },
});

export const updateExperience = mutation({
  args: {
    id: v.id("workExperiences"),
    company: v.string(),
    role: v.string(),
    location: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    description: v.optional(v.string()),
    displayOrder: v.number(),
    isVisible: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const deleteExperience = mutation({
  args: { id: v.id("workExperiences") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});

export const createEducation = mutation({
  args: {
    institution: v.string(),
    degree: v.string(),
    field: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    description: v.optional(v.string()),
    displayOrder: v.number(),
    isVisible: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("education", args);
  },
});

export const updateEducation = mutation({
  args: {
    id: v.id("education"),
    institution: v.string(),
    degree: v.string(),
    field: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    description: v.optional(v.string()),
    displayOrder: v.number(),
    isVisible: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const deleteEducation = mutation({
  args: { id: v.id("education") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});

export const createCertification = mutation({
  args: {
    name: v.string(),
    issuer: v.string(),
    issueDate: v.string(),
    expiryDate: v.optional(v.string()),
    credentialUrl: v.optional(v.string()),
    displayOrder: v.number(),
    isVisible: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("certifications", args);
  },
});

export const updateCertification = mutation({
  args: {
    id: v.id("certifications"),
    name: v.string(),
    issuer: v.string(),
    issueDate: v.string(),
    expiryDate: v.optional(v.string()),
    credentialUrl: v.optional(v.string()),
    displayOrder: v.number(),
    isVisible: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const deleteCertification = mutation({
  args: { id: v.id("certifications") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});
