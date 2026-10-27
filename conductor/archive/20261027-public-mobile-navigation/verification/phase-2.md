# Phase 2 — Trigger, panel, and the dismissal contract

| Field | Value |
| --- | --- |
| Track | `20261027-public-mobile-navigation` — Public Mobile Navigation |
| Phase | 2 — Trigger, panel, and the dismissal contract |
| Date | 2026-10-27 |
| Branch | `fix/20261027-public-mobile-navigation` |
| Base commit | `875a0a7` |
| Head commit | `f372340` |
| Result | **verified** |

Phase 1's eight failing cases now pass, and the whole configured gate is green on the
accepted checkpoint.

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| static | `pnpm type-check` | 0 | `tsc --noEmit` clean |
| static | `pnpm lint` | 0 | `biome check .` — 0 errors, 21 warnings, identical to the pre-phase baseline |
| static | `pnpm format:check` | 0 | No formatting drift |
| unit | `pnpm test` | 0 | `Test Files 52 passed (52)`, `Tests 183 passed (183)` — including `mobile-nav.test.tsx (8 tests)` which failed 8/8 at the end of Phase 1 |

No React warnings appear in the run: no `act(...)` warning, no hydration mismatch
warning.

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-1 | A trigger with the open action as its accessible name exists, and the desktop row links remain in the document. | `mobile-nav.test.tsx` → "offers a control for opening the navigation without disturbing the desktop row": passes | satisfied |
| AC-2 | `aria-expanded` flips false → true → false and `aria-controls` resolves to the panel that becomes exposed. | `mobile-nav.test.tsx` → "reports its state and points at the panel it controls": passes; `aria-controls={panelId}` with `panelId` from `useId()`, resolved by `document.getElementById` in the test | satisfied |
| AC-3 | The exposed panel lists the seven destinations in order as in-app links, and exposes nothing while closed. | "lists exactly the seven destinations, in order, as in-app links" and "exposes nothing through the panel until it is opened": both pass; the closed state holds because the `<nav>` carries `hidden` while closed | satisfied |
| AC-4 | Escape closes the panel and leaves focus on the trigger. | "closes on Escape and leaves focus on the trigger": passes; a document `keydown` listener closes and calls `triggerRef.current?.focus()` | satisfied |
| AC-5 | An outside pointer interaction closes; an inside one does not. | "closes on an interaction outside the panel" and "stays open on an interaction inside the panel": both pass; the document `mousedown` listener ignores targets contained by the panel or the trigger | satisfied |
| AC-6 | Navigating to a listed destination closes the panel. | "closes when the route changes": passes; closure is keyed on `pathname`, so it happens for any navigation, not only a click on a link | satisfied |

Functional requirements implemented: FR-1, FR-2, FR-3, FR-4, FR-5, FR-6. NFR-3 holds by
construction: the panel is absolutely positioned under the sticky header and rendered
`hidden` on the server, so the first paint is closed and opening shifts no layout.

Phase 2 tasks: P2.T1 (one destination list), P2.T2 (trigger), P2.T3 (panel), P2.T4
(dismissal and focus), P2.T5 (green the Phase 1 suite and confirm the closed first
render).

## Evidence paths

- `conductor/tracks/20261027-public-mobile-navigation/verification/phase-2.md` (this report)
- `.conductor/evidence/20261027-public-mobile-navigation/phase-2-green.log` — full suite during implementation
- `.conductor/evidence/20261027-public-mobile-navigation/phase-2-verify.log` — full suite re-run on the accepted checkpoint

## Deviations

None. Both changed files, `src/components/Header.tsx` and
`src/components/layout/MobileNav.tsx`, are inside `Touches`.

## Notes

- **A lint error was fixed rather than suppressed.** The first implementation closed the
  panel from an effect with `[pathname]` in its dependency list, and Biome's
  `useExhaustiveDependencies` rejected it as an unnecessary dependency (the effect body
  never read `pathname`). The fix is React's documented "adjust state during render"
  pattern instead of an effect, which satisfies the same behaviour, removes a render pass
  in which the panel would still be open, and needs no `biome-ignore` suppression. No
  lint rule was weakened or disabled to get here.
- **A raw `<button>`, not the `Button` primitive.** `src/components/ui/button.css` is
  unlayered plain CSS, so its `.btn-sm` rules beat Tailwind sizing utilities in the
  cascade: `className="h-11 w-11 p-0"` on the primitive would not have produced an exact
  44×44 px target. The raw button follows the existing `AdminHeader` icon-only nav-toggle
  precedent and takes the focus ring from the `--focus-ring-color` and
  `--focus-ring-offset` tokens, matching `.btn:focus-visible` and `.input:focus-visible`
  without duplicating those rules into a new stylesheet.
- **The panel stays in the document while closed**, carrying `hidden`, so `aria-controls`
  always resolves to a real element. Accessibility-role queries ignore hidden elements,
  which is what makes "exposes nothing while closed" testable without dictating whether
  the panel is mounted or unmounted.
- **Route-change closure is keyed on the pathname**, not on a click handler passed to
  `Link`. The shared test setup renders `Link` as a plain anchor and drops `onClick`, so a
  click-handler implementation would have been invisible to the test — and, more
  importantly, would not have closed the panel for keyboard, middle-click or programmatic
  navigation.
- **What this phase does not yet do.** The active-destination indicator (FR-7), the
  ≥768 px exposure rules (FR-8, FR-9) and the reduced-motion path (FR-10) are Phase 3; the
  44×44 px and focus-visible assertions (FR-11) and the coverage ratchet (NFR-6) are
  Phase 4. Their absence here is the plan, not a gap in this phase's evidence.
- **Execution mode**, unchanged from Phase 1: no phase subagent exists on this host, so
  the primary agent implemented the phase and then re-ran the verification commands
  against the squashed checkpoint.

## Primary verification

Re-ran the full phase verification command on the accepted checkpoint `f372340`:

| Command | Exit | Result |
| --- | --- | --- |
| `pnpm type-check` | 0 | Clean |
| `pnpm lint` | 0 | 0 errors, 21 warnings (baseline unchanged) |
| `pnpm format:check` | 0 | Clean |
| `pnpm test` | 0 | 52 files passed, 183 tests passed — Phase 1's failure set is green and nothing else regressed |
