import { query, mutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

// =============================================================================
// Internal Actions (HTTP requests)
// =============================================================================

/**
 * Sends a Slack notification when a new contact form is submitted.
 * Requires SLACK_WEBHOOK_URL environment variable to be set in Convex.
 */
export const sendSlackNotification = internalAction({
  args: {
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    message: v.string(),
  },
  handler: async (_ctx, args) => {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    
    if (!webhookUrl) {
      console.warn("SLACK_WEBHOOK_URL not configured - skipping notification");
      return;
    }

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blocks: [
            {
              type: "header",
              text: { type: "plain_text", text: "📬 New Contact Submission", emoji: true }
            },
            {
              type: "divider"
            },
            {
              type: "section",
              fields: [
                { type: "mrkdwn", text: `*From:*\n${args.name}` },
                { type: "mrkdwn", text: `*Email:*\n${args.email}` },
              ]
            },
            {
              type: "section",
              text: { type: "mrkdwn", text: `*Subject:*\n${args.subject}` }
            },
            {
              type: "section",
              text: { type: "mrkdwn", text: `*Message:*\n>>> ${args.message}` }
            },
            {
              type: "context",
              elements: [
                { type: "mrkdwn", text: `Submitted at ${new Date().toLocaleString()}` }
              ]
            }
          ]
        }),
      });

      if (!response.ok) {
        console.error("Failed to send Slack notification:", response.statusText);
      }
    } catch (error) {
      console.error("Error sending Slack notification:", error);
    }
  },
});

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
    // Save the submission to the database
    await ctx.db.insert("contactSubmissions", {
      ...args,
      isRead: false,
    });

    // Schedule Slack notification (runs immediately but non-blocking)
    await ctx.scheduler.runAfter(0, internal.contact.sendSlackNotification, {
      name: args.name,
      email: args.email,
      subject: args.subject,
      message: args.message,
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
