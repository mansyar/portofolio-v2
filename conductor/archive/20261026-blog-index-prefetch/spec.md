# Blog Index Server Prefetch — Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

Make `/blog` render its listing during SSR by prefetching the published-post query in
the route loader, the same way `/about` and `/blog/$slug` already do. The route already
declares the search dependencies it needs; the loader that should consume them is an empty
stub, so every listing — default, paged, tagged, categorized — is served as a skeleton and
filled in only after the client subscribes.

## Problem / Motivation

`src/routes/blog.index.tsx` declares `loaderDeps` for `page`, `category`, and `tag`, then
runs:

```ts
loader: async () => {
  // Prefetching logic...
},
```

`BlogContent` reads the listing through
`useSuspenseQuery(convexQuery(api.blog.listPublished, { page, pageSize, categorySlug, tagSlug }))`.
Because nothing seeds the query cache before render, the server has no data when it renders
the route: the `Suspense` boundary falls back to `SectionSkeleton`, the HTML ships without a
single post title, and the real listing appears after hydration and a Convex round trip.

This is not a house style the route deliberately opts out of. `src/routes/about.tsx` awaits
three `ensureQueryData` calls in its loader, and `src/routes/blog.$slug.tsx` does the same for
the post query and throws `notFound()` when the post is missing. The blog index is the only
public content route with a loader stub — a leftover from the blog-discovery work that
rewrote the listing query but never wired the loader. No test imports the index route, so
nothing caught it.

Readers on a slow connection see a skeleton where the content should be; crawlers and link
previews that do not execute the client bundle see an empty listing. The fix is small and
local: seed the same query the component already reads, with the same arguments.

## Goals & Success Metrics

- **Goal:** The server-rendered HTML for `/blog` contains the listing for the requested
  page and filters, with the client cache already warm on hydration.
- **Metric:** One loader-prefetched `blog.listPublished` call per navigation; 0 listing
  routes whose loader is empty; the new regression test fails against the pre-fix route and
  passes after it; all configured gates exit 0.

## Scope

### In Scope

- Prefetch `api.blog.listPublished` in the `/blog` loader using the `loaderDeps` values.
- One shared page-size constant consumed by both the loader and `BlogContent`, so the
  prefetch key cannot drift from the key the component reads.
- A regression test covering the default page, a later page, a category, a tag, both
  filters, and a page beyond the last one.
- A cache-level assertion that the component renders the prefetched posts without falling
  back to the skeleton.

### Out of Scope

- Prefetching the `TagCloud` sidebar. It keeps its own `Suspense` boundary, exactly as
  `RelatedPosts` does on the post page; changing it would widen the diff without changing
  the listing's first paint.
- Changing `blog.listPublished`, its pagination, or its filtering semantics.
- Validating or clamping an out-of-range `page` search value; the backend already returns an
  empty page and the route keeps that behavior.
- Raising the coverage floor. The ratchet is stale project-wide and belongs to its own chore,
  not to this bug fix.
- The admin blog listing, the post detail route, and the RSS/sitemap routes.

## Bug Details

- **Reproduction steps:**
  1. Request `/blog` (or `/blog?page=2`, or `/blog?tag=<slug>`) with the client bundle
     disabled, or view the server response before hydration.
  2. Inspect the region inside the listing `Suspense` boundary.
- **Expected behavior:** The response contains the post cards for the requested page and
  filters.
- **Actual behavior:** The response contains `SectionSkeleton` markup and no post titles; a
  Convex query is issued only after the client mounts.
- **Root-cause hypothesis:** `src/routes/blog.index.tsx` has an empty `loader` body despite
  declaring `loaderDeps`, and `BlogContent` suspends because the query cache is empty at
  render time. Nothing in the test suite imports the route, so the stub survived.
- **Regression test:** `src/routes/__tests__/blog-index-prefetch.test.tsx` — it reads the
  route's `loader`, runs it against a real `QueryClient`, and asserts both the prefetch
  arguments and that `BlogContent` renders the listing without its fallback. It must fail
  before the loader change and pass after it.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | The `/blog` loader awaits `context.queryClient.ensureQueryData(convexQuery(api.blog.listPublished, …))` with `page`, `pageSize`, `categorySlug`, and `tagSlug` taken from `loaderDeps`, for every search state. | must |
