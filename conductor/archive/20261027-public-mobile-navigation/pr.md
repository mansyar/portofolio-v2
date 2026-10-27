## Summary

The public header had no navigation at all below 768 px: the destinations were only in the
desktop row, which is hidden on small viewports, so a phone visitor could reach no page
except through content links. This track adds an accessible disclosure menu to the header's
mobile cluster — a labelled trigger over a panel of the seven public destinations, with
state reported through `aria-expanded`/`aria-controls` and dismissal on Escape,
outside-pointer, and navigation.

It also removed the duplication that let the two rows disagree: one destination list and one
active-route rule now feed both, the panel is closed in the server-rendered markup, and the
coverage floor was raised to the new measured baseline rather than left behind.

## Track

- **ID:** `20261027-public-mobile-navigation`
- **Type:** `bug`
- **Spec:** [`conductor/archive/20261027-public-mobile-navigation/spec.md`](conductor/archive/20261027-public-mobile-navigation/spec.md)
- **Plan:** [`conductor/archive/20261027-public-mobile-navigation/plan.md`](conductor/archive/20261027-public-mobile-navigation/plan.md)
- **Review:** [`conductor/archive/20261027-public-mobile-navigation/review.md`](conductor/archive/20261027-public-mobile-navigation/review.md)

## What happened

| Phase | Goal | Result | Checkpoint | Notes |
| --- | --- | --- | --- | --- |
| 1: Failing regression tests for the mobile navigation contract | Write the contract first and prove it red | verified | `7068af5` | Red by contract — the failing tests are the deliverable |
| 2: Trigger, panel, and the dismissal contract | The disclosure exists and works | verified | `f372340` | All eight Phase 1 cases green |
| 3: Active destination, exposure, and motion preference | Non-colour active indicator, exposure pinned, motion guarded | verified | `7aa5dee` | One co-located CSS rule, justified: no utility expresses the keyframe |
| 4: Accessibility pass, ratchet, and the build gate | Targets, focus ring, a11y suite, floor, build | verified | `a84b34f` | Floor 29/21 → 32/24; built server checked over HTTP |
| R1: Review Fixes | Close the panel across the breakpoint; cap its height | verified | `b65e346` | Both Medium findings fixed in the code |

## Requirements

- [x] `FR-1` — Visible, operable trigger below 768 px, no horizontal overflow at 360 px (`src/components/layout/__tests__/mobile-nav.test.tsx`)
- [x] `FR-2` — State via `aria-expanded`/`aria-controls`; accessible name states the current action
- [x] `FR-3` — Panel holds exactly the seven public destinations in PRD §5 order, as in-app links
- [x] `FR-4` — Escape closes the panel and returns focus to the trigger
- [x] `FR-5` — Outside pointer interaction closes; inside interaction does not
- [x] `FR-6` — Navigating to a destination closes the panel
- [x] `FR-7` — Active destination marked, not by colour alone, using one rule shared with the desktop row
- [x] `FR-8` — At ≥768 px the desktop row is the navigation; trigger and panel are not exposed
- [x] `FR-9` — Exactly one navigation landmark at any width, including before hydration
- [x] `FR-10` — Opening animated, suppressed under `prefers-reduced-motion: reduce` (`should`; proven in the emitted CSS)
- [x] `FR-11` — 44×44 px targets and a token focus ring on every added control (`src/components/layout/__tests__/mobile-nav.a11y.test.tsx`)
- [x] `NFR-1` — Seven a11y Biome rules stay at `error`; no new diagnostics (21 warnings, identical to baseline)
- [x] `NFR-2` — No new runtime dependency; `package.json` and `pnpm-lock.yaml` untouched
- [x] `NFR-3` — Panel is closed in the SSR markup (`hidden=""`), verified against the built server
- [x] `NFR-4` — No admin code or import reaches the public header
- [x] `NFR-5` — Tests use no timers or animation waits
- [x] `NFR-6` — Floor raised 29/21 → 32/24, never lowered
- [x] `AC-1` … `AC-11` — every criterion covered by a test or a documented evidence artifact

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| typecheck | `pnpm type-check` | pass | `conductor/archive/20261027-public-mobile-navigation/verification/integrated.md` |
| lint | `pnpm lint` | pass | 0 errors, 21 warnings — pre-track baseline |
| format | `pnpm format:check` | pass | (configured as the same `biome check .` as lint) |
| unit | `pnpm test` | pass | 53 files, 195 tests (175 before the track) |
| coverage | `pnpm test:coverage` | pass | 32.9 % lines / 24.67 % functions, floor 32 / 24 |
| build | `pnpm build` | pass | Production build compiles |
| runtime | built server + `curl /` at phone width in a browser | pass | HTTP 200, trigger present, panel closed, seven destinations on open |

## Media

Panel opening at 390 px against the production build (`b65e346`). The active destination
(`Home`) is marked with an edge indicator and weight, not colour alone.

![Mobile navigation opening](https://github.com/user-attachments/assets/90cf7faa-8de3-4edc-a8f9-379df2dcf26c)

## Review

- **Verdict:** `PASS`
- **Rounds:** 2
- **Fixed:** 2 findings (F1 viewport crossing, F2 short-viewport scroll)
- **Accepted/deferred:** 0 findings; 4 out-of-scope discoveries filed as issues

## Deviations and risks

- **One co-located CSS file was added** (`src/components/layout/MobileNav.css`) although
  Tailwind-first styling is the convention: the panel's opening keyframe is not expressible
  as a utility, and the track's own investigation showed the existing `animate-fade-in`
  utility has no declaration behind it, so the same shortcut was not available here.
- **The desktop row's presentation is untouched.** The spec puts it out of scope; its
  missing `aria-current` is filed as #15 rather than folded into this change.
- **jsdom cannot prove target size, focus-ring appearance, or exposure.** Those assertions
  state the component's contract; the emitted stylesheet and the server-rendered markup are
  the real proof, and both were checked rather than implied.
- **The review was performed by the implementing agent.** This host exposes no read-only
  reviewer subagent, so the implementer/verifier separation the workflow calls for is
  missing. Every check was re-run at review time and each finding was confirmed against the
  diff, but the independence is not there and the review record says so.

## Follow-ups

- #13 — the home page's `animate-fade-in` class is inert (pre-existing, unrelated)
- #14 — Conductor documentation drift: coverage policy in `tech-stack.md`, `PROGRESS.md` header
- #15 — desktop header row lacks the active-destination parity added for mobile

## Rollback

```bash
# Merge commit
git revert --no-edit -m 1 <merge-commit>

# Squash commit
git revert --no-edit <squash-commit>
```

No migration, feature flag, or data change. Reverting restores the previous header with no
navigation below 768 px; nothing else in the app depends on the new component.
