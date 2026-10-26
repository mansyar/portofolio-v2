# Review: Remove Dev Surfaces and Admin Dead Ends

- **Track:** `20261026-remove-dev-surfaces`
- **Type:** `chore`
- **Branch:** `chore/20261026-remove-dev-surfaces`
- **Range:** `8c9fb790880d49852efc178c5bdee6c3d560f82c..c56570e`
- **Date:** 2026-10-26
- **Verdict:** `PASS`
- **Doc sync:** `none`

## Summary

The track is complete and ready to merge. Seven demo routes, their only data module, and
the generated route-tree entries that exposed them are gone; the build artifact contains
no trace of them. The admin dashboard's two disabled actions are now real links to routes
that already existed, and the fabricated System Status panel is removed rather than
replaced with invented numbers. `docs/PROGRESS.md` now agrees with itself about Phase 9.

Review found no blocking, medium, or low code findings. Two things a reviewer might raise
are deliberate, recorded decisions in `spec.md` rather than defects: old `/demo/*` URLs
404 with no redirect (the routes were unlinked scaffolding), and the 22 pre-existing lint
warnings are untouched (explicitly out of scope).

## Verification

All commands were run fresh on the final HEAD as separate processes, captured in
`verification/integrated.md`.

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| typecheck | `pnpm type-check` | pass (exit 0) | verification/phase-4.md, integrated.md |
| lint | `pnpm lint` | pass (exit 0 — 22 pre-existing warnings, 0 errors) | verification/phase-4.md |
| format | `pnpm format:check` | pass (exit 0) | verification/phase-4.md |
| test | `pnpm test` | pass (exit 0 — 36 files, 95 tests) | verification/phase-3.md, phase-4.md |
| coverage | `pnpm test:coverage` | pass (exit 0 — lines 19.64%, functions 14.82%; floor 3%) | verification/phase-4.md |
| build | `pnpm build` | pass (exit 0 — client + SSR + server) | verification/phase-4.md, integrated.md |

## Requirements

| ID | Implemented by | Verified by | Status |
| --- | --- | --- | --- |
| FR-1 | P1.T1, P1.T3 | `git rm` of seven routes; regenerated tree has no `Demo*` or `/demo` path; `.output` grep empty | covered |
| FR-2 | P1.T2 | `src/data/demo.punk-songs.ts` deleted; `demo.punk-songs` has no references | covered |
| FR-3 | P2.T1, P2.T2 | `admin-dashboard.test.tsx` role+name+href assertions | covered |
| FR-4 | P2.T3 | `admin-dashboard.test.tsx` absence assertions (`99.9%`, `456mb`, `CPU:`, `Memory:`, `Disk:`, `System Status`) | covered |
| FR-5 | P4.T1 | one-line diff in `docs/PROGRESS.md`; row matches header and section | covered |
| FR-6 | P3.T1, P3.T2 | `route-surface.test.ts` (4 tests) and `admin-dashboard.test.tsx` (3 tests) | covered |
| NFR-1 | — | `git diff --name-only base..HEAD -- package.json pnpm-lock.yaml` empty | covered |
| NFR-2 | P1.T3 | `routeTree.gen.ts` changed only through `pnpm build` | covered |
| NFR-3 | — | `git diff --name-only base..HEAD -- convex` empty | covered |
| NFR-4 | P2 | Biome a11y rules stay at `error` with 0 diagnostics; wired actions are anchors | covered |
| NFR-5 | — | diff carries no secrets, credentials, or real personal data | covered |
| NFR-6 | P4.T3 | all six commands exit 0; coverage rose on every metric | covered |
| AC-1 | P1.T1–P1.T4 | directory, module, generated tree, and route-source scans | covered |
| AC-2 | P4.T2 | `.output` removed, rebuilt, grepped: no demo strings or chunks | covered |
| AC-3 | P1.T1–P1.T2 | file absent; grep for `demo.punk-songs` returns nothing | covered |
| AC-4 | P2.T1–P2.T2, P2.T4 | rendered links with correct accessible names and destinations | covered |
| AC-5 | P2.T3 | absent-metric assertions on the rendered dashboard | covered |
| AC-6 | P4.T1 | Phase 9 row reads complete | covered |
| AC-7 | P3.T3, P4.T3 | both guards failed on reverted mutation probes; probes removed; gate green | covered |

## Findings

None. Every quality gate in `conductor/workflow.md` passes, the diff stays inside the
plan's `Touches`, and the two new test files follow the existing
`src/routes/__tests__/` mocking pattern without introducing `as unknown` outside the
justified `vi.mock` cast used elsewhere in that directory.

## Overrides

None required.

## Notes

- **Reviewer execution:** this review was performed inline by the primary agent against
  `spec.md`, `plan.md`, the phase evidence, and `conductor/code_styleguides/`. No separate
  reviewer subagent is available in this environment, so there is no independent
  reviewer transcript to cite.
- **Doc sync:** `product.md`, `tech-stack.md`, and `product-guidelines.md` describe no
  demo route, no dashboard quick action, and no system-status panel, so no documentation
  edit was required. `docs/PROGRESS.md` was already corrected inside the track.
- **Design note:** the two dashboard actions reuse the existing `Link` and
  `terminal-button` treatments, so the page keeps its visual language instead of gaining
  a new one.
