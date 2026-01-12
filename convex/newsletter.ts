import { v } from "convex/values";
import { mutation, action, query } from "./_generated/server";
import { api } from "./_generated/api";
import { Resend } from "resend";

export const subscribe = mutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    // Basic validation
    if (!email.includes("@")) {
      throw new Error("Invalid email address");
    }

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
    await ctx.scheduler.runAfter(0, api.newsletter.sendWelcomeEmail, { email });

    return { success: true, alreadySubscribed: false };
  },
});

export const sendWelcomeEmail = action({
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

export const listSubscribers = query({
  args: {},
  handler: async (ctx) => {
    // Only admin should call this - you might add auth check if needed
    return await ctx.db.query("newsletterSubscribers").collect();
  },
});
