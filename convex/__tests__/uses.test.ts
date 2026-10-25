// @vitest-environment edge-runtime
import { describe, expect, it } from "vitest";
import { convexTest } from "convex-test";
import { api } from "../_generated/api";
import schema from "../schema";

// `convex-test` loads a function's module out of this map, so every Convex
// module has to be listed. The `_generated` directory is what lets the library
// work out the module root; the test files are excluded so they are not
// mistaken for Convex modules.
const modules = import.meta.glob(["../**/*.ts", "!../__tests__/**"]);

describe("Uses backend functions", () => {
  it("listVisible returns only visible items, ordered by displayOrder", async () => {
    const t = convexTest(schema, modules);

    // Hidden and visible rows are interleaved by display order so a missing
    // `isVisible` filter and a wrong index both show up in the result.
    await t.run(async (ctx) => {
      const rows = [
        { name: "Hidden one", category: "editor", displayOrder: 1, isVisible: false },
        { name: "Visible one", category: "editor", displayOrder: 2, isVisible: true },
        { name: "Visible two", category: "hardware", displayOrder: 3, isVisible: true },
        { name: "Hidden two", category: "hardware", displayOrder: 4, isVisible: false },
      ];

      for (const row of rows) {
        await ctx.db.insert("usesItems", row);
      }
    });

    const visible = await t.query(api.uses.listVisible, {});

    // The public query is callable without an identity; it must still hide the
    // two rows the admin has not published.
    expect(visible.map((item) => item.name)).toEqual(["Visible one", "Visible two"]);
  });
});
