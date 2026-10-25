// @vitest-environment edge-runtime
import { describe, expect, it } from "vitest";
import { convexTest } from "convex-test";
import schema from "../schema";

// `convex-test` loads a function's module out of this map, so every Convex
// module has to be listed. The `_generated` directory is what lets the library
// work out the module root; the test files are excluded so they are not
// mistaken for Convex modules.
const modules = import.meta.glob(["../**/*.ts", "!../__tests__/**"]);

describe("convex-test harness", () => {
  it("runs against the real schema", async () => {
    const t = convexTest(schema, modules);

    const seeded = await t.run(async (ctx) => {
      const id = await ctx.db.insert("newsletterSubscribers", {
        email: "harness@example.com",
        subscribedAt: 1,
        status: "active",
      });
      return await ctx.db.get(id);
    });

    expect(seeded?.email).toBe("harness@example.com");
    expect(seeded?.status).toBe("active");
  });

  it("resolves the Convex module directory", () => {
    const paths = Object.keys(modules);

    // The map has to cover the function modules and the generated directory,
    // and must not pick up the tests themselves.
    expect(paths.some((path) => path.endsWith("/newsletter.ts"))).toBe(true);
    expect(paths.some((path) => path.includes("_generated"))).toBe(true);
    expect(paths.some((path) => path.includes("__tests__"))).toBe(false);
  });
});
