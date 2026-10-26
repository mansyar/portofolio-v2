# Review: Blog Discovery Correctness

- **Track:** `20261026-blog-discovery-correctness`
- **Type:** `bug`
- **Branch:** `fix/20261026-blog-discovery-correctness`
- **Range:** `048e99fc1e090e583c416269f8085008bbfe665b..32a1959`
- **Date:** 2026-10-26
- **Verdict:** `PASS`
- **Doc sync:** `none`

## Summary

The track fixes both halves of a real discovery bug. The backend listing now resolves
category and tag slugs to ids, matches on those ids, and returns a page plus the filtered
total; the index renders that page instead of fetching a fixed snapshot and filtering it by
slug substring. Every acceptance criterion is covered by a backend or component test, and
both regression directions were proven by a failing run that was then reverted.

Review found one Low defect, fixed in Phase R1, and one accepted cost trade-off that is
recorded as issue #6 rather than silently carried.

## Findings

| ID | Severity | Finding | Resolution |
| --- | --- | --- | --- |
| F1 | Low | `page`/`pageSize` were clamped but not floored; `?page=1.5` would compute a fractional window (`start = 4.5`) and pass a fractional current page to the control. | Fixed in Phase R1 — `Math.floor` before clamping, with a backend case for `page=1.5, pageSize=3.7`. |
| F2 | Low (accepted) | The listing walks the published set in 100-document batches on every page view to report an exact total, so each page view costs O(published) reads including bodies. | Accepted with the spec's stated trade-off (exact page numbers over cursor-only pagination); recorded as GitHub issue #6 with three options for when it matters. |

No High or Medium findings.

## Verification

All commands were run fresh on the final HEAD by the primary, as separate processes, after
`rm -rf .output`.

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| typecheck | `pnpm type-check` | pass (exit 0) | verification/integrated.md, phase-r1.md |
| lint | `pnpm lint` | pass (exit 0 — 21 warnings, 0 errors) | verification/integrated.md, phase-r1.md |
| format | `pnpm format:check` | pass (exit 0) | verification/integrated.md |
| test | `pnpm test` | pass (exit 0 — 38 files, 106 tests) | verification/phase-r1.md |
| coverage | `pnpm test:coverage` | pass (exit 0 — lines 22.82%, functions 16.29%; floor 3%) | verification/integrated.md |
| build | `pnpm build` | pass (exit 0) | verification/integrated.md, phase-r1.md |

## Requirements

| ID | Implemented by | Verified by | Status |
| --- | --- | --- | --- |
| FR-1 | P1.T3, P2.T1 | backend paging test (page 1 and page 3 of 12); no snapshot or slice remains in `BlogContent` | covered |
| FR-2 | P1.T2 | backend category-id test: `shipping-fast` under `devops`, `devops-notes` excluded | covered |
| FR-3 | P1.T2 | backend tag-membership test; red run showed the old handler returning the untagged post | covered |
| FR-4 | P1.T3, P2.T1 | `totalPages` from the query drives `Pagination`; backend asserts 3 pages for 12 posts at size 5 | covered |
| FR-5 | P1.T2, P1.T3, P2.T2 | unknown-slug and page-99 backend tests; component empty-state test | covered |
| FR-6 | P1.T1, P2.T2 | both mutation runs exited 1 and were reverted | covered |
| NFR-1 | — | `package.json` and `pnpm-lock.yaml` untouched by the diff | covered |
| NFR-2 | P1.T3 | batched `paginate({ numItems: 100 })`; only the requested window is retained | covered |
| NFR-3 | P1.T3 | draft and future-dated exclusion test | covered |
| NFR-4 | P2.T1 | `Pagination` untouched and still renders links; 0 lint errors | covered |
| NFR-5 | — | all five gate commands exit 0; fixtures carry no real data | covered |
| AC-1 | P1.T3, P2.T1 | no cap in the listing path; paging test with 12 posts | covered |
| AC-2 | P1.T2 | category-id test above | covered |
| AC-3 | P1.T2, P2.T2 | backend tag test plus component fixture containing both posts | covered |
| AC-4 | P1.T3, P2.T2 | `totalPages` assertions; component renders pages 1–3 and not 4 | covered |
| AC-5 | P1.T2, P1.T3, P2.T2 | backend empty-result tests; component empty state with no pagination | covered |
| AC-6 | P1.T3 | draft/future test | covered |
| AC-7 | P1.T1, R1 | gate green on HEAD; backend suite fails against the pre-fix handler | covered |

## Overrides

None required.

## Notes

- **Reviewer execution:** performed inline by the primary agent against `spec.md`,
  `plan.md`, the phase evidence, and `conductor/code_styleguides/`. No separate reviewer
  subagent is available in this environment, so there is no independent transcript to cite.
- **Doc sync:** `product.md`, `tech-stack.md`, and `product-guidelines.md` describe no
  listing contract or pagination shape, and `docs/PRD.md` already describes
  `api.blog.listPublished` as "Get published posts (paginated)", which remains true.
- **Deliberate non-change:** `BlogCard` still receives no category name, matching the
  previous behaviour; joining the category document would be a new feature, not part of
  this fix.