| FR-2 | The listing page size is defined once and imported by both the loader and `BlogContent`, so the prefetched key and the component's key cannot diverge. | must |
| FR-3 | On first render after the loader resolves, `BlogContent` reads the prefetched entry from the cache and does not render its suspense fallback. | must |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | No dependency, lockfile entry, schema, or backend query changes; `package.json` and `pnpm-lock.yaml` are untouched. |
| NFR-2 | One `blog.listPublished` prefetch per navigation. Unset filters remain `undefined` so the key matches the component's `convexQuery` call exactly; no `null` or empty-string coercion is introduced. |
| NFR-3 | `pnpm type-check`, `pnpm lint`, `pnpm format:check`, `pnpm test`, and `pnpm build` exit 0, and coverage does not fall below the configured floor. |
| NFR-4 | The consumer-visible structure is unchanged: the same heading, the same skeleton as the slow-path fallback, and the same empty state. |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | Running the `/blog` loader for the default search state calls `ensureQueryData` with options whose query key equals `convexQuery(api.blog.listPublished, { page: 1, pageSize: 9 })`. | FR-1, FR-2 |
| AC-2 | `page: 2`, `category: "x"`, `tag: "y"`, and `category: "x"` with `tag: "y"` each produce a query key carrying those exact values, with unset filters left `undefined`. | FR-1, NFR-2 |
| AC-3 | After the loader runs against a query client whose fetch is stubbed with two posts, rendering `BlogContent` shows both titles and never renders the suspense fallback. | FR-3 |
| AC-4 | A page past the last one prefetches, resolves to an empty listing, and renders the "No posts found." state without throwing. | FR-1, NFR-4 |
| AC-5 | The five gate commands in NFR-3 exit 0 on the final HEAD, and the regression test fails against the pre-fix loader. | NFR-3 |

## Edge Cases

- **Default search state:** `page` comes from `validateSearch` as `1`, `category` and `tag`
  are `undefined`; the key must carry `page: 1` and omit nothing that the component sends.
- **Page only:** `?page=2` must prefetch page 2, not page 1.
- **Category only, tag only, both:** each maps to `categorySlug`/`tagSlug` respectively; a
  slug that does not exist returns the backend's empty page rather than the unfiltered list.
- **Page beyond the last:** the backend returns `{ posts: [], total, totalPages }`; the
  loader must not throw or redirect, and the route keeps its empty state.
- **Backend unavailable:** the loader rejects and the router's existing error component
  handles it. No new error UI is added, and the change must not swallow the rejection.
- **Hydration:** the client must find the same key in its cache, or the skeleton flashes back;
  the shared constant plus exact argument names are what prevent that.

## Dependencies

- **Tracks:** none. `20261026-blog-discovery-correctness` (#7) is merged and defined the
  query and its arguments; this track consumes them unchanged.
- **External:** none. No credentials or services are needed to run the tests.

## Open Questions & Assumptions

- **Assumption:** loader-seeded data is what SSR renders, because the router's `Wrap`
  provides the same per-instance `QueryClient` that the loader writes to, as `/about` and
  `/blog/$slug` already rely on.
- **Decision:** the page size moves to an exported constant in `BlogContent.tsx` rather than
  a new module, so the loader imports it from the component it feeds and no new file is
  introduced.
- **Decision:** the regression test exercises the loader and the component together instead
  of asserting on loader calls alone; a loader-only test would pass with a key the component
  never reads.
- **Open questions:** none blocking.

## References

- `src/routes/blog.index.tsx:19-22` — the empty loader and its unused `loaderDeps`.
- `src/components/features/blog/BlogContent.tsx` — `useSuspenseQuery` and `ITEMS_PER_PAGE`.
- `src/routes/about.tsx:13-18` — the established prefetch pattern.
- `src/routes/blog.$slug.tsx:20-25` — prefetch plus `notFound()` on the post route.
- `conductor/archive/20261026-blog-discovery-correctness/` — why the listing query is shaped
  this way.
