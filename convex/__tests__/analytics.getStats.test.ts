// @vitest-environment edge-runtime
import { afterEach, describe, expect, it, vi } from "vitest";
import { convexTest } from "convex-test";
import { api } from "../_generated/api";
import schema from "../schema";

// `convex-test` loads a function's module out of this map, so every Convex
// module has to be listed. The `_generated` directory is what lets the library
// work out the module root; the test files are excluded so they are not
// mistaken for Convex modules.
const modules = import.meta.glob(["../**/*.ts", "!../__tests__/**"]);

describe("analytics.getStats authorization", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects a caller without an identity", async () => {
    // Unset the Umami credentials so the handler cannot reach the analytics
    // API. The guard has to run before this check, otherwise an anonymous
    // caller would still learn whether Umami is configured.
    vi.stubEnv("UMAMI_URL", "");
    vi.stubEnv("UMAMI_WEBSITE_ID", "");
    vi.stubEnv("UMAMI_USERNAME", "");
    vi.stubEnv("UMAMI_PASSWORD", "");

    const t = convexTest(schema, modules);

    const outcome = await t
      .action(api.analytics.getStats, { startAt: 0, endAt: 1 })
      .then(() => "resolved")
      .catch((thrown: unknown) => (thrown instanceof Error ? thrown.message : String(thrown)));

    // An anonymous caller must be turned away, not handed `null`: returning
    // `null` would tell them the analytics backend is unconfigured.
    expect(outcome).toMatch(/Unauthorized/i);
  });
});
