// @vitest-environment edge-runtime
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { convexTest, type TestConvex } from "convex-test";
import schema from "../schema";
import { hashToken } from "../lib/contentAuth";
import { api } from "../_generated/api";

// `convex-test` loads a function's module out of this map, so every Convex
// module has to be listed. The `_generated` directory is what lets the library
// work out the module root; the test files are excluded so they are not
// mistaken for Convex modules.
const modules = import.meta.glob(["../**/*.ts", "!../__tests__/**"]);

const TOKEN = "content-api-test-token";
const TOKEN_HASH = await hashToken(TOKEN);
const AUTH = { authorization: `Bearer ${TOKEN}` };

type FetchLike = (path: string, init?: RequestInit) => Promise<Response>;

const createPost = (doFetch: FetchLike, body: Record<string, unknown>): Promise<Response> =>
  doFetch("/content/blog", {
    method: "POST",
    headers: { "content-type": "application/json", ...AUTH },
    body: JSON.stringify(body),
  });

const patchPost = (
  doFetch: FetchLike,
  slug: string,
  body: Record<string, unknown>
): Promise<Response> =>
  doFetch(`/content/blog/${slug}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", ...AUTH },
    body: JSON.stringify(body),
  });

const transition = (doFetch: FetchLike, slug: string, action: "publish" | "unpublish") =>
  doFetch(`/content/blog/${slug}/${action}`, { method: "POST", headers: AUTH });

const storedPost = async (t: TestConvex<typeof schema>, slug: string) =>
  t.run(
    async (ctx) =>
      await ctx.db
        .query("blogPosts")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first()
  );

const logs = async (t: TestConvex<typeof schema>) =>
  t.run(async (ctx) => await ctx.db.query("activityLogs").collect());

const seedPost = async (t: TestConvex<typeof schema>, overrides: Record<string, unknown> = {}) => {
  await createPost(t.fetch, {
    title: "Editing safely",
    bodyMarkdown: "Original body with a few words in it.",
    tags: ["convex"],
    coverImageUrl: "https://example.com/cover.png",
    ...overrides,
  });
};

describe("PATCH /content/blog/:slug", () => {
  beforeEach(() => {
    vi.stubEnv("CONTENT_API_TOKEN_SHA256", TOKEN_HASH);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("changes only the fields it was sent", async () => {
    const t = convexTest(schema, modules);
    await seedPost(t);

    const before = await storedPost(t, "editing-safely");
    const response = await patchPost(t.fetch, "editing-safely", { title: "A better headline" });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ updated: ["title"] });

    const after = await storedPost(t, "editing-safely");
    expect(after?.title).toBe("A better headline");
    expect(after?.content).toBe(before?.content);
    expect(after?.tagIds).toEqual(before?.tagIds);
    expect(after?.categoryId).toBe(before?.categoryId);
    expect(after?.coverImageUrl).toBe(before?.coverImageUrl);
    expect(after?.readingTime).toBe(before?.readingTime);
  });

  it("re-converts the body and recomputes reading time", async () => {
    const t = convexTest(schema, modules);
    await seedPost(t);

    const longBody = Array.from({ length: 600 }, () => "word").join(" ");
    const response = await patchPost(t.fetch, "editing-safely", {
      bodyMarkdown: `## Rewritten\n\n${longBody}`,
    });

    expect(response.status).toBe(200);

    const post = await storedPost(t, "editing-safely");
    expect(post?.content).toContain("<h2>Rewritten</h2>");
    // 600 body words plus the two heading words, at 200 words per minute.
    expect(post?.readingTime).toBe(4);
  });

  it("replaces the tag set when tags are sent", async () => {
    const t = convexTest(schema, modules);
    await seedPost(t);

    await patchPost(t.fetch, "editing-safely", { tags: ["deployment", "observability"] });

    const post = await storedPost(t, "editing-safely");
    const linked = await t.run(async (ctx) =>
      Promise.all((post?.tagIds ?? []).map(async (id) => (await ctx.db.get(id))?.slug))
    );

    expect(linked.sort()).toEqual(["deployment", "observability"]);
  });

  it("rejects an empty body without changing the stored one", async () => {
    const t = convexTest(schema, modules);
    await seedPost(t);
    const before = await storedPost(t, "editing-safely");

    const response = await patchPost(t.fetch, "editing-safely", { bodyMarkdown: "   " });

    expect(response.status).toBe(400);
    const after = await storedPost(t, "editing-safely");
    expect(after?.content).toBe(before?.content);
  });

  it("rejects a request with nothing to change", async () => {
    const t = convexTest(schema, modules);
    await seedPost(t);

    const response = await patchPost(t.fetch, "editing-safely", {});

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: "no fields to update" });
  });

  it("returns 404 for an unknown slug", async () => {
    const t = convexTest(schema, modules);

    const response = await patchPost(t.fetch, "missing", { title: "Nope" });

    expect(response.status).toBe(404);
  });

  it("refuses an unknown category and leaves the post untouched", async () => {
    const t = convexTest(schema, modules);
    await seedPost(t);

    const response = await patchPost(t.fetch, "editing-safely", { categorySlug: "nope" });

    expect(response.status).toBe(400);
    const post = await storedPost(t, "editing-safely");
    expect(post?.categoryId).toBeUndefined();
  });

  it("audits an update", async () => {
    const t = convexTest(schema, modules);
    await seedPost(t);
    await patchPost(t.fetch, "editing-safely", { title: "Renamed" });

    const rows = await logs(t);
    const update = rows.find((row) => row.action === "update");
    expect(update).toMatchObject({
      actorEmail: "agent@content-api",
      entityTitle: "Renamed",
    });
  });
});

