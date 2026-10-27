import { query, mutation, internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { ConvexError, v } from "convex/values";
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
              text: { type: "plain_text", text: "📬 New Contact Submission", emoji: true },
            },
            {
              type: "divider",
            },
            {
              type: "section",
              fields: [
                { type: "mrkdwn", text: `*From:*\n${args.name}` },
                { type: "mrkdwn", text: `*Email:*\n${args.email}` },
              ],
            },
            {
              type: "section",
              text: { type: "mrkdwn", text: `*Subject:*\n${args.subject}` },
            },
            {
              type: "section",
              text: { type: "mrkdwn", text: `*Message:*\n>>> ${args.message}` },
            },
            {
              type: "context",
              elements: [{ type: "mrkdwn", text: `Submitted at ${new Date().toLocaleString()}` }],
            },
          ],
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

export const submit = internalMutation({
  args: {
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    message: v.string(),
    honeypot: v.optional(v.string()),
    /**
     * Derived by the HTTP endpoint from the request connection. It is an
     * argument here only because the endpoint and the write are separate
     * functions; no browser-facing function accepts it.
     */
    identifier: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Honeypot check (Bot detection)
    if (args.honeypot) {
      // Bot detected - silently succeed to not tip off the bot
      console.warn("Honeypot filled - bot submission ignored");
      return { success: true };
    }

    // 2. Rate limiting check (max 3 submissions per hour per connection)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentAttempts = await ctx.db
      .query("rateLimits")
      .withIndex("by_identifier_action", (q) =>
        q.eq("identifier", args.identifier).eq("action", "contact_submit")
      )
      .filter((q) => q.gt(q.field("timestamp"), oneHourAgo))
      .collect();

    if (recentAttempts.length >= 3) {
      // `ConvexError` keeps the message and the code intact across the action
      // boundary, so the endpoint can answer 429 instead of a generic failure.
      throw new ConvexError({
        code: "rate_limited",
        message: "Too many submissions. Please try again later.",
      });
    }

    // 3. Log this attempt
    await ctx.db.insert("rateLimits", {
      identifier: args.identifier,
      action: "contact_submit",
      timestamp: Date.now(),
    });

    // 4. Save the submission to the database
    await ctx.db.insert("contactSubmissions", {
      name: args.name,
      email: args.email,
      subject: args.subject,
      message: args.message,
      isRead: false,
    });

    // 5. Schedule Slack notification (runs immediately but non-blocking)
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
    return await ctx.db.query("contactSubmissions").order("desc").collect();
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
