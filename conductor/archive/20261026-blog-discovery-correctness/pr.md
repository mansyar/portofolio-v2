## Summary

The blog index listed a fixed snapshot of the 100 most recent posts and filtered it by
`post.slug.includes(category)` / `includes(tag)`, so tag and category views returned the
wrong posts and anything older than the hundredth was unreachable. The published-listing
query already existed but had no caller and silently ignored its `tagSlug` argument. Both
now do the work on the server: slugs resolve to ids, filtering matches those ids, and the
index renders the returned page with an honest page count.

## Track

- **ID:** `20261026-blog-discovery-correctness`
- **Type:** `bug`
- **Spec:** [`conductor/archive/20261026-blog-discovery-correctness/spec.md`](conductor/archive/20261026-blog-discovery-correctness/spec.md)
- **Plan:** [`conductor/archive/20261026-blog-discovery-correctness/plan.md`](conductor/archive/20261026-blog-discovery-correctness/plan.md)
- **Review:** [`conductor/archive/20261026-blog-discovery-correctness/review.md`](conductor/archive/20261026-blog-discovery-correctness/review.md)

## What happened

| Phase | Goal | Result | Checkpoint | Notes |
| --- | --- | --- | --- | --- |
| 1: Server-side listing contract | `listPublished` filters by id and reports the filtered total | verified | `1337b89` | `paginationOpts` replaced by `page`/`pageSize`; function had no caller |
| 2: Blog index wiring | Index renders the server page; snapshot filter and slice gone | verified | `be78b77` | Component test feeds an untagged slug through a tag filter to guard the regression |
| R1: Review fixes | Floor fractional paging inputs | verified | `32a1959` | Low finding from review |

## Requirements

- [x] `FR-1` — server-side paged listing, no fixed snapshot (test: `convex/__tests__/blog.listPublished.test.ts`)
- [x] `FR-2` — category filters by resolved id, never slug text
- [x] `FR-3` — tag filters by `tagIds` membership; the ignored argument is gone
- [x] `FR-4` — page count equals `ceil(matches / pageSize)` and drives the control
- [x] `FR-5` — unknown slug and out-of-range page render the empty state
- [x] `FR-6` — tests fail on a return to slug-substring filtering or non-published leakage (test: `src/components/features/blog/__tests__/blog-content.test.tsx`)
- [x] `NFR-1` — no dependency or lockfile change
- [x] `NFR-2` — published set read in 100-document batches, no unbounded collect
- [x] `NFR-3` — drafts and future-dated posts stay invisible
- [x] `NFR-4` — pagination unchanged and still keyboard-operable links
- [x] `NFR-5` — all gates exit 0; no secrets or PII
- [x] `AC-1` … `AC-7` — see the requirements table in `review.md`

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| typecheck | `pnpm type-check` | pass | `conductor/archive/20261026-blog-discovery-correctness/verification/integrated.md` |
| lint | `pnpm lint` | pass (21 warnings, 0 errors) | same |
| format | `pnpm format:check` | pass | same |
| test | `pnpm test` | pass (38 files, 106 tests) | `conductor/archive/20261026-blog-discovery-correctness/verification/phase-r1.md` |
| coverage | `pnpm test:coverage` | pass (lines 22.82%, up from 19.64%) | `conductor/archive/20261026-blog-discovery-correctness/verification/integrated.md` |
| build | `pnpm build` | pass | same |

## Media

Not captured. The change is only observable against a running app with a populated Convex
backend and a tag with several posts; this environment has no credentials or seeded data to
render it, so nothing was captured rather than a fabricated or empty screenshot.

## Review

- **Verdict:** `PASS`
- **Rounds:** 2
- **Fixed:** 1 finding (F1, fractional paging inputs)
- **Accepted/deferred:** 1 (F2, O(published) count) — tracked as #6

## Deviations and risks

- **Argument-shape change:** `listPublished` moved from `paginationOpts` to
  `page`/`pageSize`. A grep over `convex/` and `src/` showed no caller, so no client breaks;
  it was API-dead before this branch.
- **Risk:** each index page view now costs O(published) reads to compute the exact total.
  Documented in the spec and tracked as #6.
- **Behaviour change for hand-edited URLs:** `?page=0`, negative values, and fractions now
  resolve to page 1 instead of producing an off-by-one window.

## Follow-ups

- #6 — count/index strategy for the listing total once the blog grows.

## Rollback

```bash
# Squash commit
git revert --no-edit <squash-commit>
```

No schema or data migration is involved; reverting restores the previous query shape and
the browser-side filtering.