describe("publish and unpublish", () => {
  beforeEach(() => {
    vi.stubEnv("CONTENT_API_TOKEN_SHA256", TOKEN_HASH);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("publishes a draft and makes it public", async () => {
    const t = convexTest(schema, modules);
    await seedPost(t);

    const response = await transition(t.fetch, "editing-safely", "publish");
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: "published", changed: true });

    const listing = await t.query(api.blog.listPublished, {});
    expect(listing.posts.map((post) => post.slug)).toEqual(["editing-safely"]);
  });

  it("is idempotent and stamps publishedAt exactly once", async () => {
    const t = convexTest(schema, modules);
    await seedPost(t);

    const first = await transition(t.fetch, "editing-safely", "publish");
    const firstBody = await first.json();
    const second = await transition(t.fetch, "editing-safely", "publish");
    const secondBody = await second.json();

    expect(second.status).toBe(200);
    expect(secondBody).toMatchObject({ status: "published", changed: false });
    expect(secondBody.publishedAt).toBe(firstBody.publishedAt);

    const publishLogs = (await logs(t)).filter((row) => row.action === "publish");
    expect(publishLogs).toHaveLength(1);
  });

  it("unpublishes, hides the post, and keeps its publishedAt", async () => {
    const t = convexTest(schema, modules);
    await seedPost(t);
    const published = await (await transition(t.fetch, "editing-safely", "publish")).json();

    const response = await transition(t.fetch, "editing-safely", "unpublish");
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: "draft", changed: true });

    const listing = await t.query(api.blog.listPublished, {});
    const bySlug = await t.query(api.blog.bySlug, { slug: "editing-safely" });

    expect(listing.total).toBe(0);
    expect(bySlug).toBeNull();

    const post = await storedPost(t, "editing-safely");
    expect(post?.publishedAt).toBe(published.publishedAt);

    const unpublishLogs = (await logs(t)).filter((row) => row.action === "unpublish");
    expect(unpublishLogs).toHaveLength(1);
  });

  it("treats unpublishing a draft as a no-op", async () => {
    const t = convexTest(schema, modules);
    await seedPost(t);

    const response = await transition(t.fetch, "editing-safely", "unpublish");

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: "draft", changed: false });
    expect((await logs(t)).filter((row) => row.action === "unpublish")).toHaveLength(0);
  });

  it("keeps the original date through an unpublish and republish", async () => {
    const t = convexTest(schema, modules);
    await seedPost(t);

    const first = await (await transition(t.fetch, "editing-safely", "publish")).json();
    await transition(t.fetch, "editing-safely", "unpublish");
    const again = await (await transition(t.fetch, "editing-safely", "publish")).json();

    expect(again.publishedAt).toBe(first.publishedAt);
  });

  it("returns 404 for an unknown slug", async () => {
    const t = convexTest(schema, modules);

    const response = await transition(t.fetch, "missing", "publish");

    expect(response.status).toBe(404);
  });

  it("requires the token", async () => {
    const t = convexTest(schema, modules);

    const response = await t.fetch("/content/blog/anything/publish", { method: "POST" });

    expect(response.status).toBe(401);
  });
});
