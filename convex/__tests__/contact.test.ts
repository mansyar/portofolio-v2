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

// `convex/lib/auth.ts` reads `ADMIN_EMAIL` once, when the module is first
// imported. Stubbing it in `beforeEach` means it is set before the first
// handler call pulls `contact.ts` (and therefore `lib/auth.ts`) into the
// module graph, whichever test runs first.
const ADMIN_EMAIL = "admin@example.com";

async function rejectionMessage(run: () => Promise<unknown>): Promise<string> {
  try {
    await run();
  } catch (thrown) {
    return thrown instanceof Error ? thrown.message : String(thrown);
  }
  return "resolved";
}

describe("Contact backend functions", () => {
  beforeEach(() => {
    vi.stubEnv("ADMIN_EMAIL", ADMIN_EMAIL);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("refuses listAll to a caller without an admin identity", async () => {
    const t = convexTest(schema, modules);

    // The submission is really there, so the rejection below cannot be an
    // empty table mistaken for an authorization failure.
    await t.run(async (ctx) => {
      await ctx.db.insert("contactSubmissions", {
        name: "Ada",
        email: "ada@example.com",
        subject: "Hello",
        message: "First",
        isRead: false,
      });
    });

    const message = await rejectionMessage(() => t.query(api.contact.listAll, {}));

    expect(message).toMatch(/Unauthorized/i);
  });

  it("refuses unreadCount to a caller without an admin identity", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      await ctx.db.insert("contactSubmissions", {
        name: "Ada",
        email: "ada@example.com",
        subject: "Hello",
        message: "First",
        isRead: false,
      });
    });

    const message = await rejectionMessage(() => t.query(api.contact.unreadCount, {}));

    expect(message).toMatch(/Unauthorized/i);
  });

  it("lists submissions newest first for an admin", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      for (const name of ["oldest", "middle", "newest"]) {
        await ctx.db.insert("contactSubmissions", {
          name,
          email: `${name}@example.com`,
          subject: "Ordering",
          message: name,
          isRead: false,
        });
      }
    });

    const submissions = await t
      .withIdentity({ subject: "admin-user", email: ADMIN_EMAIL })
      .query(api.contact.listAll, {});

    // `listAll` orders by creation time descending; an ascending or unsorted
    // result would put "oldest" first.
    expect(submissions.map((submission) => submission.name)).toEqual([
      "newest",
      "middle",
      "oldest",
    ]);
  });

  it("counts only unread submissions for an admin", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      for (const isRead of [false, true, false, true]) {
        await ctx.db.insert("contactSubmissions", {
          name: "Ada",
          email: "ada@example.com",
          subject: "Count",
          message: "Count",
          isRead,
        });
      }
    });

    const unread = await t
      .withIdentity({ subject: "admin-user", email: ADMIN_EMAIL })
      .query(api.contact.unreadCount, {});

    // Counting every row, or ignoring `isRead`, would return 4.
    expect(unread).toBe(2);
  });
});
