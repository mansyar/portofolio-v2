// @vitest-environment edge-runtime
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { convexTest, type TestConvex } from "convex-test";
import schema from "../schema";
import * as contactModule from "../contact";
import * as newsletterModule from "../newsletter";

// `convex-test` loads a function's module out of this map, so every Convex
// module has to be listed. The `_generated` directory is what lets the library
// work out the module root; the test files are excluded so they are not
// mistaken for Convex modules.
const modules = import.meta.glob(["../**/*.ts", "!../__tests__/**"]);

const SITE_ORIGIN = "https://preview.example.test";
const CLIENT_IP = "203.0.113.7";
const FORGED_HOPS = ["1.2.3.4", "5.6.7.8", "9.10.11.12", "13.14.15.16"];

type FetchLike = (path: string, init?: RequestInit) => Promise<Response>;

const validPayload = (overrides: Record<string, unknown> = {}) => ({
  name: "Ada Lovelace",
  email: "ada@example.com",
  subject: "Hello",
  message: "First contact",
  ...overrides,
});

const postContact = (
  doFetch: FetchLike,
  body: unknown,
  headers: Record<string, string> = {}
): Promise<Response> =>
  doFetch("/contact", {
    method: "POST",
    headers: { "content-type": "application/json", origin: SITE_ORIGIN, ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

const contactState = async (t: TestConvex<typeof schema>) =>
  t.run(async (ctx) => ({
    submissions: await ctx.db.query("contactSubmissions").collect(),
    attempts: await ctx.db.query("rateLimits").collect(),
    scheduled: await ctx.db.system.query("_scheduled_functions").collect(),
  }));

describe("POST /contact", () => {
  beforeEach(() => {
    // All attempts have to land in one hour, and a scheduled notification must
    // not run outside the transaction that recorded the submission.
    vi.useFakeTimers();
    vi.stubEnv("SITE_URL", SITE_ORIGIN);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("limits the connection, not the forged hop a caller rotates", async () => {
    const t = convexTest(schema, modules);
    const statuses: number[] = [];

    for (const forged of FORGED_HOPS) {
      const response = await postContact(t.fetch, validPayload(), {
        "x-forwarded-for": `${forged}, ${CLIENT_IP}`,
      });
      statuses.push(response.status);
    }

    expect(statuses).toEqual([200, 200, 200, 429]);

    const state = await contactState(t);
    const identifiers = state.attempts.map((row) => row.identifier);

    // Every allowed attempt is attributed to the address the proxy appended;
    // no forged value became a bucket of its own.
    expect(identifiers).toEqual([CLIENT_IP, CLIENT_IP, CLIENT_IP]);
    expect(identifiers.some((identifier) => FORGED_HOPS.includes(identifier))).toBe(false);
    expect(state.submissions).toHaveLength(3);
  });

  it("refuses a submission it cannot attribute and writes nothing", async () => {
    const t = convexTest(schema, modules);

    const response = await postContact(t.fetch, validPayload());

    expect(response.status).toBe(429);
    const body: unknown = await response.json();
    expect(body).toMatchObject({ error: expect.stringMatching(/too many/i) });

    const state = await contactState(t);
    expect(state.submissions).toHaveLength(0);
    expect(state.attempts).toHaveLength(0);
    expect(state.scheduled).toHaveLength(0);
  });

  it("records one submission, one attempt, and one notification for an honest post", async () => {
    const t = convexTest(schema, modules);

    const response = await postContact(t.fetch, validPayload(), {
      "x-forwarded-for": `1.2.3.4, ${CLIENT_IP}`,
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true });

    const state = await contactState(t);
    expect(state.submissions).toHaveLength(1);
    expect(state.submissions[0]).toMatchObject({ name: "Ada Lovelace", isRead: false });
    expect(state.attempts).toHaveLength(1);
    expect(state.attempts[0]).toMatchObject({ identifier: CLIENT_IP, action: "contact_submit" });
    expect(state.scheduled).toHaveLength(1);
  });

  it("answers a filled honeypot with success while writing nothing", async () => {
    const t = convexTest(schema, modules);

    const response = await postContact(
      t.fetch,
      validPayload({ honeypot: "https://spam.example" }),
      { "x-forwarded-for": CLIENT_IP }
    );

    expect(response.status).toBe(200);

    const state = await contactState(t);
    expect(state.submissions).toHaveLength(0);
    expect(state.attempts).toHaveLength(0);
    expect(state.scheduled).toHaveLength(0);
  });

  it("rejects malformed JSON with 400 and writes nothing", async () => {
    const t = convexTest(schema, modules);

    const response = await postContact(t.fetch, "{", { "x-forwarded-for": CLIENT_IP });

    expect(response.status).toBe(400);
    const body: unknown = await response.json();
    expect(body).toMatchObject({ error: expect.any(String) });

    const state = await contactState(t);
    expect(state.submissions).toHaveLength(0);
    expect(state.attempts).toHaveLength(0);
  });

  it("rejects a payload missing a required field with 400 and writes nothing", async () => {
    const t = convexTest(schema, modules);
    const incomplete = { name: "Ada Lovelace", email: "ada@example.com", subject: "Hello" };

    const response = await postContact(t.fetch, incomplete, { "x-forwarded-for": CLIENT_IP });

    expect(response.status).toBe(400);

    const state = await contactState(t);
    expect(state.submissions).toHaveLength(0);
    expect(state.attempts).toHaveLength(0);
  });
});

describe("HTTP surface", () => {
  beforeEach(() => {
    vi.stubEnv("SITE_URL", SITE_ORIGIN);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const visibility = (fn: object): "public" | "internal" | "unknown" => {
    if ("isInternal" in fn) return "internal";
    if ("isPublic" in fn) return "public";
    return "unknown";
  };

  it("exposes neither write path as a public function", () => {
    // Asserting on the module export rather than `api`: that proxy resolves
    // every property, so a missing function would still look present.
    expect(visibility(contactModule.submit)).toBe("internal");
    expect(visibility(newsletterModule.subscribe)).toBe("internal");
  });

  it("answers preflight for both endpoints with 204 and the served origin", async () => {
    const t = convexTest(schema, modules);

    for (const path of ["/contact", "/newsletter/subscribe"]) {
      const response = await t.fetch(path, {
        method: "OPTIONS",
        headers: {
          origin: SITE_ORIGIN,
          "access-control-request-method": "POST",
          "access-control-request-headers": "content-type",
        },
      });

      expect(response.status).toBe(204);
      expect(response.headers.get("access-control-allow-origin")).toBe(SITE_ORIGIN);
      expect(response.headers.get("access-control-allow-methods")).toContain("POST");
      expect(response.headers.get("vary")).toContain("Origin");
    }
  });

  it("carries the origin header on POST responses and withholds it from strangers", async () => {
    const t = convexTest(schema, modules);

    const allowed = await postContact(t.fetch, validPayload(), { "x-forwarded-for": CLIENT_IP });
    expect(allowed.headers.get("access-control-allow-origin")).toBe(SITE_ORIGIN);
    expect(allowed.headers.get("vary")).toContain("Origin");

    const stranger = await postContact(t.fetch, validPayload(), {
      "x-forwarded-for": CLIENT_IP,
      origin: "https://elsewhere.example",
    });
    expect(stranger.headers.get("access-control-allow-origin")).not.toBe(
      "https://elsewhere.example"
    );
  });
});
