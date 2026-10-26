// @vitest-environment edge-runtime
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { convexTest } from "convex-test";
import { api } from "../_generated/api";
import schema from "../schema";

const modules = import.meta.glob(["../**/*.ts", "!../__tests__/**"]);

// `convex/lib/auth.ts` reads `ADMIN_EMAIL` once, when the module is first imported.
// Stubbing it in `beforeEach` means it is set before the first handler call pulls
// `newsletter.ts` (and therefore `lib/auth.ts`) into the module graph.
const ADMIN_EMAIL = "admin@example.com";

const BASE_TIME = 1_700_000_000_000;

async function rejectionMessage(run: () => Promise<unknown>): Promise<string> {
  try {
    await run();
  } catch (thrown) {
    return thrown instanceof Error ? thrown.message : String(thrown);
  }
  return "resolved";
}

describe("newsletter.listForAdmin", () => {
  beforeEach(() => {
    vi.stubEnv("ADMIN_EMAIL", ADMIN_EMAIL);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("refuses a caller without an admin identity", async () => {
    const t = convexTest(schema, modules);

    // A real row, so the rejection cannot be an empty table mistaken for a guard.
    await t.run(async (ctx) => {
      await ctx.db.insert("newsletterSubscribers", {
        email: "reader@example.com",
        subscribedAt: BASE_TIME,
        status: "active",
        unsubscribeToken: "token-reader",
      });
    });

    expect(await rejectionMessage(() => t.query(api.newsletter.listForAdmin, {}))).toMatch(
      /unauthorized/i
    );
  });

  it("lists subscribers newest first for an admin, without their tokens", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      await ctx.db.insert("newsletterSubscribers", {
        email: "older@example.com",
        subscribedAt: BASE_TIME,
        status: "active",
        unsubscribeToken: "token-older",
      });
      await ctx.db.insert("newsletterSubscribers", {
        email: "newer@example.com",
        subscribedAt: BASE_TIME + 10_000,
        status: "unsubscribed",
        unsubscribeToken: "token-newer",
        unsubscribedAt: BASE_TIME + 20_000,
      });
    });

    const rows = await t
      .withIdentity({ subject: "admin-user", email: ADMIN_EMAIL })
      .query(api.newsletter.listForAdmin, {});

    expect(rows.map((row) => row.email)).toEqual(["newer@example.com", "older@example.com"]);
    expect(rows[0].status).toBe("unsubscribed");
    // The opt-out token is an authorization secret; it never reaches the client.
    expect(rows.every((row) => !("unsubscribeToken" in row))).toBe(true);
  });

  it("keeps the removed public listing removed", async () => {
    // Imported here rather than at the top of the file: a top-level import would pull
    // `lib/auth.ts` in before `ADMIN_EMAIL` is stubbed, freezing the admin list as empty.
    const newsletter = await import("../newsletter");

    // Guards against reintroducing the name the harden track deleted.
    expect(Object.hasOwn(newsletter, "listSubscribers")).toBe(false);
    expect(Object.hasOwn(newsletter, "listForAdmin")).toBe(true);
  });
});
