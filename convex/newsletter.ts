import { v } from "convex/values";
import { mutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Resend } from "resend";

export const subscribe = mutation({
  args: { email: v.string(), clientIp: v.string() },
  handler: async (ctx, { email, clientIp }) => {
    // Basic validation
    if (!email.includes("@")) {
      throw new Error("Invalid email address");
    }

    // Rate limiting. `subscribe` is public by design, so the limit - not auth -
    // is what stops enumeration and mail-bombing. It is enforced on two
    // independent keys, because either one alone is escapable:
    //
    //   - the caller's IP bounds total volume from one source, but the address
    //     is resolved from request headers and then supplied by the client, so
    //     a caller who varies it gets unlimited attempts;
    //   - the address bounds attempts against one inbox, and cannot be varied
    //     without targeting a different inbox.
    //
    // Together they mean neither rotating the IP nor replaying one address
    // defeats the limit.
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const normalizedEmail = email.trim().toLowerCase();

    const recentFromIp = await ctx.db
      .query("rateLimits")
      .withIndex("by_identifier_action", (q) =>
        q.eq("identifier", clientIp).eq("action", "newsletter_subscribe")
      )
      .filter((q) => q.gt(q.field("timestamp"), oneHourAgo))
      .collect();

    const recentForEmail = await ctx.db
      .query("rateLimits")
      .withIndex("by_identifier_action", (q) =>
        q.eq("identifier", normalizedEmail).eq("action", "newsletter_subscribe_email")
      )
      .filter((q) => q.gt(q.field("timestamp"), oneHourAgo))
      .collect();

    if (recentFromIp.length >= 5 || recentForEmail.length >= 5) {
      throw new Error("Too many attempts. Please try again later.");
    }

    // Logged before the subscriber write so that a repeat subscribe to an
    // already-active address still counts against both limits.
    await ctx.db.insert("rateLimits", {
      identifier: clientIp,
      action: "newsletter_subscribe",
      timestamp: Date.now(),
    });
    await ctx.db.insert("rateLimits", {
      identifier: normalizedEmail,
      action: "newsletter_subscribe_email",
      timestamp: Date.now(),
    });

    const existing = await ctx.db
      .query("newsletterSubscribers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (existing) {
      if (existing.status === "active") {
        return { success: true, alreadySubscribed: true };
      }
      // Re-subscribe if they were unsubscribed
      await ctx.db.patch(existing._id, {
        status: "active",
        subscribedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("newsletterSubscribers", {
        email,
        subscribedAt: Date.now(),
        status: "active",
      });
    }

    // Trigger welcome email action
    await ctx.scheduler.runAfter(0, internal.newsletter.sendWelcomeEmail, { email });

    return { success: true, alreadySubscribed: false };
  },
});

export const sendWelcomeEmail = internalAction({
  args: { email: v.string() },
  handler: async (_ctx, { email }) => {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not set");
      return;
    }

    const resend = new Resend(resendApiKey);

    try {
      await resend.emails.send({
        from: "Ansyar <newsletter@ansyar-world.top>",
        to: email,
        subject: "Welcome to Ansyar's Newsletter!",
        html: `
          <div style="font-family: monospace; background: #000; color: #0f0; padding: 20px;">
            <h1>$ subscribe --success</h1>
            <p>> Thank you for joining my newsletter!</p>
            <p>> You'll receive updates on new blog posts and projects.</p>
            <br />
            <p>-- <br />Ansyar</p>
          </div>
        `,
      });
    } catch (error) {
      console.error("Failed to send welcome email:", error);
    }
  },
});
