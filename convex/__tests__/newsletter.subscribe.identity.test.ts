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

const subscribers = (t: ReturnType<typeof convexTest>) =>
  t.run(async (ctx) => ctx.db.query("newsletterSubscribers").collect());

describe("newsletter.subscribe identity", () => {
  beforeEach(() => {
    // Freeze the clock so the scheduled welcome email never runs outside the test
    // transaction, and drop the provider key so nothing reaches the network.
    vi.useFakeTimers();
    vi.stubEnv("RESEND_API_KEY", "");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("keeps one subscriber when one address arrives with different casing and spacing", async () => {
    const t = convexTest(schema, modules);

    const first = await t.mutation(api.newsletter.subscribe, {
      email: "  Ana@Example.com ",
      clientIp: "203.0.113.1",
    });
    const second = await t.mutation(api.newsletter.subscribe, {
      email: "ana@example.com",
      clientIp: "203.0.113.2",
    });

    const rows = await subscribers(t);

    expect(rows).toHaveLength(1);
    expect(rows[0].email).toBe("ana@example.com");
    expect(first.alreadySubscribed).toBe(false);
    expect(second.alreadySubscribed).toBe(true);
  });

  it("gives every subscriber a distinct, non-empty token", async () => {
    const t = convexTest(schema, modules);

    await t.mutation(api.newsletter.subscribe, {
      email: "one@example.com",
      clientIp: "203.0.113.3",
    });
    await t.mutation(api.newsletter.subscribe, {
      email: "two@example.com",
      clientIp: "203.0.113.4",
    });

    const rows = await subscribers(t);
    const tokens = rows.map((row) => row.unsubscribeToken);

    expect(rows).toHaveLength(2);
    expect(tokens.every((token) => typeof token === "string" && token.length >= 16)).toBe(true);
    expect(new Set(tokens).size).toBe(2);
  });

  it("refreshes the token and reactivates an address that returns after unsubscribing", async () => {
    const t = convexTest(schema, modules);

    await t.mutation(api.newsletter.subscribe, {
      email: "returning@example.com",
      clientIp: "203.0.113.5",
    });

    const before = (await subscribers(t))[0];
    await t.run(async (ctx) => {
      await ctx.db.patch(before._id, { status: "unsubscribed" });
    });

    await t.mutation(api.newsletter.subscribe, {
      email: "Returning@Example.com",
      clientIp: "203.0.113.6",
    });

    const after = (await subscribers(t))[0];

    expect(after.status).toBe("active");
    expect(after.unsubscribeToken).toBeDefined();
    expect(after.unsubscribeToken).not.toBe(before.unsubscribeToken);
  });
});
