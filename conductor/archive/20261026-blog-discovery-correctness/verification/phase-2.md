# Phase 2 — Blog index wiring

- **Track:** `20261026-blog-discovery-correctness` — Blog Discovery Correctness
- **Phase:** 2
- **Date:** 2026-10-26
- **Branch:** `fix/20261026-blog-discovery-correctness`
- **Base:** `50c09fa90cd1b01eed83e6c4822591f77407330b`
- **Head:** `be78b77`
- **Result:** verified

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| static | `pnpm type-check` | 0 | `tsc --noEmit` clean |
| static | `pnpm lint` | 0 | 167 files; 21 warnings, 0 errors |
| static | `pnpm format:check` | 0 | Biome check clean |
| unit | `pnpm test` | 0 | 38 files, 105 tests passed |
| build | `pnpm build` | 0 | Client 33.61s, SSR 3.43s, server 37.11s |
| unit | `pnpm exec vitest run src/components/features/blog/__tests__/blog-content.test.tsx` | 0 | 4 tests passed |
| mutation | Reintroduced `slug.includes(tag)` filtering, then the component test | 1 (expected) | The "renders what the server returned" test failed; source restored |

The phase verification command was run as written and exited `0`.

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-1 | With 100+ published posts, page 12 shows the right posts and none are excluded. | The index requests `page`/`pageSize` from the server and has no cap; the backend test proves page 3 of 12 posts returns the remaining two. | covered |
| AC-2 | A post appears under its category even when its slug does not contain the category slug, and a slug look-alike does not. | `filters by category id` backend test (`shipping-fast` under `devops`, `devops-notes` excluded). | covered |
| AC-3 | `?tag=react` includes the tagged unrelated slug and excludes the untagged `reactive-ui`. | Backend test plus the component test whose fixture contains both. | covered |
| AC-4 | Page count equals `ceil(matches / pageSize)`; prev/next disable at the ends. | Backend returns `totalPages`; component passes it to the shared `Pagination` control, whose boundary classes and disabling are unchanged and pre-existing. | covered |
| AC-5 | Unknown slug and a page past the end render the empty state, not an error. | Backend `unknown slug` and `page 99` tests; component empty-state test asserts no pagination is shown. | covered |
| AC-6 | Draft and future-dated scheduled posts are absent from every page and the total. | `excludes drafts and published posts dated in the future` backend test. | covered |
| AC-7 | Every gate command exits 0, and the new backend test fails against the pre-fix handler. | Gate rows above; `phase-1-mutation.txt` and `phase-2-mutation.txt` both exited 1 for the intended reason. | covered |
| FR-1 | No fixed snapshot or browser-side slice in the listing path. | `BlogContent` queries the paged listing; `listRecent`, `slug.includes`, and the array slice are gone. | covered |
| FR-4 | Pagination reflects the filtered total. | `totalPages` comes from the query and drives the control. | covered |
| FR-5 | Page past the end, unknown category, unknown tag render the empty state. | Backend and component tests as above. | covered |
| FR-6 | Tests fail on a regression to slug-substring filtering. | Phase 2 mutation run exited 1 and was reverted. | covered |
| NFR-4 | Pagination stays real links; no new a11y diagnostics. | `Pagination` is untouched and still renders `Link` elements; lint reports 0 errors and the warning count is unchanged at 21. | covered |
| NFR-5 | Gates exit 0; no secrets or PII. | All five commands exit 0; the diff adds fixtures only. | covered |

## Evidence paths

- `.conductor/evidence/20261026-blog-discovery-correctness/phase-2-gate.txt`
- `.conductor/evidence/20261026-blog-discovery-correctness/phase-2-mutation.txt`
- `src/components/features/blog/__tests__/blog-content.test.tsx`

## Deviations

None. Both changed files are inside `Touches`.

## Notes

- **Test-side corrections during the phase:** the first run failed for three reasons that
  were all in the new test, not the component — a mock path one directory too shallow
  (`__tests__` adds a level), duplicate title/slug text causing an ambiguous text query, and
  the shared control rendering the current page as `[1]`. The component did not change to
  satisfy the tests.
- **Guard choice:** the component test deliberately feeds a response containing
  `reactive-ui` while `tag="react"` and asserts it still renders. That is what makes a
  reintroduced client-side filter fail rather than pass silently.
- **`BlogCard` props unchanged:** category name/slug is not passed, matching the previous
  behaviour; the query does not join the category document.
