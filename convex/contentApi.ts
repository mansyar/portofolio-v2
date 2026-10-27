import { ConvexError, v } from "convex/values";
import { internalMutation, internalQuery, type MutationCtx } from "./_generated/server";
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
 * What a slug may contain when a caller supplies one instead of deriving it.
 *
 * A derived slug satisfies this by construction, but an explicit one is caller
 * input: a space or slash produces a URL that does not route, and upper case
 * produces a second post that differs only by case.
 */
const SLUG_PATTERN = /^[a-z0-9][a-z0-9._-]*$/;

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

/**
 * Resolves tag slugs, creating the ones that do not exist yet. Duplicates in the
 * request collapse onto one id so a post never links the same tag twice.
 */
async function resolveTagIds(ctx: MutationCtx, rawTags: string[]): Promise<Id<"blogTags">[]> {
  const tagIds: Id<"blogTags">[] = [];

  for (const rawTag of rawTags) {
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

  return tagIds;
}

/**
 * Resolves a curated category. Unknown is an error: categories carry an order and
 * a description, so creating one implicitly would produce a list nobody curated.
 */
async function resolveCategoryId(
  ctx: MutationCtx,
  categorySlug: string
): Promise<Id<"blogCategories">> {
  const category = await ctx.db
    .query("blogCategories")
    .withIndex("by_slug", (q) => q.eq("slug", categorySlug))
    .first();

  if (!category) reject(400, `category not found: ${categorySlug}`);

  return category._id;
}

/**
 * Meters an accepted write against the credential's hourly budget.
 *
 * Called after validation so a rejected request costs nothing, and before the
 * write so a tight loop cannot outrun the limit.
 */
async function enforceWriteBudget(ctx: MutationCtx, fingerprint: string): Promise<void> {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const recentWrites = await ctx.db
    .query("rateLimits")
    .withIndex("by_identifier_action", (q) =>
      q.eq("identifier", fingerprint).eq("action", RATE_LIMIT_ACTION)
    )
    .filter((q) => q.gt(q.field("timestamp"), oneHourAgo))
    .collect();

  if (recentWrites.length >= WRITES_PER_HOUR) {
    reject(429, `rate limit reached: ${WRITES_PER_HOUR} writes per hour. try again later`);
  }

  await ctx.db.insert("rateLimits", {
    identifier: fingerprint,
    action: RATE_LIMIT_ACTION,
    timestamp: Date.now(),
  });
}

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
    if (!SLUG_PATTERN.test(slug)) {
      reject(
        400,
        "slug must use lowercase letters, digits, dots, hyphens, or underscores, and start with a letter or digit"
      );
    }

    const collision = await ctx.db
      .query("blogPosts")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (collision) reject(409, `slug already in use: ${slug}`);

    const categoryId =
      args.categorySlug === undefined ? undefined : await resolveCategoryId(ctx, args.categorySlug);

    const tagIds = await resolveTagIds(ctx, args.tagSlugs);

    await enforceWriteBudget(ctx, args.fingerprint);

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

export const update = internalMutation({
  args: {
    slug: v.string(),
    title: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    // Supplied as one unit by the action, so a body can never be stored without
    // the reading time measured from it.
    body: v.optional(v.object({ html: v.string(), readingTime: v.number() })),
    coverImageUrl: v.optional(v.string()),
    categorySlug: v.optional(v.string()),
    tagSlugs: v.optional(v.array(v.string())),
    fingerprint: v.string(),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db
      .query("blogPosts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (!post) reject(404, `post not found: ${args.slug}`);

    // Only what the caller sent is patched. An omitted field is not an empty
    // field: editing a headline must not erase tags, category, or cover image.
    const patch: {
      title?: string;
      excerpt?: string;
      content?: string;
      readingTime?: number;
      coverImageUrl?: string;
      categoryId?: Id<"blogCategories">;
      tagIds?: Id<"blogTags">[];
    } = {};

    if (args.title !== undefined) {
      const title = args.title.trim();
      if (title === "") reject(400, "title must not be empty");
      patch.title = title;
    }

    if (args.excerpt !== undefined) patch.excerpt = args.excerpt;
    if (args.coverImageUrl !== undefined) patch.coverImageUrl = args.coverImageUrl;

    if (args.body !== undefined) {
      if (args.body.html.trim() === "") reject(400, "body must not be empty");
      patch.content = args.body.html;
      patch.readingTime = args.body.readingTime;
    }

    if (args.categorySlug !== undefined) {
      patch.categoryId = await resolveCategoryId(ctx, args.categorySlug);
    }

    if (args.tagSlugs !== undefined) {
      patch.tagIds = await resolveTagIds(ctx, args.tagSlugs);
    }

    if (Object.keys(patch).length === 0) reject(400, "no fields to update");

    await enforceWriteBudget(ctx, args.fingerprint);
    await ctx.db.patch(post._id, patch);

    await ctx.runMutation(internal.activity.log, {
      actorEmail: CONTENT_API_ACTOR,
      action: "update",
      entityType: "blogPost",
      entityId: post._id,
      entityTitle: patch.title ?? post.title,
      metadata: { source: "content-api", fields: Object.keys(patch) },
    });

    return {
      id: post._id,
      slug: post.slug,
      status: post.status,
      updated: Object.keys(patch),
    };
  },
});

/**
 * Publishes or unpublishes a post. Idempotent by design: asking for the state a
 * post already holds succeeds without a second write, a second audit row, or a
 * second `publishedAt` stamp.
 */
export const setPublished = internalMutation({
  args: { slug: v.string(), publish: v.boolean(), fingerprint: v.string() },
  handler: async (ctx, args) => {
    const post = await ctx.db
      .query("blogPosts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (!post) reject(404, `post not found: ${args.slug}`);

    const target = args.publish ? "published" : "draft";

    if (post.status === target) {
      return {
        slug: post.slug,
        status: post.status,
        publishedAt: post.publishedAt ?? null,
        changed: false,
      };
    }

    await enforceWriteBudget(ctx, args.fingerprint);

    // A post that was published before keeps its original date through an
    // unpublish and a later republish.
    const publishedAt = args.publish ? (post.publishedAt ?? Date.now()) : post.publishedAt;

    await ctx.db.patch(post._id, { status: target, publishedAt });

    await ctx.runMutation(internal.activity.log, {
      actorEmail: CONTENT_API_ACTOR,
      action: args.publish ? "publish" : "unpublish",
      entityType: "blogPost",
      entityId: post._id,
      entityTitle: post.title,
      metadata: { source: "content-api" },
    });

    return { slug: post.slug, status: target, publishedAt: publishedAt ?? null, changed: true };
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
