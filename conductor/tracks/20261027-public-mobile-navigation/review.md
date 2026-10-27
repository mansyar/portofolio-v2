# Review: Public Mobile Navigation

- **Track:** `20261027-public-mobile-navigation`
- **Type:** `bug`
- **Branch:** `fix/20261027-public-mobile-navigation`
- **Range:** `196693e..39cade6`
- **Date:** `2026-10-27T04:25:00Z`
- **Verdict:** `PASS WITH FINDINGS`

## Summary

The track does what it was created to do: the public header now offers an accessible
disclosure menu below 768 px, the failing contract written in Phase 1 passes, all six
configured checks are green, and the coverage floor was raised rather than lowered. No
Critical or High finding was identified. Two Medium findings remain, both against edge
cases the spec itself lists and neither reachable in the common case: the panel is not
closed when the viewport crosses into the desktop layout, and it has no internal scroll
on a short viewport. `review.strict` is `true`, so both are fixed in Phase R1 rather than
deferred.

**This review was performed by the implementing agent.** The skill calls for a read-only
reviewer subagent; this host exposes none, so the separation that makes a review
independent is missing. The checks were re-run at review time and every finding was
confirmed against the diff, but the reader should discount the independence, not the
evidence.

**Volume strategy:** large (7 files, 565 insertions, 20 deletions). Reviewed per-phase
checkpoint diff first, then a cross-phase integration pass over the assembled branch.

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| typecheck | `pnpm type-check` | pass | review-time run, exit 0 |
| lint | `pnpm lint` | pass | exit 0, 0 errors, 21 warnings — identical to the pre-track baseline |
| format | `pnpm format:check` | pass | exit 0 |
| test | `pnpm test` | pass | 53 files, 193 tests |
| coverage | `pnpm test:coverage` | pass | 32.56% stmts / 24.34% funcs / 32.66% lines, floor 32 / 24 |
| build | `pnpm build` | pass | exit 0; built server serves `/` with the trigger and a `hidden` panel in its HTML |
| runtime | built server + `curl /` | pass | HTTP 200, `verification/phase-4.md` |

## Requirements

| ID | Implemented by | Verified by | Status |
| --- | --- | --- | --- |
| FR-1 | P2.T2 | `mobile-nav.test.tsx` "offers a control…" | covered |
| FR-2 | P2.T2 | `mobile-nav.test.tsx` "reports its state…", `mobile-nav.a11y.test.tsx` | covered |
| FR-3 | P2.T1, P2.T3 | `mobile-nav.test.tsx` "lists exactly the seven destinations…" | covered |
| FR-4 | P2.T4 | `mobile-nav.test.tsx` "closes on Escape…" | covered |
| FR-5 | P2.T4 | `mobile-nav.test.tsx` "closes on an interaction outside…" / "stays open… inside" | covered |
| FR-6 | P2.T4 | `mobile-nav.test.tsx` "closes when the route changes" | covered |
| FR-7 | P3.T1 | `mobile-nav.test.tsx` "marks the destination…" (3 cases) | covered |
| FR-8 | P3.T2 | `mobile-nav.test.tsx` "keeps the desktop row and the mobile control mutually exclusive" | covered (jsdom limitation recorded) |
| FR-9 | P3.T2 | `mobile-nav.test.tsx` "leaves exactly one navigation landmark exposed…" + SSR markup check | covered |
| FR-10 | P3.T3 | `mobile-nav.test.tsx` "declares its opening animation…" + emitted CSS | covered |
| FR-11 | P4.T1 | `mobile-nav.a11y.test.tsx` "declares a 44x44 target…" + emitted CSS | covered |
| NFR-1 | P4.T2 | lint exit 0; `biome.json` scripted read — seven a11y rules still `error` | covered |
| NFR-2 | P3.T3, P4.T2 | one co-located rule, justified in Phase 3; `package.json` unchanged | covered |
| NFR-3 | P2.T3 | built-server HTML: panel carries `hidden=""` on first paint | covered |
| NFR-4 | P4.T2 | `grep admin` in both changed components returns 0 | covered |
| NFR-5 | P1.T3, P2.T4 | no timers or animation waits in either test file | covered |
| NFR-6 | P4.T3 | floor 29 / 21 → 32 / 24, never lowered | covered |
| AC-1 … AC-6 | P1.T1–T3, P2 | `mobile-nav.test.tsx`, 8 cases | covered |
| AC-7 | P3.T1 | `mobile-nav.test.tsx` active-destination cases | covered |
| AC-8 | P3.T2 | `mobile-nav.test.tsx` exposure cases | covered |
| AC-9 | P3.T3 | emitted CSS: keyframe + reduced-motion override | covered |
| AC-10 | P4.T1 | `mobile-nav.a11y.test.tsx` | covered |
| AC-11 | P4.T3 | all five commands exit 0; diagnostics unchanged | covered |

