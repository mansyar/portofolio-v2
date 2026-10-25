// @vitest-environment edge-runtime
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeFunctionReference } from "convex/server";
import { convexTest } from "convex-test";
import schema from "../schema";
import * as newsletter from "../newsletter";

// `convex-test` loads a function's module out of this map, so every Convex
// module has to be listed. The `_generated` directory is what lets the library
// work out the module root; the test files are excluded so they are not
// mistaken for Convex modules.
const modules = import.meta.glob(["../**/*.ts", "!../__tests__/**"]);

// `api` and `internal` are the same runtime proxy, and an internal function is
// addressed by the same module path as a public one, so the name below is what
// `internal.newsletter.sendWelcomeEmail` resolves to once the action becomes
// internal. Building the reference from that name keeps this file compiling
// before and after the visibility change.
const sendWelcomeEmail = makeFunctionReference<"action">("newsletter:sendWelcomeEmail");

describe("newsletter.sendWelcomeEmail", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is not exposed as a public action", () => {
    // Any anonymous caller can otherwise send mail from the site's verified
    // sending domain and spend the Resend quota.
    expect(Object.hasOwn(newsletter.sendWelcomeEmail, "isPublic")).toBe(false);
    expect(Object.hasOwn(newsletter.sendWelcomeEmail, "isInternal")).toBe(true);
  });

  it("is still callable as an action so the subscribe scheduler can reach it", async () => {
    // The fix must convert the action, not delete it: `subscribe` schedules it
    // to deliver the welcome email. This test only proves the export still
    // exists and runs - it says nothing about reachability, because
    // `convex-test@0.0.41` does not enforce public/internal visibility and
    // would happily call it either way. The sibling test above is what pins
    // the visibility.
    vi.stubEnv("RESEND_API_KEY", "");

    expect(Object.hasOwn(newsletter, "sendWelcomeEmail")).toBe(true);

    const t = convexTest(schema, modules);
    await expect(t.action(sendWelcomeEmail, { email: "welcome@example.com" })).resolves.toBeNull();
  });
});
