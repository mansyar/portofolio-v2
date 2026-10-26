# Phase 1 — Server-side listing contract

- **Track:** `20261026-blog-discovery-correctness` — Blog Discovery Correctness
- **Phase:** 1
- **Date:** 2026-10-26
- **Branch:** `fix/20261026-blog-discovery-correctness`
- **Base:** `58a1f603885e70e3becff595a57833521e83dfad`
- **Head:** `1337b89`
- **Result:** verified

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| unit | `pnpm exec vitest run convex/__tests__/blog.listPublished.test.ts` | 0 | 6 tests passed across the listing contract |
| static | `pnpm type-check` | 0 | `tsc --noEmit` clean |
| static | `pnpm lint` | 0 | 166 files; 21 warnings, 0 errors (baseline was 22 warnings) |
| static | `pnpm format:check` | 0 | Biome check clean |
| unit | `pnpm test` | 0 | 37 files, 101 tests passed |
| mutation | New tests against the pre-fix handler | 1 (expected) | All six failed; handler restored from the saved copy |
| mutation | Probe against the pre-fix handler, old args | 1 (expected) | Returned `reactive-ui` alongside the tagged post |

The phase verification command was run as written and exited `0`.

## Bug proof

Two independent failing runs were captured before the fix was accepted, because the
defect has two halves:

1. **Semantic bug (`phase-1-red-run.txt`).** Against the pre-fix handler, calling it with
   the old arguments and `tagSlug: "react"` returned **both** `reactive-ui` (untagged) and
   `shipping-fast` (tagged), proving `tagSlug` was accepted and discarded.
2. **Contract bug (`phase-1-mutation.txt`).** The committed test file run against the
   restored pre-fix handler failed all six tests, so the suite is not passing vacuously.

The fix was restored from a saved copy after each probe; `git diff` showed only
`convex/blog.ts` and the new test file afterwards.

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| FR-1 | Published posts are served by a paged query with no fixed snapshot or browser-side slice. | Handler pages by `page`/`pageSize` over the published set; 12-post test asserts page 1 and page 3 contents. | covered (server half; UI wiring is Phase 2) |
| FR-2 | `?category=` matches the resolved category id, never slug text. | `filters by category id` test: `shipping-fast` appears under `devops`, `devops-notes` does not. | covered |
| FR-3 | `?tag=` matches `tagIds` membership. | `filters by tag membership` test plus the red run showing the old handler returning the untagged post. | covered |
| FR-4 | Page count equals `ceil(matches / pageSize)`. | 12 posts at pageSize 5 → `totalPages: 3`; 2 posts → `totalPages: 1`. | covered |
| FR-5 | Unknown slug and out-of-range page return an empty page, not a fall-through or a slice of nothing. | `unknown category or tag` and `page 99` tests assert `posts: []` with the real total. | covered |
| FR-6 | Tests fail on a regression to slug-substring filtering and non-published leakage. | Both mutation runs exited 1; the draft/future test would fail if the status filter were dropped. | covered |
| NFR-2 | No unbounded `.collect()` over `blogPosts`. | The published set is walked with `.paginate({ numItems: 100 })`; only the requested window is retained. | covered |
| NFR-3 | Draft and not-yet-due posts stay invisible. | `excludes drafts and published posts dated in the future` test. | covered |

AC-1, AC-2, AC-3, AC-4, AC-5 and AC-6 span both phases: their server half is proven here,
their rendering half is Phase 2. AC-7 is satisfied by the end of Phase 2, which runs the
full gate including `pnpm build`.

## Evidence paths

- `.conductor/evidence/20261026-blog-discovery-correctness/phase-1-red-run.txt`
- `.conductor/evidence/20261026-blog-discovery-correctness/phase-1-mutation.txt`
- `.conductor/evidence/20261026-blog-discovery-correctness/phase-1-gate.txt`
- `convex/__tests__/blog.listPublished.test.ts`

## Deviations

None. Both changed files are inside `Touches`.

## Notes

- **Argument-shape change:** `paginationOpts` was replaced by `page`/`pageSize`. A grep over
  `convex/` and `src/` (excluding `_generated`) showed `listPublished` had no caller, so no
  client breaks. `paginationOptsValidator` is no longer imported.
- **Cost model:** the handler walks the published set in batches because Convex cannot
  index array membership and has no count primitive; the exact total is required for the
  page-number control. The trade-off is recorded in `spec.md` under Open Questions.
- **Future-dated guard:** a published post whose `publishedAt` is in the future is skipped.
  The cron normally keeps status and timestamp consistent, so this only guards a manual
  edit.
- **Pre-existing warning:** `convex/blog.ts:160` still carries a `categoryId!` assertion in
  `getRelated`. It predates this phase and is untouched; lint reports it as a warning, not
  an error.

## Primary verification

Run by the primary agent on `1337b89`, after the phase commit:

| Command | Exit | Result |
| --- | --- | --- |
| `pnpm exec vitest run convex/__tests__/blog.listPublished.test.ts` | 0 | 6 tests |
| `pnpm type-check` | 0 | Clean |
| `pnpm lint` | 0 | 166 files, 21 warnings, 0 errors |
| `pnpm format:check` | 0 | Clean |
| `pnpm test` | 0 | 37 files, 101 tests |
| `git diff --name-only <phase-base>..HEAD` | 0 | Exactly the two files in `Touches` |
| `git status --porcelain` | 0 | Empty |
