import { v } from "convex/values";
import { query, mutation, internalMutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireAdmin } from "./lib/auth";
import { Resend } from "resend";
import { ConvexError } from "convex/values";
import { buildWelcomeEmailHtml } from "./lib/welcomeEmail";

/**
 * One address is one subscriber. Trimming and lowercasing before every comparison
 * keeps `Ana@Example.com ` from becoming a second row next to `ana@example.com`.
 */
const normalizeEmail = (email: string): string => email.trim().toLowerCase();

/**
 * Opt-out token. Stored in plaintext because it only authorises unsubscribing that
 * address, and a database read that could hash it already exposes the address.
 */
const createUnsubscribeToken = (): string => crypto.randomUUID();

export const subscribe = internalMutation({
  args: { email: v.string(), identifier: v.union(v.string(), v.null()) },
  handler: async (ctx, { email, identifier }) => {
    const normalized = normalizeEmail(email);

    // Basic validation
    if (!normalized.includes("@")) {
      throw new Error("Invalid email address");
    }

    // Rate limiting. The endpoint in `convex/http.ts` enforces the limit - not
    // auth - because this path is public by design. Two independent keys are
    // checked, and only the first is optional:
    //
    //   - the connection identity, derived from request headers by the HTTP
    //     endpoint, bounds total volume from one source and cannot be chosen by
    //     the caller. It is `null` when the request carries no address the proxy
    //     vouched for, in which case this bucket is skipped rather than shared;
    //   - the normalized address bounds attempts against one inbox, and cannot
    //     be varied without targeting a different inbox.
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const normalizedEmail = normalized;

    const recentFromIdentity =
      identifier === null
        ? []
        : await ctx.db
            .query("rateLimits")
            .withIndex("by_identifier_action", (q) =>
              q.eq("identifier", identifier).eq("action", "newsletter_subscribe")
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

    if (recentFromIdentity.length >= 5 || recentForEmail.length >= 5) {
      throw new ConvexError({
        code: "rate_limited",
        message: "Too many attempts. Please try again later.",
      });
    }

    // Logged before the subscriber write so that a repeat subscribe to an
    // already-active address still counts against both limits. An unresolved
    // identity writes no row at all, so no placeholder bucket can fill up.
    if (identifier !== null) {
      await ctx.db.insert("rateLimits", {
        identifier,
        action: "newsletter_subscribe",
        timestamp: Date.now(),
      });
    }
    await ctx.db.insert("rateLimits", {
      identifier: normalizedEmail,
      action: "newsletter_subscribe_email",
      timestamp: Date.now(),
    });

    // The lookup uses the normalized address, matching how it is stored below.
    const existing = await ctx.db
      .query("newsletterSubscribers")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .unique();

    let token: string;

    if (existing) {
      if (existing.status === "active") {
        return { success: true, alreadySubscribed: true };
      }
      // Re-subscribe if they were unsubscribed. The token rotates so links in the
      // mail that prompted the opt-out stop working.
      token = createUnsubscribeToken();
      await ctx.db.patch(existing._id, {
        status: "active",
        subscribedAt: Date.now(),
        unsubscribeToken: token,
        unsubscribedAt: undefined,
      });
    } else {
      token = createUnsubscribeToken();
      await ctx.db.insert("newsletterSubscribers", {
        email: normalizedEmail,
        subscribedAt: Date.now(),
        status: "active",
        unsubscribeToken: token,
      });
    }

    // Trigger welcome email action. The token travels with it so the mail carries a
    // working opt-out link without a second lookup.
    await ctx.scheduler.runAfter(0, internal.newsletter.sendWelcomeEmail, {
      email: normalizedEmail,
      token,
    });

    return { success: true, alreadySubscribed: false };
  },
});

/**
 * One-off backfill for subscribers written before normalization and tokens existed.
 * Lowercases every address, folds duplicates onto the earliest subscription, and gives
 * each surviving row a token. Idempotent: it only writes rows that differ, so a second
 * run reports zero changes. Run with `npx convex run newsletter:normalizeSubscribers`.
 */
export const normalizeSubscribers = internalMutation({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("newsletterSubscribers").collect();
    const groups = new Map<string, (typeof rows)[number][]>();

    for (const row of rows) {
      const key = normalizeEmail(row.email);
      const group = groups.get(key);
      if (group) group.push(row);
      else groups.set(key, [row]);
    }

    let normalized = 0;
    let duplicatesRemoved = 0;
    let tokensBackfilled = 0;

    for (const [email, group] of groups) {
      // The earliest subscription is the record that survives a merge.
      const [survivor, ...duplicates] = [...group].sort((a, b) => a.subscribedAt - b.subscribedAt);
      const status = group.some((row) => row.status === "active") ? "active" : "unsubscribed";
      const needsWrite =
        survivor.email !== email || !survivor.unsubscribeToken || survivor.status !== status;

      if (survivor.email !== email) normalized += 1;
      if (!survivor.unsubscribeToken) tokensBackfilled += 1;

      if (needsWrite) {
        await ctx.db.patch(survivor._id, {
          email,
          status,
          unsubscribeToken: survivor.unsubscribeToken ?? createUnsubscribeToken(),
        });
      }

      for (const duplicate of duplicates) {
        await ctx.db.delete(duplicate._id);
        duplicatesRemoved += 1;
      }
    }

    return { scanned: rows.length, normalized, duplicatesRemoved, tokensBackfilled };
  },
});

/**
 * Opt out with the token from the email. Possession of the token is the authorisation, so
 * no account is needed; an unknown token performs no write and returns the same result as
 * a known one, because a distinguishable answer would reveal which tokens exist.
 */
export const unsubscribe = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const subscriber = await ctx.db
      .query("newsletterSubscribers")
      .withIndex("by_token", (q) => q.eq("unsubscribeToken", token))
      .first();

    if (subscriber && subscriber.status === "active") {
      await ctx.db.patch(subscriber._id, {
        status: "unsubscribed",
        unsubscribedAt: Date.now(),
      });
    }

    return { success: true, status: "unsubscribed" as const };
  },
});

/**
 * Subscriber list for the CMS. Guarded on every call, and deliberately not named
 * `listSubscribers`: the public function of that name was removed on purpose and a
 * regression test asserts it stays gone. Tokens stay server-side.
 */
export const listForAdmin = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const rows = await ctx.db.query("newsletterSubscribers").collect();

    return rows
      .map(({ email, status, subscribedAt, unsubscribedAt }) => ({
        email,
        status,
        subscribedAt,
        unsubscribedAt,
      }))
      .sort((a, b) => b.subscribedAt - a.subscribedAt);
  },
});

export const sendWelcomeEmail = internalAction({
  args: { email: v.string(), token: v.optional(v.string()) },
  handler: async (_ctx, { email, token }) => {
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
        html: buildWelcomeEmailHtml(token),
      });
    } catch (error) {
      console.error("Failed to send welcome email:", error);
    }
  },
});
