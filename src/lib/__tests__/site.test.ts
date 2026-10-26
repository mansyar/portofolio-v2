import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SITE_ORIGIN, siteUrl } from "../site";
import { siteUrl as mailSiteUrl } from "../../../convex/lib/welcomeEmail";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("siteUrl", () => {
  it("falls back to the production origin when nothing is configured", () => {
    vi.stubEnv("VITE_APP_URL", "");

    expect(siteUrl()).toBe(DEFAULT_SITE_ORIGIN);
  });

  it("rejects a loopback origin", () => {
    vi.stubEnv("VITE_APP_URL", "http://localhost:3000");
    expect(siteUrl()).toBe(DEFAULT_SITE_ORIGIN);

    vi.stubEnv("VITE_APP_URL", "http://127.0.0.1:3000");
    expect(siteUrl()).toBe(DEFAULT_SITE_ORIGIN);
  });

  it("keeps a configured origin and strips trailing slashes", () => {
    vi.stubEnv("VITE_APP_URL", "https://preview.example.com/");

    expect(siteUrl()).toBe("https://preview.example.com");
  });

  it("agrees with the mail helper on the default origin", () => {
    vi.stubEnv("VITE_APP_URL", "");
    vi.stubEnv("SITE_URL", "");

    expect(siteUrl()).toBe(DEFAULT_SITE_ORIGIN);
    expect(mailSiteUrl()).toBe(DEFAULT_SITE_ORIGIN);
  });

  it("is the only origin the sitemap and feed consume", () => {
    const projectRoot = process.cwd();

    for (const route of ["src/routes/sitemap[.]xml.ts", "src/routes/feed[.]xml.ts"]) {
      const source = readFileSync(path.join(projectRoot, route), "utf8");

      expect(source, route).toMatch(/from "\.\.\/lib\/site"/);
      // The production site origin must not be hardcoded; the Convex host is separate.
      expect(source, route).not.toMatch(/"https:\/\/ansyar-world\.top"/);
    }
  });
});
