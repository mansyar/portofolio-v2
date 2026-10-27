// @vitest-environment edge-runtime
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { convexTest, type TestConvex } from "convex-test";
import schema from "../schema";
import * as contentApiModule from "../contentApi";
import { hashToken } from "../lib/contentAuth";
import { api } from "../_generated/api";

// `convex-test` loads a function's module out of this map, so every Convex
// module has to be listed. The `_generated` directory is what lets the library
// work out the module root; the test files are excluded so they are not
// mistaken for Convex modules.
const modules = import.meta.glob(["../**/*.ts", "!../__tests__/**"]);

const TOKEN = "content-api-test-token";
// The configured digest is what the deployment holds; the fixture keeps the raw
// token out of the environment.
const TOKEN_HASH = await hashToken(TOKEN);
const AUTH = { authorization: `Bearer ${TOKEN}` };

type FetchLike = (path: string, init?: RequestInit) => Promise<Response>;

const createPost = (
  doFetch: FetchLike,
  body: Record<string, unknown>,
  headers: Record<string, string> = {}
): Promise<Response> =>
  doFetch("/content/blog", {
    method: "POST",
    headers: { "content-type": "application/json", ...AUTH, ...headers },
    body: JSON.stringify(body),
  });

const getPost = (doFetch: FetchLike, slug: string) =>
  doFetch(`/content/blog/${slug}`, { headers: AUTH });

const draftBody = (overrides: Record<string, unknown> = {}) => ({
  title: "Deploying with Convex",
  bodyMarkdown: "## Steps\n\nRun **deploy** and wait.",
  ...overrides,
});

const posts = async (t: TestConvex<typeof schema>) =>
  t.run(async (ctx) => await ctx.db.query("blogPosts").collect());

const logs = async (t: TestConvex<typeof schema>) =>
  t.run(async (ctx) => await ctx.db.query("activityLogs").collect());

const tags = async (t: TestConvex<typeof schema>) =>
  t.run(async (ctx) => await ctx.db.query("blogTags").collect());

