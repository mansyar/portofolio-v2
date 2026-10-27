/**
 * Markdown conversion for the content API.
 *
 * The stored body is HTML because that is what the admin editor produces and what
 * the post page renders. An agent writes markdown, so the conversion happens here —
 * and it is the only place a body enters the database, which makes it the right
 * place to bound what can be stored.
 *
 * The renderer cannot use DOMPurify: `convex/http.ts` runs in Convex's runtime,
 * which has no Node APIs, so `jsdom` is unavailable. Safety is established by
 * construction instead — the renderer is restricted, raw HTML is escaped rather
 * than passed through, and link and image destinations are allowlisted. The render
 * path still runs `sanitizeHtml` as the final boundary.
 */

import { Marked, Renderer } from "marked";

/** GFM strikethrough is rendered as `s`, the tag the render allowlist keeps. */
const STRIKETHROUGH_OPEN = "<del>";
const STRIKETHROUGH_CLOSE = "</del>";

const WORDS_PER_MINUTE = 200;

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/**
 * Escapes text that must be stored literally.
 *
 * Used for raw HTML tokens: markdown allows inline HTML, and an agent (or a
 * model's mistake) should produce visible text rather than an executable element.
 */
const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character] ?? character);

const SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i;
const ALLOWED_SCHEME_PATTERN = /^(?:https?:|mailto:)/i;

/**
 * A destination is accepted when it is relative, a fragment, protocol-relative,
 * or carries an `http`, `https`, or `mailto` scheme. Everything else — notably
 * `javascript:` and `data:` — is refused.
 */
export const isSafeUrl = (href: string): boolean => {
  const value = href.trim();
  if (!SCHEME_PATTERN.test(value)) return true;

  return ALLOWED_SCHEME_PATTERN.test(value);
};

const renderer = new Renderer();
renderer.html = ({ text }) => escapeHtml(text);

/**
 * `walkTokens` mutates the parsed tokens before rendering, so a refused
 * destination never reaches the renderer at all.
 */
const marked = new Marked({
  gfm: true,
  renderer,
  walkTokens: (token) => {
    // Link and image tokens both carry `href`; checking structurally covers both
    // without narrowing the whole token union.
    if ("href" in token && typeof token.href === "string" && !isSafeUrl(token.href)) {
      token.href = "";
    }
  },
});

/** Matches `calculateReadingTime` in `convex/blog.ts`, measured on stored HTML. */
const readingTimeFor = (html: string): number => {
  const words = html
    .replace(/<[^>]*>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.ceil(words / WORDS_PER_MINUTE);
};

export type ConvertedBody =
  | { ok: true; html: string; readingTime: number }
  | { ok: false; error: string };

/**
 * Converts an authored body into the HTML subset the site renders.
 *
 * An empty body is refused rather than stored: a post with no content is a
 * mistake, not a draft state.
 */
export const convertMarkdown = (markdown: string): ConvertedBody => {
  if (markdown.trim() === "") {
    return { ok: false, error: "body must not be empty" };
  }

  const rendered = marked.parse(markdown, { async: false });
  const html = rendered
    .replaceAll(STRIKETHROUGH_OPEN, "<s>")
    .replaceAll(STRIKETHROUGH_CLOSE, "</s>");

  return { ok: true, html, readingTime: readingTimeFor(html) };
};
