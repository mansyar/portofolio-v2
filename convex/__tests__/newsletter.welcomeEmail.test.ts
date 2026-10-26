// @vitest-environment edge-runtime
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildUnsubscribeUrl, buildWelcomeEmailHtml, siteUrl } from "../lib/welcomeEmail";

describe("welcome email", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("includes an unsubscribe link carrying the subscriber's token", () => {
    const html = buildWelcomeEmailHtml("token-123");

    expect(html).toContain("/newsletter/unsubscribe?token=token-123");
    expect(html).toContain("Unsubscribe");
  });

  it("omits the link rather than emitting a broken one when there is no token", () => {
    const html = buildWelcomeEmailHtml(undefined);

    expect(html).not.toContain("unsubscribe");
    // The rest of the message is unaffected.
    expect(html).toContain("subscribe --success");
  });

  it("encodes tokens so a link cannot break out of the query string", () => {
    const url = buildUnsubscribeUrl("token with spaces&and=punctuation");

    expect(url).not.toContain(" ");
    expect(url.endsWith("=token%20with%20spaces%26and%3Dpunctuation")).toBe(true);
  });

  it("uses SITE_URL when the deployment sets one, without doubling the slash", () => {
    vi.stubEnv("SITE_URL", "https://staging.example.com/");

    expect(siteUrl()).toBe("https://staging.example.com");
    expect(buildUnsubscribeUrl("abc")).toBe(
      "https://staging.example.com/newsletter/unsubscribe?token=abc"
    );
  });
});
