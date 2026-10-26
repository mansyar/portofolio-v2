# Review: Blog Index Server Prefetch

- **Track:** `20261026-blog-index-prefetch`
- **Type:** `bug`
- **Branch:** `fix/20261026-blog-index-prefetch`
- **Range:** `a3ef7cd8ea149808891176db8bd19cfb5d5d089e..d238235` (code head `4435244`)
- **Date:** `2026-10-26T20:02:00+11:00`
- **Verdict:** `PASS`

## Summary

The loader now seeds the exact query the listing reads, and the regression test proves it at
the cache level rather than at the call site. Volume is small — three files, 185 added lines, most
of them the new test — so the whole diff was reviewed in one pass. No Critical, High,
Medium, or Low findings. The one behavior worth stating explicitly is that a Convex outage
during navigation now lands on the router's `ErrorFallback` instead of the listing skeleton;
that is the same contract `/about` and `/blog/$slug` already have, and it is recorded under
Out of scope rather than as a finding because the diff did not introduce an error path, it
joined the existing one.

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| test | `pnpm test` | pass (45 files, 134 tests) | `verification/integrated.md` |
| coverage | `pnpm test:coverage` | pass (lines 25.13%, floor 3%) | `verification/phase-2.md` |
| lint | `pnpm lint` | pass (21 warnings, 0 errors) | `verification/integrated.md` |
| format | `pnpm format:check` | pass | `verification/integrated.md` |
| typecheck | `pnpm type-check` | pass | `verification/integrated.md` |
| build | `pnpm build` | pass | `verification/integrated.md` |

The red run is preserved in `verification/phase-1.md` and
`.conductor/evidence/20261026-blog-index-prefetch/phase-1-red-run.txt`: two tests failed
against the pre-fix route, one on a zero-call `ensureQueryData`, one on the skeleton rendering
instead of the posts.

## Requirements

| ID | Implemented by | Verified by | Status |
| --- | --- | --- | --- |
| FR-1 | P1.T2 — loader awaits `ensureQueryData` with the four `loaderDeps` values | `prefetches the default page…`, four `search states` cases | covered |
| FR-2 | P1.T2 — `BLOG_PAGE_SIZE` exported from `BlogContent.tsx`, imported by the route | `pageSize: 9` pinned in every key assertion | covered |
| FR-3 | P1.T2 — seed before render | `renders the prefetched posts without falling back to the skeleton` | covered |
| NFR-1 | No dependency or backend change | diff lists only the route, the component, and the test; `package.json` and the lockfile are untouched | covered |
| NFR-2 | Exact argument object, unset filters left `undefined` | each state asserts one call and the full key | covered |
| NFR-3 | Full gate plus build | `verification/integrated.md` | covered |
| NFR-4 | Markup unchanged | production diff contains no JSX change | covered |
| AC-1 | P1.T1 | `prefetches the default page under the key the listing reads` | covered |
| AC-2 | P2.T1 | four `it.each` cases | covered |
| AC-3 | P1.T1 | `renders the prefetched posts…` | covered |
| AC-4 | P2.T2 | `keeps the empty state for a page past the last one` | covered |
| AC-5 | P2.T3 | `verification/integrated.md` | covered |

## Findings

### Critical

- none

### High

- none

### Medium

- none

### Low

- none

## Overrides

- none

## Plan compliance

Both phases carry a `Result`, `Checkpoint`, and `Evidence`. All five tasks and their
sub-tasks are `[x]` and each maps to a claim in the evidence files. The code diff is exactly
the union of the phases' `Touches`; no deviation was reported or needed. Phase 2 changed no
production file, which is consistent with its goal: the loader written in Phase 1 already
derived every value from `loaderDeps`, and Phase 2 proved it across the search matrix.

## Out of scope

- **Error path.** A failing prefetch rejects the loader, so the router's `ErrorFallback`
  replaces the route instead of the listing skeleton. This matches `/about` and
  `/blog/$slug`; no new handling was added.
- **Tag cloud.** The aside keeps its own Suspense boundary and still shows its placeholder
  while the listing is prefetched. Deliberate, per the spec.
- **Out-of-range pages.** `?page=999` keeps the backend's empty page rather than being
  clamped or redirected. Deliberate, per the spec.
- **Coverage floor.** `vite.config.ts` still gates at 3% lines / 3% functions against a
  measured 25.13%. Pre-existing project-wide gap; the spec assigns it to its own chore.

## Debt

- none

## Doc sync

`pending` — no product, guideline, tech-stack, or command change is implied by this fix.

## History

| Round | Verdict | Critical | High | Medium | Low | Fixed |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | PASS | 0 | 0 | 0 | 0 | 0 |
