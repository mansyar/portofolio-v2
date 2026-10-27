// @vitest-environment edge-runtime
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { convexTest, type TestConvex } from "convex-test";
import schema from "../schema";
import { constantTimeEqual, hashToken, readBearerToken, readCappedBody } from "../lib/contentAuth";

// `convex-test` loads a function's module out of this map, so every Convex
// module has to be listed. The `_generated` directory is what lets the library
// work out the module root; the test files are excluded so they are not
// mistaken for Convex modules.
const modules = import.meta.glob(["../**/*.ts", "!../__tests__/**"]);

const TOKEN = "content-api-test-token";

type FetchLike = (path: string, init?: RequestInit) => Promise<Response>;

const postBlog = (
  doFetch: FetchLike,
  body: unknown,
  headers: Record<string, string> = {}
): Promise<Response> =>
  doFetch("/content/blog", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

const authorized = { authorization: `Bearer ${TOKEN}` };

const postCount = async (t: TestConvex<typeof schema>) =>
  t.run(async (ctx) => (await ctx.db.query("blogPosts").collect()).length);

describe("content API token gate", () => {
  let configuredHash = "";

  beforeAll(async () => {
    configuredHash = await hashToken(TOKEN);
  });

  beforeEach(() => {
    vi.stubEnv("CONTENT_API_TOKEN_SHA256", configuredHash);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("refuses a missing, malformed, or wrong credential and writes nothing", async () => {
    const t = convexTest(schema, modules);

    const responses = [
      await postBlog(t.fetch, { title: "No header" }),
      await postBlog(t.fetch, { title: "Basic auth" }, { authorization: "Basic abc123" }),
      await postBlog(t.fetch, { title: "Wrong token" }, { authorization: "Bearer nope" }),
      await postBlog(t.fetch, { title: "Bare token" }, { authorization: TOKEN }),
    ];

    for (const response of responses) {
      expect(response.status).toBe(401);
      expect(await response.json()).toMatchObject({
        error: expect.stringMatching(/^unauthorized:/),
      });
    }

    expect(await postCount(t)).toBe(0);
  });

  it("answers missing and wrong credentials indistinguishably", async () => {
    const t = convexTest(schema, modules);

    const missing = await postBlog(t.fetch, { title: "x" });
    const wrong = await postBlog(t.fetch, { title: "x" }, { authorization: "Bearer wrong" });

    expect(missing.status).toBe(wrong.status);
    expect(await missing.text()).toBe(await wrong.text());
  });

  it("fails closed when the deployment has no configured digest", async () => {
    vi.stubEnv("CONTENT_API_TOKEN_SHA256", "");

    const t = convexTest(schema, modules);
    const response = await postBlog(t.fetch, { title: "x" }, authorized);

    expect(response.status).toBe(401);
    expect(await postCount(t)).toBe(0);
  });

  it("fails closed when the configured digest is not a SHA-256 hex string", async () => {
    vi.stubEnv("CONTENT_API_TOKEN_SHA256", "not-a-digest");

    const t = convexTest(schema, modules);
    const response = await postBlog(t.fetch, { title: "x" }, authorized);

    expect(response.status).toBe(401);
  });

  it("lets a correct credential through the gate", async () => {
    const t = convexTest(schema, modules);

    const response = await postBlog(t.fetch, { title: "Authorized" }, authorized);

    // The transport contract is all this phase owns; anything other than a 401
    // proves the gate opened.
    expect(response.status).not.toBe(401);
  });

  it("refuses an oversized body with 413 before any write", async () => {
    const t = convexTest(schema, modules);
    const oversized = "x".repeat(300 * 1024);

    const response = await postBlog(t.fetch, { title: "Big", body: oversized }, authorized);

    expect(response.status).toBe(413);
    expect(await response.json()).toMatchObject({
      error: expect.stringMatching(/exceeds \d+ bytes/),
    });
    expect(await postCount(t)).toBe(0);
  });

  it("publishes no CORS headers on content routes", async () => {
    const t = convexTest(schema, modules);

    const refused = await postBlog(t.fetch, { title: "x" }, { origin: "https://ansyar-world.top" });
    expect(refused.headers.get("access-control-allow-origin")).toBeNull();

    const allowed = await postBlog(
      t.fetch,
      { title: "x" },
      {
        ...authorized,
        origin: "https://ansyar-world.top",
      }
    );
    expect(allowed.headers.get("access-control-allow-origin")).toBeNull();
  });
});

describe("content transport helpers", () => {
  it("accepts only a Bearer scheme", () => {
    expect(readBearerToken("Bearer abc")).toBe("abc");
    expect(readBearerToken("bearer abc")).toBe("abc");
    expect(readBearerToken("  Bearer abc  ")).toBe("abc");
    expect(readBearerToken("Basic abc")).toBeNull();
    expect(readBearerToken("Bearer")).toBeNull();
    expect(readBearerToken("")).toBeNull();
    expect(readBearerToken(null)).toBeNull();
  });

  it("compares digests without an early exit", () => {
    const first = "a".repeat(64);
    const second = `${"a".repeat(63)}b`;

    expect(constantTimeEqual(first, first)).toBe(true);
    expect(constantTimeEqual(first, second)).toBe(false);
    expect(constantTimeEqual(first, first.slice(0, 63))).toBe(false);
  });

  it("measures the body it read, not only the declared length", async () => {
    const declaredShort = new Request("https://example.test/content/blog", {
      method: "POST",
      headers: { "content-length": "4" },
      body: "1234567890",
    });
    expect(await readCappedBody(declaredShort, 5)).toEqual({ ok: false });

    const within = new Request("https://example.test/content/blog", {
      method: "POST",
      body: "12345",
    });
    expect(await readCappedBody(within, 5)).toEqual({ ok: true, text: "12345" });

    const chunked = new Request("https://example.test/content/blog", {
      method: "POST",
      body: "123456",
    });
    expect(await readCappedBody(chunked, 5)).toEqual({ ok: false });
  });
});
