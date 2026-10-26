# Blog Discovery Correctness — Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

Make the public blog index list and filter what the CMS actually contains. Today the index
loads a fixed snapshot of the 100 most recent published posts and then filters that array by
substring-matching slugs, so category and tag views return the wrong posts, and anything
past the hundredth post is unreachable. The paginated, index-backed query that should serve
this page already exists in `convex/blog.ts`; it has no caller, and one of its arguments is
silently ignored.

## Problem / Motivation

`BlogContent` calls `api.blog.listRecent({ limit: 100 })`, then filters the result with
`post.slug.includes(category)` and `post.slug.includes(tag)`, and slices the filtered array
by page. Three defects follow directly:

1. **Wrong results.** A post is only included in `?category=<slug>` or `?tag=<slug>` when
   the slug happens to contain the filter text. A post whose slug is `shipping-fast` but
   whose category is `devops` never appears under `devops`, while an unrelated post whose
   slug happens to contain the tag text appears under that tag.
2. **Invisible posts.** `listRecent` caps at 100, so post 101 onwards can never be listed
   or reached by any page number.
3. **Wrong page count.** `totalPages` is computed from the capped snapshot, so paging
   over-estimates or under-estimates the real filtered set.

`blog.listPublished` (`convex/blog.ts`) already resolves a category slug to an id, filters
on `status === "published"`, and supports cursor pagination, but no file under `src/` calls
it. Its `tagSlug` argument is declared and never read: the handler branches only on
`categorySlug` and otherwise returns every published post. Because nothing calls it, neither
its dead argument nor its unused pagination branch has ever been exercised by a test or a
user.

The visible effect is that tag links rendered by `TagCloud` on the blog index lead to
results that do not correspond to the tag. For the owner, that is a content-discovery bug
on the page whose job is being hired-read; for a reader, tag navigation is unreliable.

## Goals & Success Metrics

- **Goal:** `/blog` lists and filters exactly the published posts that match the requested
  category or tag, with no upper bound on how many posts are reachable.
- **Metric:** 0 substring comparisons against `post.slug` in the blog listing path;
  `/blog?tag=<slug>` returns exactly the posts carrying that tag; posts numbered 101+ are
  reachable by page; the filtered page count equals `ceil(matches / pageSize)`; all
  configured gates exit 0.

## Scope

### In Scope

- Replace the snapshot-plus-filter approach in `BlogContent` with a server-side paged query
  whose result is rendered directly.
- Make category filtering resolve the slug to its id and match on `categoryId`.
- Make tag filtering resolve the slug to its id and match on membership in `tagIds`.
- Keep the URL-driven, page-numbered pagination the page already renders, including the
  empty state and the prev/next boundary behaviour.
- Report the filtered total so the page count is correct.
- Add backend tests for the published-listing contract and component tests for the index
  rendering.

### Out of Scope

- New `/blog/tag/<slug>` or `/blog/category/<slug>` routes. Filtering stays query-param
  driven, matching the existing `TagCloud` links.
- Blog search, full-text indexing, or tag suggestion.
- Optimising `blog.listRecent`, which the home page uses for three posts; its
  collect-then-sort remains as-is and is recorded as a follow-up.
