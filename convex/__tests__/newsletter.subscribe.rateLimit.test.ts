// @vitest-environment edge-runtime
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { convexTest } from "convex-test";
import { api } from "../_generated/api";
import schema from "../schema";

// `convex-test` loads a function's module out of this map, so every Convex
// module has to be listed. The `_generated` directory is what lets the library
// work out the module root; the test files are excluded so they are not
// mistaken for Convex modules.
const modules = import.meta.glob(["../**/*.ts", "!../__tests__/**"]);

const CLIENT_IP = "203.0.113.7";
const EMAIL = "rate-limit@example.com";
const ACTION = "newsletter_subscribe";

describe("newsletter.subscribe rate limiting", () => {
  beforeEach(() => {
    // Freeze the clock so all six attempts land in the same hour, and keep the
    // scheduled welcome email from firing outside a transaction.
    vi.useFakeTimers();
    vi.stubEnv("RESEND_API_KEY", "");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("rejects the sixth attempt from one IP within an hour", async () => {
    const t = convexTest(schema, modules);
    const outcomes: string[] = [];

    for (let attempt = 0; attempt < 6; attempt += 1) {
      // Built outside the call so the `clientIp` field is not rejected by
      // TypeScript's excess property check before the mutation accepts it.
      const args = { email: EMAIL, clientIp: CLIENT_IP };
      try {
        await t.mutation(api.newsletter.subscribe, args);
        outcomes.push("ok");
      } catch (thrown) {
        outcomes.push(thrown instanceof Error ? thrown.message : String(thrown));
      }
    }

    expect(outcomes.slice(0, 5)).toEqual(["ok", "ok", "ok", "ok", "ok"]);
    expect(outcomes[5]).toMatch(/too many/i);
  });

  it("records every allowed attempt and rejects the sixth with no side effects", async () => {
    const t = convexTest(schema, modules);

    const snapshot = () =>
      t.run(async (ctx) => ({
        attempts: await ctx.db
          .query("rateLimits")
          .withIndex("by_identifier_action", (q) =>
            q.eq("identifier", CLIENT_IP).eq("action", ACTION)
          )
          .collect(),
        subscribers: await ctx.db.query("newsletterSubscribers").collect(),
        scheduled: await ctx.db.system.query("_scheduled_functions").collect(),
      }));

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const args = { email: EMAIL, clientIp: CLIENT_IP };
      await t.mutation(api.newsletter.subscribe, args);
    }

    const allowed = await snapshot();

    // The sixth attempt has to be turned away before it can insert a
    // subscriber row or schedule another welcome email.
    const blockedArgs = { email: EMAIL, clientIp: CLIENT_IP };
    await expect(t.mutation(api.newsletter.subscribe, blockedArgs)).rejects.toThrow(/too many/i);

    const blocked = await snapshot();

    expect(allowed.attempts).toHaveLength(5);
    expect(allowed.attempts.every((row) => row.identifier === CLIENT_IP)).toBe(true);
    expect(allowed.attempts.every((row) => row.action === ACTION)).toBe(true);
    expect(allowed.subscribers).toHaveLength(1);
    expect(allowed.subscribers[0].email).toBe(EMAIL);
    expect(blocked.attempts).toHaveLength(5);
    expect(blocked.subscribers).toHaveLength(1);
    expect(blocked.scheduled).toHaveLength(allowed.scheduled.length);
  });

  it("rejects the sixth attempt against one address even when every IP differs", async () => {
    // The IP limit alone only binds an honest client: the address is resolved
    // from request headers and then supplied by the caller, so varying it
    // resets the bucket. The address-keyed limit is what makes enumeration and
    // per-inbox mail-bombing cost something regardless of the IP supplied.
    const t = convexTest(schema, modules);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const args = { email: EMAIL, clientIp: `198.51.100.${attempt + 1}` };
      await t.mutation(api.newsletter.subscribe, args);
    }

    const blockedArgs = { email: EMAIL, clientIp: "198.51.100.99" };
    await expect(t.mutation(api.newsletter.subscribe, blockedArgs)).rejects.toThrow(/too many/i);
  });

  it("treats differently-cased forms of one address as the same bucket", async () => {
    // Otherwise `User@Example.com` and `user@example.com` would each get a
    // fresh allowance for the same inbox.
    const t = convexTest(schema, modules);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const args = { email: `  ${EMAIL.toUpperCase()}  `, clientIp: `203.0.113.${attempt + 1}` };
      await t.mutation(api.newsletter.subscribe, args);
    }

    const blockedArgs = { email: EMAIL, clientIp: "203.0.113.99" };
    await expect(t.mutation(api.newsletter.subscribe, blockedArgs)).rejects.toThrow(/too many/i);
  });
});
