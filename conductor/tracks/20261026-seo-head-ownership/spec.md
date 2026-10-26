# SEO Head Ownership — Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

Give one component ownership of the document head. Today the root route declares a title and
`Seo` renders another, so every page ships two `<title>` elements; the root one comes first and
wins. Where the page title is read at all, it repeats the owner's name. Canonical, sitemap,
feed, and mail each derive the site origin differently, and nothing can mark a page
`noindex`, which leaves the token-bearing unsubscribe URL indexable. This track makes the head
single-owner, the origin single-source, and indexability explicit.

## Problem / Motivation

Rendering the built server during the previous track produced this for `/about`:

```html
<title>Muhammad Ansyar Rafi Putra | Portfolio</title>
<title>About Me | Muhammad Ansyar Rafi Putra | Muhammad Ansyar Rafi Putra | Portfolio</title>
<link rel="canonical" href="http://localhost:3000/about">
```

Three defects in one response:

1. **Two titles.** `src/routes/__root.tsx` puts a `title` in the root route's `head` meta, and
   `src/components/seo.tsx` renders a `<title>` element. React hoists the component title into
   the head, so both ship. The first (`title` elements are resolved in tree order) is the
   generic site name, which means page-specific titles are not what a browser tab or a crawler
   sees.
2. **Doubled name.** `Seo` composes `fullTitle` as `` `${title} | ${siteName}` `` where the
   default `siteName` is `Muhammad Ansyar Rafi Putra | Portfolio`, while seven routes already
   pass a title ending in `Muhammad Ansyar Rafi Putra` — About, Blog index, Contact, Projects
   index, Skills, Uses, and Unsubscribe.
3. **Origin drift.** `Seo` builds the canonical from `import.meta.env.VITE_APP_URL` (and the
   example env file sets it to `http://localhost:3000`), while `src/routes/sitemap[.]xml.ts`
   and `src/routes/feed[.]xml.ts` hardcode `https://ansyar-world.top`, and
   `convex/lib/welcomeEmail.ts` reads `SITE_URL`. A preview or a misconfigured production
   build can therefore publish localhost canonicals beside production sitemap URLs.

Separately, no file under `src/` or `public/` emits `noindex`, and `public/robots.txt` only
disallows `/admin/`. `/newsletter/unsubscribe?token=…` is a capability URL that changes state
when visited; it should not be indexed, and the sitemap already (correctly) omits it.

## Goals & Success Metrics

- **Goal:** One title per rendered page, composed once; one origin for every absolute URL the
  site publishes; an explicit indexability signal for pages that must not be indexed.
- **Metric:** exactly 1 `<title>` per SSR response (was 2); 0 route titles repeating the owner
  name (was 7); 1 origin resolver consumed by canonical, sitemap, and feed (was 3 sources);
  `noindex` present on the unsubscribe page (was absent); all gates exit 0.

## Scope

### In Scope

- Remove the title from the root route's `head`; keep charset and viewport there.
- Compose titles once in `Seo`, from a bare page title plus the site name.
- Strip the repeated owner name from the seven affected route titles.
- Give the admin tree a route-level title, and the 404 boundary a `Seo` title.
- Export the default site name so non-`Seo` surfaces cannot drift from it.
- One origin resolver, used by `Seo`, `sitemap.xml`, and `feed.xml`; loopback values never
  reach output.
- A `noindex` capability on `Seo`, applied to the unsubscribe page and the 404 boundary.
- Tests: exact composed title, single title element, a source guard over routes and the root
  head, resolver parsing and loopback rejection, mail-helper equivalence, and sitemap
  exclusion.

### Out of Scope

- A title on the router's error boundary. It can render inside the admin tree, whose title is
  route-level, so adding a second tag there would recreate the defect this track removes.
  Error pages keep no page title; that is recorded as accepted, not overlooked.
- Per-page titles inside the admin tree beyond the single "Admin" title.
- Moving `Seo` wholesale onto TanStack Router's route `head` API.
- Sitemap `lastmod`, OG image generation, descriptions, keywords, or structured data changes.
- Adding `Disallow` rules for token URLs. `Disallow` prevents a crawler from reading the
  `noindex` it would need to see; the meta tag is the correct mechanism.

## Bug Details

- **Reproduction steps:**
  1. Build and start the production server (`pnpm build`, then `node .output/server/index.mjs`).
  2. Request `/about` and `/blog/`; inspect the head.
- **Expected behavior:** one `<title>` reading `About Me | Muhammad Ansyar Rafi Putra |
  Portfolio`; canonical on the production origin; the unsubscribe page marked `noindex`.
- **Actual behavior:** two `<title>` elements, the first generic; the second repeats the owner
  name twice; canonical is `http://localhost:3000/...`; no `noindex` anywhere.
- **Root-cause hypothesis:** the head is written by two owners (`__root.tsx` head meta and the
  `Seo` component), route titles embed the site name a second time, and each URL producer
  resolves the origin independently.
