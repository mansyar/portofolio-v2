# Phase 1 — Prefetch the default listing

- **Track:** `20261026-blog-index-prefetch`
- **Phase:** 1 — Prefetch the default listing
- **Date:** 2026-10-26
- **Branch:** `fix/20261026-blog-index-prefetch`
- **Base:** `c07b86d` (phase base)
- **Head:** `3923c06`
- **Result:** verified

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| unit (red) | `pnpm exec vitest run src/routes/__tests__/blog-index-prefetch.test.tsx` | 1 | 2 failed before the fix: the loader never called `ensureQueryData`, and `BlogContent` rendered `listing-skeleton` |
| unit | `pnpm exec vitest run src/routes/__tests__/blog-index-prefetch.test.tsx` | 0 | 2 passed |
| static | `pnpm type-check` | 0 | `tsc --noEmit` clean |
| static | `pnpm lint` | 0 | 21 pre-existing warnings, 0 errors |
| static | `pnpm format:check` | 0 | Biome clean |
| unit (suite) | `pnpm test` | 0 | 45 files, 129 tests (was 44 / 127) |

Raw output: `.conductor/evidence/20261026-blog-index-prefetch/phase-1-red-run.txt`,
`phase-1-gate.txt`, `phase-1-static.txt`, `phase-1-full-suite.txt`.

## Red run

Before the change the test failed for the intended reasons:

- `prefetches the default page under the key the listing reads` — `ensureQueryData`
  was called 0 times.
- `renders the prefetched posts without falling back to the skeleton` — the DOM
  contained only `<p>listing-skeleton</p>`.

That is the defect the track describes: the route declared its search dependencies and
never used them.

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-1 | The default state prefetches a key equal to `convexQuery(api.blog.listPublished, { page: 1, pageSize: 9 })` | `prefetches the default page under the key the listing reads` | met |
| AC-3 | After the loader runs, `BlogContent` renders both fixture titles and never renders the suspense fallback | `renders the prefetched posts without falling back to the skeleton` | met |

AC-2, AC-4, and AC-5 belong to Phase 2.

## Files changed

- `src/routes/blog.index.tsx` — the loader now awaits `ensureQueryData` with
  `page`, `pageSize`, `categorySlug`, and `tagSlug` from `deps`.
- `src/components/features/blog/BlogContent.tsx` — `ITEMS_PER_PAGE` became the exported
  `BLOG_PAGE_SIZE`, imported by the loader.
- `src/routes/__tests__/blog-index-prefetch.test.tsx` — new regression test.

## Deviations

None. Every file is inside the phase's `Touches`.

## Notes

- The test proves the cache key, not only the call. It renders `BlogContent` against the
  same `QueryClient` the loader populated, so a prefetch written under a slightly different
  argument object would still fail even though `ensureQueryData` was called.
- The page-size constant moved rather than being duplicated; the grep for
  `ITEMS_PER_PAGE` returns no remaining references.
- The repository convention of mocking `createFileRoute` as identity is reused; no router
  is booted and no production code was reshaped for testability.

## Primary verification

Re-ran the phase verification on `3923c06` after the commit:

```
$ pnpm exec vitest run src/routes/__tests__/blog-index-prefetch.test.tsx
 ✓ src/routes/__tests__/blog-index-prefetch.test.tsx (2 tests) 90ms
 Test Files  1 passed (1)
      Tests  2 passed (2)
exit 0
```

`git status --porcelain` was empty after the commit.
