# Phase R1 — Review Fixes

- **Track:** `20261026-blog-discovery-correctness` — Blog Discovery Correctness
- **Phase:** R1
- **Date:** 2026-10-26
- **Branch:** `fix/20261026-blog-discovery-correctness`
- **Base:** `5507695`
- **Head:** `32a1959`
- **Result:** verified

## Finding resolved

| ID | Severity | Finding | Resolution |
| --- | --- | --- | --- |
| F1 | Low | `page`/`pageSize` were clamped but not floored, so a hand-edited `?page=1.5` produced a fractional window (`start = 4.5`) and a fractional current page in the control. | Both inputs are floored before use; a backend case asserts `page=1.5, pageSize=3.7` behaves as page 1 of 3. |

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| unit | `pnpm exec vitest run convex/__tests__/blog.listPublished.test.ts` | 0 | 7 tests passed (was 6) |
| static | `pnpm type-check` | 0 | Clean |
| static | `pnpm lint` | 0 | 167 files; 21 warnings, 0 errors |
| static | `pnpm format:check` | 0 | Clean |
| unit | `pnpm test` | 0 | 38 files, 106 tests |
| build | `pnpm build` | 0 | Client 19.41s, SSR 3.47s, server 38.57s |

## Notes

- Whole-number behaviour is unchanged: the existing paging and boundary cases still pass
  without modification.
- F2 (the O(published) scan used to report an exact total) is accepted debt recorded in
  `review.md` and tracked as a GitHub issue, not a code change in this phase.
