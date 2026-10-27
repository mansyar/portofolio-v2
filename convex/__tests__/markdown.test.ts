import { describe, expect, it } from "vitest";
import { convertMarkdown, isSafeUrl } from "../lib/markdown";

/**
 * Mirrors `ALLOWED_TAGS` in `src/lib/sanitize.ts`. The renderer may only emit
 * these; a tag outside the list would be stripped on render and is treated here
 * as a conversion bug.
 */
const ALLOWED_TAGS = new Set([
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "br",
  "hr",
  "strong",
  "em",
  "u",
  "s",
  "code",
  "pre",
  "ul",
  "ol",
  "li",
  "blockquote",
  "a",
  "img",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "div",
  "span",
]);

const tagsIn = (html: string): string[] =>
  [...html.matchAll(/<\/?([a-z][a-z0-9]*)\b/gi)].map((match) => match[1].toLowerCase());

const converted = (markdown: string) => {
  const result = convertMarkdown(markdown);
  if (!result.ok) throw new Error(`expected conversion to succeed: ${result.error}`);
  return result;
};

describe("convertMarkdown", () => {
  it("renders headings, emphasis, and lists as allowlisted tags", () => {
    const { html } = converted(
      ["## A heading", "", "Some **bold** and _italic_ text.", "", "- one", "- two"].join("\n")
    );

    expect(html).toContain("<h2>A heading</h2>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>italic</em>");
    expect(html).toContain("<li>one</li>");

    for (const tag of tagsIn(html)) {
      expect(ALLOWED_TAGS.has(tag)).toBe(true);
    }
  });

  it("keeps the language class on fenced code", () => {
    const { html } = converted(["```ts", "const x = 1;", "```"].join("\n"));

    expect(html).toContain('<pre><code class="language-ts">');
    expect(html).toContain("const x = 1;");
  });

  it("renders strikethrough as s, which the render allowlist keeps", () => {
    const { html } = converted("This is ~~gone~~.");

    expect(html).toContain("<s>gone</s>");
    expect(html).not.toContain("<del>");
  });

  it("renders tables", () => {
    const { html } = converted(["| a | b |", "| --- | --- |", "| 1 | 2 |"].join("\n"));

    expect(html).toContain("<table>");
    expect(html).toContain("<th>a</th>");
    expect(html).toContain("<td>1</td>");
  });

  it("escapes raw HTML instead of storing it", () => {
    const { html } = converted('Before <script>alert("x")</script> after');

    expect(html).not.toContain("<script");
    expect(html).toContain("&lt;script&gt;");

    for (const tag of tagsIn(html)) {
      expect(ALLOWED_TAGS.has(tag)).toBe(true);
    }
  });

  it("strips unsafe link and image destinations", () => {
    const { html } = converted(
      ["[click](javascript:alert(1))", "", "![alt](data:image/png;base64,AAAA)"].join("\n")
    );

    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("data:image");
    expect(html).toContain("click");
    expect(html).toContain("alt");
  });

  it("keeps http, https, mailto, and relative links", () => {
    const { html } = converted(
      [
        "[a](https://example.com)",
        "[b](http://example.com)",
        "[c](mailto:me@example.com)",
        "[d](/contact)",
        "[e](#section)",
      ].join(" ")
    );

    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('href="http://example.com"');
    expect(html).toContain('href="mailto:me@example.com"');
    expect(html).toContain('href="/contact"');
    expect(html).toContain('href="#section"');
  });

  it("does not leave event attributes behind", () => {
    const { html } = converted('<img src="x" onerror="alert(1)">');

    // The whole tag is escaped, so the attribute survives only as inert text.
    expect(html).not.toMatch(/<[^>]*\sonerror=/i);
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });

  it("refuses an empty body", () => {
    expect(convertMarkdown("")).toEqual({ ok: false, error: "body must not be empty" });
    expect(convertMarkdown("   \n\t ")).toEqual({ ok: false, error: "body must not be empty" });
  });

  it("computes reading time from the rendered words", () => {
    const short = converted("one two three");
    expect(short.readingTime).toBe(1);

    const long = converted(Array.from({ length: 401 }, () => "word").join(" "));
    expect(long.readingTime).toBe(3);
  });
});

describe("isSafeUrl", () => {
  it("accepts relative and allowed schemes", () => {
    for (const value of [
      "https://example.com",
      "HTTP://example.com",
      "mailto:a@b.co",
      "/contact",
      "#top",
      "//example.com",
      "images/x.png",
    ]) {
      expect(isSafeUrl(value)).toBe(true);
    }
  });

  it("refuses executable and inline-data schemes", () => {
    for (const value of [
      "javascript:alert(1)",
      "JaVaScRiPt:alert(1)",
      "data:text/html;base64,AAAA",
      "vbscript:msgbox(1)",
      "file:///etc/passwd",
    ]) {
      expect(isSafeUrl(value)).toBe(false);
    }
  });
});
