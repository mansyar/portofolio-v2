"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { 
  ALLOWED_MIME_TYPES, 
  MAX_FILE_SIZE, 
  isAllowedMimeType, 
  formatFileSize 
} from "./lib/validation";

/**
 * Upload a file directly via Convex action.
 * Uses sharp for image optimization if requested.
 */
export const upload = action({
  args: {
    fileData: v.any(), // ArrayBuffer
    filename: v.string(),
    mimeType: v.string(),
    shouldOptimize: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<{ storageId: string; mediaId: string }> => {
    await requireAdmin(ctx);

    // 1. Validate file type
    if (!isAllowedMimeType(args.mimeType)) {
      throw new Error(
        `Invalid file type: ${args.mimeType}. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`
      );
    }

    // 2. Validate file size
    const fileSize = args.fileData.byteLength;
    if (fileSize > MAX_FILE_SIZE) {
      throw new Error(
        `File too large: ${formatFileSize(fileSize)}. Maximum allowed: ${formatFileSize(MAX_FILE_SIZE)}`
      );
    }

    let finalFileData = args.fileData;
    let finalMimeType = args.mimeType;
    let finalSize = fileSize;

    // 3. Optional Image Optimization
    if (args.shouldOptimize && args.mimeType.startsWith("image/") && args.mimeType !== "image/svg+xml") {
      try {
        const sharp = (await import("sharp")).default;
        const buffer = Buffer.from(args.fileData);
        const optimizedBuffer = await sharp(buffer)
          .resize({ width: 1600, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();
        
        finalFileData = optimizedBuffer.buffer;
        finalMimeType = "image/webp";
        finalSize = optimizedBuffer.byteLength;
      } catch (err) {
        console.error("Optimization failed, using original:", err);
      }
    }

    // 4. Store the file in Convex storage
    const blob = new Blob([finalFileData], { type: finalMimeType });
    const storageId = (await ctx.storage.store(blob)) as string;

    // 5. Save metadata via mutation
    const mediaId = (await ctx.runMutation(api.media.saveFile, {
      storageId: storageId as Id<"_storage">,
      filename: args.filename,
      mimeType: finalMimeType,
      size: finalSize,
    })) as string;

    return { storageId, mediaId };
  },
});