describe("POST /content/blog", () => {
  beforeEach(() => {
    vi.stubEnv("CONTENT_API_TOKEN_SHA256", TOKEN_HASH);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("creates a draft by default and stores sanitized HTML", async () => {
    const t = convexTest(schema, modules);

    const response = await createPost(t.fetch, draftBody());
    expect(response.status).toBe(201);
    const created = await response.json();
    expect(created).toMatchObject({ slug: "deploying-with-convex", status: "draft" });

    const [post] = await posts(t);
    expect(post).toMatchObject({ status: "draft", slug: "deploying-with-convex" });
    expect(post.publishedAt).toBeUndefined();
    expect(post.content).toContain("<h2>Steps</h2>");
    expect(post.content).toContain("<strong>deploy</strong>");
    expect(post.readingTime).toBeGreaterThanOrEqual(1);
  });

  it("publishes immediately when asked, and the post reaches the public queries", async () => {
    const t = convexTest(schema, modules);

    const response = await createPost(t.fetch, draftBody({ publish: true }));
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ status: "published" });

    const [post] = await posts(t);
    expect(post.publishedAt).toBeTypeOf("number");

    const listing = await t.query(api.blog.listPublished, {});
    expect(listing.posts.map((row) => row.slug)).toEqual(["deploying-with-convex"]);

    const feed = await t.query(api.blog.listForRss, {});
    expect(feed.map((row) => row.slug)).toEqual(["deploying-with-convex"]);
  });

  it("keeps a draft out of every public surface", async () => {
    const t = convexTest(schema, modules);
    await createPost(t.fetch, draftBody());

    const listing = await t.query(api.blog.listPublished, {});
    const recent = await t.query(api.blog.listRecent, {});
    const feed = await t.query(api.blog.listForRss, {});
    const bySlug = await t.query(api.blog.bySlug, { slug: "deploying-with-convex" });

    expect(listing.total).toBe(0);
    expect(recent).toHaveLength(0);
    expect(feed).toHaveLength(0);
    expect(bySlug).toBeNull();
  });

  it("derives a slug from the title and rejects a conflicting one", async () => {
    const t = convexTest(schema, modules);
    await createPost(t.fetch, draftBody());

    const collision = await t.fetch("/content/blog", {
      method: "POST",
      headers: { "content-type": "application/json", ...AUTH },
      body: JSON.stringify(draftBody({ title: "Something else", slug: "deploying-with-convex" })),
    });

    expect(collision.status).toBe(409);
    expect(await collision.json()).toMatchObject({
      error: expect.stringMatching(/already in use/),
    });

    const stored = await posts(t);
    expect(stored).toHaveLength(1);
    expect(stored[0].title).toBe("Deploying with Convex");
  });

  it("rejects a title that yields no usable slug", async () => {
    const t = convexTest(schema, modules);

    const response = await createPost(t.fetch, draftBody({ title: "###" }));

    expect(response.status).toBe(400);
    expect(await posts(t)).toHaveLength(0);
  });

  it("rejects an explicit slug a URL cannot carry", async () => {
    const t = convexTest(schema, modules);

    // A trailing space is trimmed by the transport, so it is not a rejection case.
    const cases = ["My Post/Part 1", "Guide", "-leading"];
    for (const slug of cases) {
      const response = await createPost(t.fetch, draftBody({ slug }));
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        error: expect.stringMatching(/slug must use lowercase/),
      });
    }

    expect(await posts(t)).toHaveLength(0);
  });

  it("honours an explicit slug that is URL-safe", async () => {
    const t = convexTest(schema, modules);

    const response = await createPost(t.fetch, draftBody({ slug: "convex.guide-v2" }));

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ slug: "convex.guide-v2" });
    expect(await getPost(t.fetch, "convex.guide-v2")).toMatchObject({ status: 200 });
  });

  it("rejects a publish flag that is not a boolean", async () => {
    const t = convexTest(schema, modules);

    const response = await createPost(t.fetch, draftBody({ publish: "true" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: "publish must be a boolean" });
  });

  it("rejects tags that are not an array of strings", async () => {
    const t = convexTest(schema, modules);

    const notAList = await createPost(t.fetch, draftBody({ tags: "convex" }));
    const notStrings = await createPost(t.fetch, draftBody({ tags: [1] }));

    expect(notAList.status).toBe(400);
    expect(notStrings.status).toBe(400);
    expect(await notAList.json()).toMatchObject({ error: "tags must be an array of slugs" });
  });

  it("rejects an unknown category without writing", async () => {
    const t = convexTest(schema, modules);

    const response = await createPost(t.fetch, draftBody({ categorySlug: "missing-category" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: expect.stringMatching(/category not found/),
    });
    expect(await posts(t)).toHaveLength(0);
  });

  it("accepts a known category", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert("blogCategories", {
        name: "Engineering",
        slug: "engineering",
        displayOrder: 1,
      });
    });

    const response = await createPost(t.fetch, draftBody({ categorySlug: "engineering" }));

    expect(response.status).toBe(201);
    const [post] = await posts(t);
    expect(post.categoryId).toBeDefined();
  });

  it("creates missing tags once and reuses them on the next post", async () => {
    const t = convexTest(schema, modules);

    await createPost(t.fetch, draftBody({ tags: ["Web Perf", "convex"] }));
    await createPost(t.fetch, draftBody({ title: "Second post", tags: ["Web Perf"] }));

    const stored = await tags(t);
    expect(stored.map((tag) => tag.slug).sort()).toEqual(["convex", "web-perf"]);

    const [first] = await posts(t);
    expect(first.tagIds).toHaveLength(2);
  });

  it("writes exactly one audit row per created post", async () => {
    const t = convexTest(schema, modules);

    await createPost(t.fetch, draftBody());
    await createPost(t.fetch, draftBody({ title: "Second post" }));

    const rows = await logs(t);
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row).toMatchObject({
        actorEmail: "agent@content-api",
        action: "create",
        entityType: "blogPost",
      });
    }
  });

  it("refuses the 61st write in an hour with 429", async () => {
    const t = convexTest(schema, modules);
    const fingerprint = (await hashToken(TOKEN)).slice(0, 16);

    await t.run(async (ctx) => {
      for (let index = 0; index < 60; index += 1) {
        await ctx.db.insert("rateLimits", {
          identifier: fingerprint,
          action: "content_api_write",
          timestamp: Date.now(),
        });
      }
    });

    const response = await createPost(t.fetch, draftBody());

    expect(response.status).toBe(429);
    expect(await response.json()).toMatchObject({
      error: expect.stringMatching(/rate limit reached/),
    });
    expect(await posts(t)).toHaveLength(0);
  });

  it("records one metering row per accepted write", async () => {
    const t = convexTest(schema, modules);

    await createPost(t.fetch, draftBody());

    const attempts = await t.run(async (ctx) => await ctx.db.query("rateLimits").collect());
    expect(attempts).toHaveLength(1);
    expect(attempts[0].action).toBe("content_api_write");
  });

  it("rejects a missing title or body with 400", async () => {
    const t = convexTest(schema, modules);

    const noTitle = await createPost(t.fetch, { bodyMarkdown: "text" });
    const noBody = await createPost(t.fetch, { title: "Title" });
    const blankBody = await createPost(t.fetch, draftBody({ bodyMarkdown: "   " }));

    expect(noTitle.status).toBe(400);
    expect(noBody.status).toBe(400);
    expect(blankBody.status).toBe(400);
    expect(await posts(t)).toHaveLength(0);
  });

  it("rejects a malformed JSON body with 400", async () => {
    const t = convexTest(schema, modules);

    const response = await t.fetch("/content/blog", {
      method: "POST",
      headers: { "content-type": "application/json", ...AUTH },
      body: "{",
    });

    expect(response.status).toBe(400);
  });
});

