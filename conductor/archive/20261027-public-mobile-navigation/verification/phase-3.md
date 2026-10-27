# Phase 3 — Active destination, exposure, and motion preference

| Field | Value |
| --- | --- |
| Track | `20261027-public-mobile-navigation` — Public Mobile Navigation |
| Phase | 3 — Active destination, exposure, and motion preference |
| Date | 2026-10-27 |
| Branch | `fix/20261027-public-mobile-navigation` |
| Base commit | `661e869` |
| Head commit | `7aa5dee` |
| Result | **verified** |

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| static | `pnpm type-check` | 0 | Clean |
| static | `pnpm lint` | 0 | 0 errors, 21 warnings — baseline unchanged |
| static | `pnpm format:check` | 0 | Clean |
| unit | `pnpm test` | 0 | `Test Files 52 passed (52)`, `Tests 189 passed (189)` — 6 new cases in `mobile-nav.test.tsx` (was 183) |
| build | `pnpm build` | 0 | Production build compiles in ~50 s |

## Emitted-CSS verification (the part jsdom cannot answer)

`jsdom` has no CSS engine, so the tests assert the declared contract and the built
stylesheet proves the contract is real. Checked in `.output/public/assets/main-*.css`
after `pnpm build`:

| Assertion | Emitted evidence |
| --- | --- |
| The panel's opening motion exists | `@keyframes mobile-nav-open{0%{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}` and `.mobile-nav-panel{animation:mobile-nav-open .15s ease-out}` |
| Reduced motion suppresses it | `@media(prefers-reduced-motion:reduce){.mobile-nav-panel{animation:none}}` |
| The Phase 2 focus ring is real | `outline-color:var(--focus-ring-color)` is present, so the token utility does generate CSS rather than silently emitting nothing |

The Phase 2 open risk is therefore closed: the focus-ring utilities survive the build.

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-7 | The link for the current route carries a non-colour indicator, and no other link carries it. | Three cases pass: "marks the destination for the current route and nothing else" (`aria-current="page"` appears exactly once), "marks it without relying on colour alone" (the `border-l-2` weight/edge indicator), and "gives a destination its whole subtree rather than only its own path" (`/projects/ansyar-world` marks Projects, proving the prefix rule) | satisfied |
| AC-8 | At ≥768 px the trigger is absent from the accessibility tree and exactly one navigation landmark is exposed. | "leaves exactly one navigation landmark exposed while the panel is closed" (the `hidden` panel is out of the a11y tree, so the closed state exposes only the desktop row) and "keeps the desktop row and the mobile control mutually exclusive" (desktop nav carries `hidden md:flex`; trigger and panel both live inside the `md:hidden` wrapper) | satisfied, with the stated jsdom limitation |
| AC-9 | The reduced-motion path renders the panel without a transition, and the default path declares one. | "declares its opening animation on the panel" passes, and the emitted CSS above proves both the animation and its `prefers-reduced-motion` override reach the browser | satisfied |

Functional requirements: FR-7 (one active-route rule shared by both rows, non-colour
indicator), FR-8 and FR-9 (exposure and landmark count), FR-10 (motion, `should`).

## Evidence paths

- `conductor/tracks/20261027-public-mobile-navigation/verification/phase-3.md` (this report)
- `.conductor/evidence/20261027-public-mobile-navigation/phase-3-green.log` — full suite
- Emitted stylesheet inspected at `.output/public/assets/main-*.css` (build output, gitignored)

## Deviations

1. **`src/components/layout/MobileNav.css` is a new file outside `Touches`.** The panel's
   animation could not be expressed as a utility: the built stylesheet contains no
   animation declaration for `animate-fade-in` (only the reduced-motion override in
   `variables.css` mentions it), so that utility is inert and reusing it would have
   produced a panel that never animates. A co-located stylesheet is the project's own
   convention for what utilities cannot express (`button.css`, `input.css`, `Footer.css`,
   `BulkActionBar.css`), and the keyframe is guarded under reduced motion explicitly
   rather than relying only on the global catch-all in `globals.css`.
2. **`mobile-nav.test.tsx` now declares its own router mock.** The shared
   `vitest.setup.tsx` renders `Link` as `({ children, to }) => <a href={to}>`, dropping
   `aria-current` and `className`, so the active-destination assertions could not see the
   props under test. The file-level mock forwards them, following the existing
   `src/routes/__tests__/blog-index-prefetch.test.tsx` pattern. No assertion was
   weakened, and no shared test infrastructure was changed.

## Notes

- **A pre-existing defect found on the way, out of this track's scope.**
  `src/routes/index.tsx` uses the `animate-fade-in` class, but the built stylesheet
  contains no `.animate-fade-in` animation rule — there is no `--animate-fade-in` theme
  entry — so the home page's intended fade-in never runs, and the reduced-motion override
  in `variables.css` guards a class that does nothing. It is unrelated to the mobile
  navigation and was left alone rather than folded into this track's blast radius.
- **The desktop row is deliberately untouched**, including its active styling. Expanding
  the shared rule to the desktop row's own indicator and adding `aria-current` there would
  be a real accessibility improvement, but the spec puts the desktop row out of scope, and
  the phase plan repeats it. Recorded as a follow-up rather than smuggled in.
- **`FR-10` is a `should`.** It is implemented and verified; had the keyframe proven
  unworkable in the built CSS, the fallback would have been to keep the transition
  declaration only and record the gap, not to claim the animation existed.
- **Execution mode**, unchanged: the primary agent implemented and then re-ran the
  verification commands against the accepted checkpoint, because this host exposes no
  phase subagent.

## Primary verification

Re-ran the phase gate on the accepted checkpoint `7aa5dee`:

| Command | Exit | Result |
| --- | --- | --- |
| `pnpm type-check` | 0 | Clean |
| `pnpm lint` | 0 | 0 errors, 21 warnings (baseline) |
| `pnpm format:check` | 0 | Clean |
| `pnpm test` | 0 | 52 files, 189 tests passed |
| `pnpm build` | 0 | Emits the keyframe, the panel animation rule, its reduced-motion override, and the focus-ring token |
