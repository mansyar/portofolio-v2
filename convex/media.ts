import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// =============================================================================
// Admin Actions
// =============================================================================

/**
 * Upload a file directly via Convex action.
 * This bypasses CORS issues often found with the built-in storage upload URL
 * on self-hosted instances.
 */
export const upload = action({
  args: {
    fileData: v.any(), // ArrayBuffer
    filename: v.string(),
    mimeType: v.string(),
  },
  handler: async (ctx, args): Promise<{ storageId: string; mediaId: string }> => {
    await requireAdmin(ctx);

    // 1. Convert ArrayBuffer to Blob
    // ctx.storage.store expects a Blob, but Convex actions receive ArrayBuffer for binary data
    const blob = new Blob([args.fileData], { type: args.mimeType });

    // 2. Store the file in Convex storage
    const storageId = (await ctx.storage.store(blob)) as string;

    // 2. Save metadata via mutation
    const mediaId = (await ctx.runMutation(api.media.saveFile, {
      storageId: storageId as Id<"_storage">,
      filename: args.filename,
      mimeType: args.mimeType,
      size: args.fileData.byteLength,
    })) as string;

    return { storageId, mediaId };
  },
});

// =============================================================================
// Admin Mutations
// =============================================================================

/**
 * Generate a short-lived URL for uploading a file to Convex storage.
 * Step 1 of the upload process.
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
 * Step 2 of the upload process (after client uploads to the URL).
 */
export const saveFile = mutation({
  args: {
    storageId: v.id("_storage"),
    username: v.optional(v.string()), // Optional user attribution
    filename: v.string(),
    mimeType: v.string(),
    size: v.number(),
    altText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Extract username if needed for logging/attribution, but unused for now
    // const { username } = args;

    // Use original filename or generated one? Client sends filename.
    // We'll store exactly what's passed.
    
    const id = await ctx.db.insert("mediaFiles", {
        storageId: args.storageId,
        filename: args.filename,
        originalFilename: args.filename, // For now assume same
        mimeType: args.mimeType,
        size: args.size,
        altText: args.altText,
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
    await requireAdmin(ctx);

    const file = await ctx.db.get(args.id);
    if (!file) {
      throw new Error("File not found");
    }

    // Delete from storage
    await ctx.storage.delete(file.storageId);

    // Delete metadata
    await ctx.db.delete(args.id);
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

    // Generate URLs for all files
    // Note: This might be slow if there are many files.
    // Pagination would be better for a large library.
    const filesWithUrls = await Promise.all(
      files.map(async (file) => ({
        ...file,
        url: await ctx.storage.getUrl(file.storageId),
      }))
    );

    return filesWithUrls;
  },
});
