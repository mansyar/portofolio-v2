import { ConvexError, v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

/**
 * Content API internals.
 *
 * The HTTP action in `convex/http.ts` is the only caller: authentication and body
 * limits happen there, and every function here is `internal`, so none of this is
 * reachable through the Convex client API. That reachability argument is what
 * replaces `requireAdmin` on this path — there is no session to check because
 * there is no session, only a bearer token verified one layer up.
 */

/** Distinguishes an agent's writes from a human admin's in the activity log. */
export const CONTENT_API_ACTOR = "agent@content-api";

const WRITES_PER_HOUR = 60;
const RATE_LIMIT_ACTION = "content_api_write";
const DEFAULT_LIST_LIMIT = 20;
const MAX_LIST_LIMIT = 50;
const MAX_SLUG_LENGTH = 80;

/**
 * Signals a client error with the status the HTTP action should answer. A plain
 * `Error` would become a 500 and hide a fixable mistake from the caller.
 *
 * Declared as a function so the compiler treats a call as non-returning, which
 * lets it narrow `Doc | null` results after a guard.
 */
function reject(status: number, message: string): never {
  throw new ConvexError({ code: "content_api", status, message });
}

/**
 * Derives a URL slug from a title: lowercase, diacritics folded, everything but
 * letters and digits collapsed to a single hyphen. Returns an empty string when
 * the title has nothing usable, which the caller turns into a 400 rather than
 * storing a post at an unreachable URL.
 */
export const slugify = (title: string): string =>
  title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, "");

export const create = internalMutation({
  args: {
    title: v.string(),
    slug: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    html: v.string(),
    readingTime: v.number(),
    coverImageUrl: v.optional(v.string()),
    categorySlug: v.optional(v.string()),
    tagSlugs: v.array(v.string()),
    publish: v.boolean(),
    /** Stable per-token key for the write budget; never the token itself. */
    fingerprint: v.string(),
  },
  handler: async (ctx, args) => {
    const title = args.title.trim();
    if (title === "") reject(400, "title is required");

    const slug = args.slug ?? slugify(title);
    if (slug === "") {
      reject(400, "slug required: the title has no characters a slug can use");
    }

    const collision = await ctx.db
      .query("blogPosts")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (collision) reject(409, `slug already in use: ${slug}`);

    // Categories are curated (they carry an order and a description), so an
    // unknown one is a mistake in the request rather than something to create.
    let categoryId: Id<"blogCategories"> | undefined;
    if (args.categorySlug !== undefined) {
      const category = await ctx.db
        .query("blogCategories")
        .withIndex("by_slug", (q) => q.eq("slug", args.categorySlug ?? ""))
        .first();
      if (!category) reject(400, `category not found: ${args.categorySlug}`);
      categoryId = category._id;
    }

    // Tags are additive and cheap, so an unknown slug becomes a tag. The name
    // keeps the author's capitalisation; the slug is normalised.
    const tagIds: Id<"blogTags">[] = [];
    for (const rawTag of args.tagSlugs) {
      const tagSlug = slugify(rawTag);
      if (tagSlug === "") reject(400, `tag slug is empty: ${rawTag}`);

      const existing = await ctx.db
        .query("blogTags")
        .withIndex("by_slug", (q) => q.eq("slug", tagSlug))
        .first();

      if (existing) {
        if (!tagIds.includes(existing._id)) tagIds.push(existing._id);
        continue;
      }

      tagIds.push(await ctx.db.insert("blogTags", { name: rawTag.trim(), slug: tagSlug }));
    }

    // Metered after validation so a rejected request costs no budget, and before
    // the write so a loop cannot outrun the limit.
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentWrites = await ctx.db
      .query("rateLimits")
      .withIndex("by_identifier_action", (q) =>
        q.eq("identifier", args.fingerprint).eq("action", RATE_LIMIT_ACTION)
      )
      .filter((q) => q.gt(q.field("timestamp"), oneHourAgo))
      .collect();

    if (recentWrites.length >= WRITES_PER_HOUR) {
      reject(429, `rate limit reached: ${WRITES_PER_HOUR} writes per hour. try again later`);
    }

    await ctx.db.insert("rateLimits", {
      identifier: args.fingerprint,
      action: RATE_LIMIT_ACTION,
      timestamp: Date.now(),
    });

    const now = Date.now();
    const id = await ctx.db.insert("blogPosts", {
      slug,
      title,
      excerpt: args.excerpt,
      content: args.html,
      coverImageUrl: args.coverImageUrl,
      categoryId,
      tagIds,
      status: args.publish ? "published" : "draft",
      readingTime: args.readingTime,
      publishedAt: args.publish ? now : undefined,
    });

    await ctx.runMutation(internal.activity.log, {
      actorEmail: CONTENT_API_ACTOR,
      action: "create",
      entityType: "blogPost",
      entityId: id,
      entityTitle: title,
      metadata: { source: "content-api", status: args.publish ? "published" : "draft" },
    });

    return { id, slug, status: args.publish ? ("published" as const) : ("draft" as const) };
  },
});

/**
 * Reads one post whatever its status. Drafts are included deliberately: the
 * caller has already proven it holds the token, and an agent cannot edit what it
 * cannot read back.
 */
export const getBySlug = internalQuery({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) =>
    await ctx.db
      .query("blogPosts")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first(),
});

/** Lists posts for collision checks, newest first, with a bounded page size. */
export const list = internalQuery({
  args: {
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(
      Math.max(Math.floor(args.limit ?? DEFAULT_LIST_LIMIT), 1),
      MAX_LIST_LIMIT
    );

    const rows =
      args.status === undefined
        ? await ctx.db.query("blogPosts").order("desc").take(limit)
        : await ctx.db
            .query("blogPosts")
            .withIndex("by_status", (q) => q.eq("status", args.status ?? "draft"))
            .order("desc")
            .take(limit);

    return rows.map((post) => ({
      slug: post.slug,
      title: post.title,
      status: post.status,
      publishedAt: post.publishedAt ?? null,
      readingTime: post.readingTime ?? null,
    }));
  },
});
