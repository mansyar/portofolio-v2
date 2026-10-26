/**
 * Site identity used when no CMS setting overrides it. Kept here so the head,
 * the admin tree, and the 404 boundary compose the same name.
 */
export const DEFAULT_SITE_NAME = "Muhammad Ansyar Rafi Putra | Portfolio";

/** Public origin used when nothing is configured, or when the config is a dev host. */
export const DEFAULT_SITE_ORIGIN = "https://ansyar-world.top";

const LOOPBACK_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i;

/**
 * The one origin canonical, Open Graph, sitemap, and feed URLs are built from.
 *
 * A canonical must never point at a developer machine, so a loopback value is
 * rejected even in development — the example env file ships one, and a preview
 * build once published `http://localhost:3000` as its canonical. Read inside the
 * function so runtime overrides and tests are honoured rather than inlined.
 */
export function siteUrl(): string {
  const configured = (import.meta.env.VITE_APP_URL ?? "").trim().replace(/\/+$/, "");

  if (!configured || LOOPBACK_ORIGIN.test(configured)) return DEFAULT_SITE_ORIGIN;
  return configured;
}
