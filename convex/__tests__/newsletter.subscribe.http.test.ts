// @vitest-environment edge-runtime
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { convexTest, type TestConvex } from "convex-test";
import schema from "../schema";

// `convex-test` loads a function's module out of this map, so every Convex
// module has to be listed. The `_generated` directory is what lets the library
// work out the module root; the test files are excluded so they are not
// mistaken for Convex modules.
const modules = import.meta.glob(["../**/*.ts", "!../__tests__/**"]);

const SITE_ORIGIN = "https://preview.example.test";
const CLIENT_IP = "203.0.113.7";
const EMAIL = "rate-limit@example.com";
const IDENTITY_ACTION = "newsletter_subscribe";
const ADDRESS_ACTION = "newsletter_subscribe_email";

type FetchLike = (path: string, init?: RequestInit) => Promise<Response>;

const subscribe = (
  doFetch: FetchLike,
  email: string,
  headers: Record<string, string> = {}
): Promise<Response> =>
  doFetch("/newsletter/subscribe", {
    method: "POST",
    headers: { "content-type": "application/json", origin: SITE_ORIGIN, ...headers },
    body: JSON.stringify({ email }),
  });

const stateOf = async (t: TestConvex<typeof schema>) =>
  t.run(async (ctx) => ({
    attempts: await ctx.db.query("rateLimits").collect(),
    subscribers: await ctx.db.query("newsletterSubscribers").collect(),
    scheduled: await ctx.db.system.query("_scheduled_functions").collect(),
  }));

describe("POST /newsletter/subscribe rate limiting", () => {
  beforeEach(() => {
    // Freeze the clock so all attempts land in the same hour, and keep the
    // scheduled welcome email from firing outside a transaction.
    vi.useFakeTimers();
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("SITE_URL", SITE_ORIGIN);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("rejects the sixth attempt from one connection within an hour", async () => {
    const t = convexTest(schema, modules);
    const statuses: number[] = [];

    for (let attempt = 0; attempt < 6; attempt += 1) {
      // A different address each time, so only the identity bucket can be what
      // rejects the sixth attempt.
      const response = await subscribe(t.fetch, `subscriber-${attempt}@example.com`, {
        "x-forwarded-for": CLIENT_IP,
      });
      statuses.push(response.status);
    }

    expect(statuses).toEqual([200, 200, 200, 200, 200, 429]);
  });

  it("records every allowed attempt and rejects the sixth with no side effects", async () => {
    const t = convexTest(schema, modules);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await subscribe(t.fetch, EMAIL, { "x-forwarded-for": CLIENT_IP });
      expect(response.status).toBe(200);
    }

    const allowed = await stateOf(t);

    // The sixth attempt has to be turned away before it can insert a
    // subscriber row or schedule another welcome email.
    const blocked = await subscribe(t.fetch, EMAIL, { "x-forwarded-for": CLIENT_IP });
    expect(blocked.status).toBe(429);

    const after = await stateOf(t);

    expect(allowed.attempts).toHaveLength(10);
    expect(allowed.attempts.filter((row) => row.action === IDENTITY_ACTION)).toHaveLength(5);
    expect(allowed.attempts.filter((row) => row.action === ADDRESS_ACTION)).toHaveLength(5);
    expect(
      allowed.attempts.every((row) => row.identifier === CLIENT_IP || row.identifier === EMAIL)
    ).toBe(true);
    expect(allowed.subscribers).toHaveLength(1);
    expect(allowed.subscribers[0].email).toBe(EMAIL);
    expect(after.attempts).toHaveLength(10);
    expect(after.subscribers).toHaveLength(1);
    expect(after.scheduled).toHaveLength(allowed.scheduled.length);
  });

  it("rejects the sixth attempt against one address even when every header differs", async () => {
    // The address is the one thing a caller cannot vary without targeting a
    // different inbox, so it bounds enumeration and per-inbox mail-bombing
    // whatever the connection looks like.
    const t = convexTest(schema, modules);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await subscribe(t.fetch, EMAIL, {
        "x-forwarded-for": `198.51.100.${attempt + 1}`,
      });
      expect(response.status).toBe(200);
    }

    const blocked = await subscribe(t.fetch, EMAIL, { "x-forwarded-for": "198.51.100.99" });
    expect(blocked.status).toBe(429);
  });

  it("treats differently-cased forms of one address as the same bucket", async () => {
    // Otherwise `User@Example.com` and `user@example.com` would each get a
    // fresh allowance for the same inbox.
    const t = convexTest(schema, modules);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await subscribe(t.fetch, `  ${EMAIL.toUpperCase()}  `, {
        "x-forwarded-for": `203.0.113.${attempt + 1}`,
      });
      expect(response.status).toBe(200);
    }

    const blocked = await subscribe(t.fetch, EMAIL, { "x-forwarded-for": "203.0.113.99" });
    expect(blocked.status).toBe(429);
  });

  it("subscribes without an identity header and still caps the address", async () => {
    // An unresolved connection must not break signup and must not collapse
    // every caller into one shared bucket: no attempt may be recorded against
    // a placeholder identifier.
    const t = convexTest(schema, modules);

    for (const email of ["a@example.com", "b@example.com", "c@example.com"]) {
      const response = await subscribe(t.fetch, email);
      expect(response.status).toBe(200);
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await subscribe(t.fetch, "capped@example.com");
      expect(response.status).toBe(200);
    }

    const blocked = await subscribe(t.fetch, "capped@example.com");
    expect(blocked.status).toBe(429);

    const state = await stateOf(t);
    expect(state.attempts.every((row) => row.identifier !== "unknown")).toBe(true);
    expect(state.attempts.filter((row) => row.action === IDENTITY_ACTION)).toHaveLength(0);
    expect(
      state.attempts.filter(
        (row) => row.action === ADDRESS_ACTION && row.identifier === "capped@example.com"
      )
    ).toHaveLength(5);
  });
});