- Changes to admin blog editing, taxonomy management, RSS, or the sitemap.
- Any visual redesign of the blog index.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | The blog index renders published posts from a server-side paged query; no fixed snapshot is fetched and sliced in the browser, and every published post is reachable by page number. | must |
| FR-2 | `?category=<slug>` filters by the post's resolved `categoryId`; a post is included only when its category matches, never because its slug contains the category slug. | must |
| FR-3 | `?tag=<slug>` filters by membership in the post's `tagIds`; the argument is no longer accepted-and-ignored. | must |
| FR-4 | The rendered page count equals `ceil(matches / pageSize)` for the active filter, and prev/next are disabled at the first and last page. | must |
| FR-5 | A page number past the last page, an unknown category slug, or an unknown tag slug renders the existing empty state rather than an error or an out-of-range slice. | must |
| FR-6 | Regression tests fail if filtering reverts to slug-substring matching, if non-published posts leak into the public listing, or if the page boundary arithmetic regresses. | must |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | No dependency is added, removed, or upgraded; `package.json` and `pnpm-lock.yaml` are unchanged. |
| NFR-2 | The public listing path performs no unbounded `.collect()` over `blogPosts`; the work is bounded by the requested page and, for tag filtering, by the published set. |
| NFR-3 | Draft posts and posts whose scheduled time has not arrived remain invisible on every public path. |
| NFR-4 | Pagination stays keyboard-operable links; no new lint or accessibility diagnostics appear. |
| NFR-5 | No secrets, credentials, or PII appear in the diff; `pnpm type-check`, `pnpm lint`, `pnpm format:check`, `pnpm test`, and `pnpm build` exit 0. |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | With 100+ published posts, page 12 renders the correct posts and no published post is excluded from the reachable range. | FR-1 |
| AC-2 | A post whose slug does not contain its category slug appears under that category, and a post whose slug merely contains another category's slug does not. | FR-2 |
| AC-3 | Two posts, one tagged `react` with an unrelated slug and one untagged with slug `reactive-ui`, are filtered correctly by `?tag=react`. | FR-3, FR-6 |
| AC-4 | `totalPages` for a filtered listing equals `ceil(matches / pageSize)`, and prev/next disable at pages 1 and `totalPages`. | FR-4 |
| AC-5 | An unknown slug and a page beyond the last render the empty state with no thrown error. | FR-5 |
| AC-6 | A draft post and a future-dated scheduled post are absent from every page and from the filtered total. | NFR-3 |
| AC-7 | Every command in NFR-5 exits 0 on the final HEAD, and the new backend test fails against the pre-fix handler. | FR-6, NFR-5 |

## Edge Cases

- **No published posts at all:** the index renders the empty state on page 1 with no
  pagination control.
- **Filter matches nothing:** empty state, page count of one, pagination hidden.
- **Slug collision:** a category slug that is a substring of another post's slug must not
  match that post; this is the specific regression AC-2 pins.
- **Page beyond the last:** the URL may be hand-edited (`?page=99`); the response is the
  empty state, not a slice of an empty array with a misleading page count.
- **Scheduled posts:** `publishScheduled` runs every minute, so a post with a future
  `scheduledAt` is still `draft`; the listing must not show it early.
- **Tag with no published posts:** included in the filtered total as zero and renders the
  empty state, even though `TagCloud` counts may be non-zero if the tag is only used by
  drafts.

## Dependencies

- **Tracks:** none. The merged `20261026-remove-dev-surfaces` track touched the admin
  dashboard and demo routes only, not the blog listing path.
- **External:** none.

## Open Questions & Assumptions

- **Decision:** `blog.listPublished` changes from `paginationOpts` to page-based
  `{ page, pageSize, categorySlug, tagSlug }`, returning `{ posts, totalPages, total }`.
  Justification: the function has no caller in `src/`, and page numbers are already the
  page's contract (URL search params and the shared `Pagination` component). Keeping the
  cursor shape would force a UI rewrite to query tokens for no user-visible gain.
- **Decision:** tag filtering is applied after the published-only read rather than through
  a new index, because Convex cannot index array membership. The published set is the bound
  and the site is a personal blog, so the cost is acceptable; NFR-2 records the constraint
  so a future high-volume change revisits it.
- **Assumption:** `TagCloud`'s links (`/blog?tag=<slug>`) are the intended entry point;
  no separate tag routes are expected.
- **Assumption:** `readingTime`, `publishedAt`, and cover images are already rendered by
  `BlogCard` and are unaffected by the query change.
- **Open questions:** none blocking.

## References

- `src/components/features/blog/BlogContent.tsx` — snapshot fetch, substring filter,
  client-side slicing.
- `convex/blog.ts` — `listPublished` (unused, ignores `tagSlug`) and `listRecent`.
- `src/routes/blog.index.tsx` — `page`/`category`/`tag` search schema and layout.
- `src/components/features/TagCloud.tsx` — tag links that depend on correct filtering.
- `src/components/ui/pagination.tsx` — shared page-number control.
- `conductor/archive/20261026-remove-dev-surfaces/verification/phase-4.md` — baseline gate
  and coverage numbers.
