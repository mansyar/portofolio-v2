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
// imported, and caches the parsed list. It therefore has to be set before the
// first handler call in this file pulls `analytics.ts` (and through it
// `lib/auth.ts`) into the module graph - stubbing it inside a test body is too
// late if an earlier test already loaded the module.
const ADMIN_EMAIL = "admin@example.com";

describe("analytics.getStats authorization", () => {
  beforeEach(() => {
    vi.stubEnv("ADMIN_EMAIL", ADMIN_EMAIL);
  });

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

  it("still reaches the handler for an admin identity", async () => {
    // The other half of the guard: rejecting anonymous callers is only correct
    // if the legitimate caller still gets through. With the Umami credentials
    // unset the handler short-circuits to `null` rather than throwing, which is
    // the pre-existing behaviour. `null` alone would not distinguish "guard
    // passed" from "no guard at all", so what this pins is the narrower and
    // still useful property that `requireAdmin` does not reject a real admin -
    // if the email lookup or `ADMIN_EMAIL` parsing regressed, this throws.
    vi.stubEnv("UMAMI_URL", "");
    vi.stubEnv("UMAMI_WEBSITE_ID", "");
    vi.stubEnv("UMAMI_USERNAME", "");
    vi.stubEnv("UMAMI_PASSWORD", "");

    const t = convexTest(schema, modules);

    const result = await t
      .withIdentity({ subject: "admin-user", email: ADMIN_EMAIL })
      .action(api.analytics.getStats, { startAt: 0, endAt: 1 });

    expect(result).toBeNull();
  });

  it("resolves an admin whose identity carries no email claim", async () => {
    // This is the path production actually takes. Convex Auth's JWT carries
    // only `sub` (formatted `userId|sessionId`) and this version exposes no
    // custom-claims hook, so `identity.email` is undefined in production and
    // `requireAdmin` has to resolve the address from the `users` table - or,
    // in an action context like this one, through
    // `internal.admin.getUserEmail`. The test above supplies an email on the
    // identity, which production never does; if the lookup regressed, the
    // sole admin would lose the analytics widget and nothing would fail.
    vi.stubEnv("UMAMI_URL", "");
    vi.stubEnv("UMAMI_WEBSITE_ID", "");
    vi.stubEnv("UMAMI_USERNAME", "");
    vi.stubEnv("UMAMI_PASSWORD", "");

    const t = convexTest(schema, modules);

    const userId = await t.run((ctx) => ctx.db.insert("users", { email: ADMIN_EMAIL }));

    // Deliberately no `email` field on the identity.
    const result = await t
      .withIdentity({ subject: `${userId}|session` })
      .action(api.analytics.getStats, { startAt: 0, endAt: 1 });

    expect(result).toBeNull();
  });
});
