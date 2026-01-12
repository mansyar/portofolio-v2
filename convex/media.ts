import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";
import { internal } from "./_generated/api";

// =============================================================================
// Admin Mutations
// =============================================================================

/**
 * Generate a short-lived URL for uploading a file to Convex storage.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Save metadata for an uploaded file.
 */
export const saveFile = mutation({
  args: {
    storageId: v.id("_storage"),
    username: v.optional(v.string()), 
    filename: v.string(),
    mimeType: v.string(),
    size: v.number(),
    altText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { email } = await requireAdmin(ctx);
    
    const id = await ctx.db.insert("mediaFiles", {
        storageId: args.storageId,
        filename: args.filename,
        originalFilename: args.filename,
        mimeType: args.mimeType,
        size: args.size,
        altText: args.altText,
    });

    await ctx.runMutation(internal.activity.log, {
      actorEmail: email,
      action: "create",
      entityType: "media", 
      entityId: id,
      entityTitle: args.filename,
      metadata: { mimeType: args.mimeType },
    });

    return id;
  },
});

/**
 * Delete a file from storage and remove its metadata.
 */
export const remove = mutation({
  args: { id: v.id("mediaFiles") },
  handler: async (ctx, args) => {
    const { email } = await requireAdmin(ctx);

    const file = await ctx.db.get(args.id);
    if (!file) {
      throw new Error("File not found");
    }

    // Delete from storage
    await ctx.storage.delete(file.storageId);

    // Delete metadata
    await ctx.db.delete(args.id);

    await ctx.runMutation(internal.activity.log, {
      actorEmail: email,
      action: "delete",
      entityType: "media", 
      entityId: args.id,
      entityTitle: file.filename,
    });
  },
});

// =============================================================================
// Admin Queries
// =============================================================================

/**
 * List all media files with their signed URLs.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const files = await ctx.db
      .query("mediaFiles")
      .order("desc")
      .collect();

    const filesWithUrls = await Promise.all(
      files.map(async (file) => ({
        ...file,
        url: await ctx.storage.getUrl(file.storageId),
      }))
    );

    return filesWithUrls;
  },
});