- **Regression tests:** `src/components/__tests__/seo.test.tsx` asserts the exact title and a
  single `<title>`; `src/routes/__tests__/seo-surface.test.ts` fails if the root head declares
  a title or a route title embeds the owner name; `src/lib/__tests__/site.test.ts` pins the
  resolver. All three fail against the current code.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | A rendered public page contains exactly one `<title>`, composed by `Seo` as `<page title> \| <site name>`; the root route declares no title. | must |
| FR-2 | Route components pass bare page titles; no route title contains the owner or site name. | must |
| FR-3 | The admin tree renders exactly one title, and the 404 boundary renders exactly one title, without using `Seo` on admin pages. | must |
| FR-4 | Canonical, Open Graph URL/image, sitemap locations, and feed links derive from one origin resolver; a loopback origin is rejected in favour of the production origin. | must |
| FR-5 | `Seo` accepts `noindex` and emits `<meta name="robots" content="noindex">`; the unsubscribe page and the 404 boundary set it. | must |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | No dependency, schema, backend query, or environment-variable name changes; `package.json` and `pnpm-lock.yaml` are untouched. |
| NFR-2 | Server-rendered and client-rendered heads agree: one title, same canonical, after hydration and on client navigation. |
| NFR-3 | `pnpm type-check`, `pnpm lint`, `pnpm format:check`, `pnpm test`, and `pnpm build` exit 0; the coverage floor is not edited. |
| NFR-4 | Production output stays absolute and unchanged for the configured production origin (`https://ansyar-world.top` when nothing is configured). |
| NFR-5 | The title composition and origin resolver are pure functions/modules with no new network calls; existing `Seo` settings query stays the only dependency. |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | A response for `/about` and `/blog/` contains exactly one `<title>`, and it is the page-specific one. | FR-1 |
| AC-2 | The composed title is `About Me \| Muhammad Ansyar Rafi Putra \| Portfolio` — the owner name appears once. | FR-1, FR-2 |
| AC-3 | A source guard fails when the root `head` declares a title or a route title embeds `Muhammad Ansyar Rafi Putra`. | FR-1, FR-2 |
| AC-4 | `siteUrl()` returns the production origin for a loopback or missing `VITE_APP_URL`, preserves a configured origin with the trailing slash removed, and both the sitemap and feed import it. | FR-4 |
| AC-5 | The unsubscribe page emits `noindex`; the sitemap's static routes never include `/newsletter` or `/admin`. | FR-5 |
| AC-6 | `/admin/login` and a 404 response each render exactly one title. | FR-3 |
| AC-7 | All five gate commands exit 0 on the final HEAD, and the built-server response is checked for title count, canonical host, and `noindex`. | NFR-3 |

## Edge Cases

- **Client navigation:** the previous page's title must be replaced, not appended to. `Seo`
  owns the only title element, so React unmounts the old one.
- **Settings unavailable:** `Seo` falls back to the exported default site name; this is the
  path that produced the doubled title, so the fallback is exercised by the test.
- **Trailing slashes:** a configured origin ending in `/` must not produce `//about`.
- **Loopback config:** `http://localhost:3000` and `http://127.0.0.1:3000` are rejected;
  `https://example.com` is preserved.
- **404:** no route matches, so only the root head and `NotFound` render; `NotFound` must own
  the single title and mark it `noindex`.
- **Admin tree:** the route-level title applies to every child, none of which uses `Seo`; a
  future admin page adding `Seo` would create a second title, which is why the admin title
  lives on the route rather than in each page.
- **Health route:** `/health` returns its own HTML document with its own title and does not
  render the root shell; it is unaffected.

## Dependencies

- **Tracks:** none. The blog-prefetch track (`20261026-blog-index-prefetch`) is merged and
  touched no head code.
- **External:** none. No credentials are needed.

## Open Questions & Assumptions

- **Decision:** the site name stays `Muhammad Ansyar Rafi Putra | Portfolio` so production
  titles read `About Me | Muhammad Ansyar Rafi Putra | Portfolio`; only the duplicated second
  copy is removed.
- **Decision:** the origin resolver rejects loopback unconditionally rather than by build
  mode, because a canonical must never point at a developer machine regardless of environment.
- **Assumption:** `VITE_APP_URL` is the public origin for everything the web app renders, and
  `SITE_URL` remains the Convex mail origin; a test pins their default values together.
- **Accepted limitation:** error pages have no page title (see Out of Scope).
- **Open questions:** none blocking.

## References

- `src/routes/__root.tsx:21-36` — the root `head` that declares the title.
- `src/components/seo.tsx:40-44,69` — origin fallback, title composition, `<title>`.
- `src/routes/about.tsx:26`, `blog.index.tsx:42`, `contact.tsx:93`, `projects.index.tsx:21`,
  `skills.tsx:47`, `uses.tsx:21`, `newsletter/unsubscribe.tsx:54` — titles embedding the owner.
- `src/routes/sitemap[.]xml.ts:14`, `src/routes/feed[.]xml.ts:14` — hardcoded origins.
- `convex/lib/welcomeEmail.ts:1-7` — `SITE_URL` and its default.
- `public/robots.txt` — only `/admin/` is disallowed.
- `.env.example:14` — `VITE_APP_URL=http://localhost:3000`.
- `conductor/archive/20261026-blog-index-prefetch/` — the SSR check that surfaced this.