## Findings

### Critical

- None.

### High

- None.

### Medium

- **F1 — The panel is not closed when the viewport crosses into the desktop layout**
  - **File:** `src/components/layout/MobileNav.tsx:47`
  - **What:** `isOpen` is only reset by the route-change adjustment. At ≥768 px the CSS
    removes the whole control, so the panel disappears visually while `isOpen` stays
    `true` and the trigger keeps `aria-expanded="true"`. Rotating a phone or dragging a
    window across the breakpoint and back reveals a panel that was never closed.
  - **Why:** The spec lists this edge case explicitly — "the panel closes and the desktop
    row takes over, leaving no orphaned panel or stale `aria-expanded`" — and a stale
    expanded state is a wrong announcement for assistive technology, not only a visual
    surprise.
  - **Fix:** Subscribe to `window.matchMedia("(min-width: 768px)")` while mounted and call
    `setIsOpen(false)` when it starts matching; cover it with a test that fires the
    registered `change` handler.
  - **Requirement:** spec Edge Cases (no AC maps to it)
  - **Test gap:** no case covers a viewport crossing the breakpoint; add one.

- **F2 — The panel has no internal scroll on a short viewport**
  - **File:** `src/components/layout/MobileNav.tsx:118`
  - **What:** The panel is absolutely positioned under the sticky header with no height
    cap. Seven 44 px rows plus padding is roughly 320 px; on a landscape phone the lower
    destinations can fall below the viewport while the panel stays pinned to the header,
    with no way to scroll to them.
  - **Why:** The spec's short-viewport edge case says the links "fit or the panel scrolls
    internally". Unreachable destinations inside the navigation that exists to make them
    reachable is the defect this track set out to remove.
  - **Fix:** Cap the panel at the space below the header —
    `max-h-[calc(100vh-4rem)] overflow-y-auto` — so it scrolls internally instead of
    running off the viewport.
  - **Requirement:** spec Edge Cases (no AC maps to it)
  - **Test gap:** not unit-testable in jsdom; verify the declared contract plus the
    emitted CSS, and record it as such.

### Low

- None recorded. The only candidate was the duplicated `md:hidden` on the header's mobile
  cluster and on `MobileNav`'s own root; the duplication is deliberate (the component
  owns its exposure rule) and carries no functional effect.

## Overrides

- None.

## Plan compliance

- All four phases are `verified` with a `Result`, `Checkpoint`, and `Evidence` file.
- All 15 tasks are `[x]`, and every one is accounted for in a phase report; none was
  dropped.
- The code diff stays inside the phases' `Touches` with two reported deviations: the new
  `MobileNav.css` (Phase 3, justified by the absent `animate-fade-in` animation
  declaration) and the test file's own router mock (Phase 3 and Phase 4, justified by the
  shared mock discarding props).
- No review-fix phase existed before this review.
- Phase evidence records the red-by-contract Phase 1 honestly rather than presenting a
  failing command as a pass.

## Out of scope

- **D1 — `animate-fade-in` is inert.** `src/routes/index.tsx` applies the class, but the
  built stylesheet contains no animation declaration for it (there is no
  `--animate-fade-in` theme entry), so the intended home-page fade never runs and the
  reduced-motion override in `src/styles/variables.css:82` guards a dead class.
  Pre-existing and unrelated to navigation; discovered while choosing the panel's motion
  mechanism.
- **D2 — `conductor/tech-stack.md` coverage policy is stale.** It still describes the
  floor as "3% lines / 3% functions"; the floor is now 32 / 24. Surfaced rather than
  rewritten, per the workflow's rule about documentation drift.
- **D3 — `docs/PROGRESS.md` phase status is stale.** Its header still reads
  "Current Phase: Phase 9 - Visitor Engagement Complete (v1.4)" although nine tracks have
  since landed. The changelog line added by this track is accurate; the header is not.
- **D4 — the desktop row has no `aria-current` and its own active indicator is
  unchanged**, by the spec's out-of-scope rule. A worthwhile follow-up, not this track's.

## Debt

| Finding | Reason | Issue |
| --- | --- | --- |
| D1 | Out of scope (pre-existing, unrelated subsystem) | proposed, not yet filed |
| D2 | Surfaced drift; belongs to a docs-reconciliation change | proposed, not yet filed |
| D3 | Same as D2 | proposed, not yet filed |
| D4 | Explicitly out of scope in `spec.md` | proposed, not yet filed |

## Doc sync

`pending` — the pre-review sync updated `conductor/workflow.md` (coverage floor) and
`docs/PROGRESS.md` (changelog); the post-review sync is recorded after Phase R1.

## History

| Round | Verdict | Critical | High | Medium | Low | Fixed |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | PASS WITH FINDINGS | 0 | 0 | 2 | 0 | 0 |
