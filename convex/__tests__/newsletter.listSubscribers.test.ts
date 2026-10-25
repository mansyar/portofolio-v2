// @vitest-environment edge-runtime
import { describe, expect, it } from "vitest";
import { makeFunctionReference } from "convex/server";
import { convexTest } from "convex-test";
import schema from "../schema";
import * as newsletter from "../newsletter";

// `convex-test` loads a function's module out of this map, so every Convex
// module has to be listed. The `_generated` directory is what lets the library
// work out the module root; the test files are excluded so they are not
// mistaken for Convex modules.
const modules = import.meta.glob(["../**/*.ts", "!../__tests__/**"]);

// Resolved by the same module path a client would hit on the deployment URL.
// The reference is built from that name rather than from `api.newsletter`,
// because once the function is deleted the generated `api` type no longer has
// the member and referencing it would stop the suite from type-checking.
const listSubscribers = makeFunctionReference<"query">("newsletter:listSubscribers");

describe("newsletter.listSubscribers", () => {
  it("is no longer exported by the newsletter module", () => {
    // The module exports are the public API surface Convex generates, so the
    // subscriber list has to be gone rather than merely guarded.
    expect(Object.hasOwn(newsletter, "listSubscribers")).toBe(false);
  });

  it("cannot be invoked through the public API", async () => {
    const t = convexTest(schema, modules);

    // A client calling the deployment URL by name must get an error instead of
    // every subscriber's email address.
    await expect(t.query(listSubscribers)).rejects.toThrow(/no such export/i);
  });
});
