## Summary

`/blog` declared `loaderDeps` but its loader was an empty stub, so the listing server-rendered
as `SectionSkeleton` and filled in only after the client subscribed. The loader now seeds
`blog.listPublished` with the requested page and filters, using the same exported page-size
constant the component reads, so the prefetch key cannot drift from the render key.

## Track

- **ID:** `20261026-blog-index-prefetch`
- **Type:** `bug`
- **Spec:** [`conductor/archive/20261026-blog-index-prefetch/spec.md`](conductor/archive/20261026-blog-index-prefetch/spec.md)
- **Plan:** [`conductor/archive/20261026-blog-index-prefetch/plan.md`](conductor/archive/20261026-blog-index-prefetch/plan.md)
- **Review:** [`conductor/archive/20261026-blog-index-prefetch/review.md`](conductor/archive/20261026-blog-index-prefetch/review.md)

## What happened

| Phase | Goal | Result | Checkpoint | Notes |
| --- | --- | --- | --- | --- |
| 1: Prefetch the default listing | Page 1 is served from the loader's cache | verified | `3923c06` | Red run recorded before the fix: zero `ensureQueryData` calls, skeleton rendered |
| 2: Every listing state, and the full gate | Paged, filtered, and out-of-range states prefetch their own key; full gate plus build | verified | `4435244` | No production change needed; the loader already derived every value from `loaderDeps` |

## Requirements

- [x] `FR-1` — the loader awaits `ensureQueryData` with `page`, `pageSize`, `categorySlug`, and `tagSlug` for every search state (test: `src/routes/__tests__/blog-index-prefetch.test.tsx`)
- [x] `FR-2` — one exported page-size constant is shared by the loader and `BlogContent`
- [x] `FR-3` — the first render reads the prefetched entry instead of falling back to the skeleton
- [x] `NFR-1` — no dependency, lockfile, schema, or backend query changed
- [x] `NFR-2` — one listing prefetch per navigation; unset filters stay `undefined`
- [x] `NFR-3` — type-check, lint, format, test, and build all exit 0; coverage floor untouched
- [x] `NFR-4` — no markup or empty-state change
- [x] `AC-1` — default key equals `convexQuery(api.blog.listPublished, { page: 1, pageSize: 9 })`
- [x] `AC-2` — page 2, category, tag, and both filters each map to their own key
- [x] `AC-3` — prefetched posts render without the suspense fallback
- [x] `AC-4` — a page past the last one keeps the empty state
- [x] `AC-5` — the regression test fails against the pre-fix loader and passes after it

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| unit | `pnpm exec vitest run src/routes/__tests__/blog-index-prefetch.test.tsx` | pass (7 tests) | `conductor/archive/20261026-blog-index-prefetch/verification/phase-1.md`, `phase-2.md` |
| test | `pnpm test` | pass (45 files, 134 tests) | `conductor/archive/20261026-blog-index-prefetch/verification/integrated.md` |
| coverage | `pnpm test:coverage` | pass (lines 24.96% → 25.13%, floor 3%) | `phase-2.md` |
| lint | `pnpm lint` | pass (21 pre-existing warnings) | `integrated.md` |
| format | `pnpm format:check` | pass | `integrated.md` |
| typecheck | `pnpm type-check` | pass | `integrated.md` |
| build | `pnpm build` | pass | `integrated.md` |

## Review

- **Verdict:** `PASS`
- **Rounds:** 1
- **Fixed:** 0 findings
- **Accepted/deferred:** 0

## Deviations and risks

- None against the plan. The page-size constant moved from `BlogContent.tsx`'s module scope to
  an export of the same file; no new module was introduced.
- Navigations to `/blog` now wait for the listing fetch in the loader, which is the same
  contract `/about` and `/blog/$slug` use. If Convex is unreachable, the router's
  `ErrorFallback` handles the rejection instead of leaving a skeleton on screen.
- The `TagCloud` aside keeps its own Suspense boundary and still shows its placeholder; that
  is deliberately out of scope.

## Follow-ups

- none

## Rollback

```bash
# Squash merge: revert the single commit on the base branch
git revert --no-edit <squash-merge-sha>
```

No migration, data, or configuration change is involved.