describe("GET /content/blog", () => {
  beforeEach(() => {
    vi.stubEnv("CONTENT_API_TOKEN_SHA256", TOKEN_HASH);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reads back a draft that the public queries hide", async () => {
    const t = convexTest(schema, modules);
    await createPost(t.fetch, draftBody());

    const response = await getPost(t.fetch, "deploying-with-convex");

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.post).toMatchObject({ slug: "deploying-with-convex", status: "draft" });
  });

  it("returns 404 for an unknown slug", async () => {
    const t = convexTest(schema, modules);

    const response = await getPost(t.fetch, "nope");

    expect(response.status).toBe(404);
  });

  it("lists posts filtered by status and bounded by limit", async () => {
    const t = convexTest(schema, modules);
    await createPost(t.fetch, draftBody({ title: "One" }));
    await createPost(t.fetch, draftBody({ title: "Two", publish: true }));
    await createPost(t.fetch, draftBody({ title: "Three" }));

    const drafts = await t.fetch("/content/blog?status=draft", { headers: AUTH });
    const draftPage = await drafts.json();
    expect(draftPage.posts).toHaveLength(2);

    const limited = await t.fetch("/content/blog?limit=1", { headers: AUTH });
    expect((await limited.json()).posts).toHaveLength(1);

    const invalid = await t.fetch("/content/blog?status=archived", { headers: AUTH });
    expect(invalid.status).toBe(400);
  });

  it("clamps the limit at both ends", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      for (let index = 0; index < 51; index += 1) {
        await ctx.db.insert("blogPosts", {
          slug: `seeded-${index}`,
          title: `Seeded ${index}`,
          content: "<p>body</p>",
          tagIds: [],
          status: "published",
          readingTime: 1,
        });
      }
    });

    const floor = await t.fetch("/content/blog?limit=0", { headers: AUTH });
    expect((await floor.json()).posts).toHaveLength(1);

    const ceiling = await t.fetch("/content/blog?limit=999", { headers: AUTH });
    expect((await ceiling.json()).posts).toHaveLength(50);
  });

  it("requires the token for reads too", async () => {
    const t = convexTest(schema, modules);

    const response = await t.fetch("/content/blog");
    expect(response.status).toBe(401);
  });
});

describe("module reachability", () => {
  it("exposes the write path only as internal functions", () => {
    const visibility = (fn: object): "public" | "internal" | "unknown" => {
      if ("isInternal" in fn) return "internal";
      if ("isPublic" in fn) return "public";
      return "unknown";
    };

    // Asserting on the module export rather than `internal`: that proxy resolves
    // every property, so a missing function would still look present.
    expect(visibility(contentApiModule.create)).toBe("internal");
    expect(visibility(contentApiModule.getBySlug)).toBe("internal");
    expect(visibility(contentApiModule.list)).toBe("internal");
  });
});
