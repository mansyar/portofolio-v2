// @vitest-environment edge-runtime
import { describe, expect, it } from "vitest";
import { convexTest } from "convex-test";
import { internal } from "../_generated/api";
import schema from "../schema";

const modules = import.meta.glob(["../**/*.ts", "!../__tests__/**"]);

const BASE_TIME = 1_700_000_000_000;

const subscribers = (t: ReturnType<typeof convexTest>) =>
  t.run(async (ctx) => ctx.db.query("newsletterSubscribers").collect());

describe("newsletter.normalizeSubscribers", () => {
  it("collapses duplicates onto the earliest subscription and backfills tokens", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      await ctx.db.insert("newsletterSubscribers", {
        email: "Ana@Example.com",
        subscribedAt: BASE_TIME,
        status: "active",
      });
      await ctx.db.insert("newsletterSubscribers", {
        email: "  ana@example.com",
        subscribedAt: BASE_TIME + 5_000,
        status: "unsubscribed",
      });
      await ctx.db.insert("newsletterSubscribers", {
        email: "bob@example.com",
        subscribedAt: BASE_TIME + 9_000,
        status: "active",
      });
    });

    const result = await t.mutation(internal.newsletter.normalizeSubscribers, {});
    const rows = await subscribers(t);

    expect(rows).toHaveLength(2);
    expect(result.duplicatesRemoved).toBe(1);

    const ana = rows.find((row) => row.email === "ana@example.com");
    expect(ana).toBeDefined();
    expect(ana?.subscribedAt).toBe(BASE_TIME);
    expect(ana?.unsubscribeToken).toBeTruthy();

    const bob = rows.find((row) => row.email === "bob@example.com");
    expect(bob?.unsubscribeToken).toBeTruthy();
    expect(rows.every((row) => row.email === row.email.trim().toLowerCase())).toBe(true);
  });

  it("keeps the address subscribed when any duplicate is still active", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      await ctx.db.insert("newsletterSubscribers", {
        email: "mixed@example.com",
        subscribedAt: BASE_TIME,
        status: "unsubscribed",
      });
      await ctx.db.insert("newsletterSubscribers", {
        email: "MIXED@example.com",
        subscribedAt: BASE_TIME + 1_000,
        status: "active",
      });
    });

    await t.mutation(internal.newsletter.normalizeSubscribers, {});
    const rows = await subscribers(t);

    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("active");
    expect(rows[0].subscribedAt).toBe(BASE_TIME);
  });

  it("changes nothing on a second run", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      await ctx.db.insert("newsletterSubscribers", {
        email: "Twice@Example.com",
        subscribedAt: BASE_TIME,
        status: "active",
      });
      await ctx.db.insert("newsletterSubscribers", {
        email: "twice@example.com",
        subscribedAt: BASE_TIME + 2_000,
        status: "active",
      });
    });

    await t.mutation(internal.newsletter.normalizeSubscribers, {});
    const afterFirst = await subscribers(t);

    const second = await t.mutation(internal.newsletter.normalizeSubscribers, {});
    const afterSecond = await subscribers(t);

    expect(second.duplicatesRemoved).toBe(0);
    expect(second.normalized).toBe(0);
    expect(second.tokensBackfilled).toBe(0);
    expect(afterSecond).toEqual(afterFirst);
  });
});
