# Phase 1 — Failing regression tests for the mobile navigation contract

| Field | Value |
| --- | --- |
| Track | `20261027-public-mobile-navigation` — Public Mobile Navigation |
| Phase | 1 — Failing regression tests for the mobile navigation contract |
| Date | 2026-10-27 |
| Branch | `fix/20261027-public-mobile-navigation` |
| Base commit | `35e7a75` |
| Head commit | `7068af5` |
| Result | **verified (red by contract)** |

The deliverable of this phase is a failure, so "verified" here means every recorded
failure is the one the spec predicts — a missing control — and not a setup, import or
configuration error. The commands below did not exit 0, and that is the expected outcome
recorded in the phase contract.

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| static | `pnpm type-check` | 0 | `tsc --noEmit` clean with the new test file in the tree — the red run fails on assertions, not on types |
| static | `pnpm exec biome check src/components/layout/__tests__/mobile-nav.test.tsx` | 0 | No diagnostics; no `any`, no non-null assertion, no new lint debt |
| unit | `pnpm test src/components/layout/__tests__/mobile-nav.test.tsx` | 1 (expected) | 1 file failed, 8 of 8 cases failed. Every case reports `TestingLibraryElementError: Unable to find an accessible element with the role "button" and name "Open navigation menu"` |
| unit | `pnpm test` | 1 (expected) | `Test Files 1 failed \| 51 passed (52)`, `Tests 8 failed \| 175 passed (183)`. The only failing file is the new one; all 51 pre-existing files and all 175 pre-existing tests still pass |

Failure-cause check on the red log: 8 `TestingLibraryElementError` occurrences, and zero
matches for `Cannot find module`, `Failed to resolve`, `SyntaxError`, or `ReferenceError`
— i.e. no import-resolution failure, which task P1.T4.1 requires.

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-1 | A rendered header at mobile width contains a trigger whose accessible name states the open action, and the desktop row links remain in the document. | `mobile-nav.test.tsx` → "offers a control for opening the navigation without disturbing the desktop row"; fails on the missing control, and asserts the seven desktop hrefs are still present | covered — red by contract |
| AC-2 | Activating the trigger flips `aria-expanded` false → true → false, and `aria-controls` resolves to the panel element that becomes exposed. | `mobile-nav.test.tsx` → "reports its state and points at the panel it controls", whose `panelOf` helper fails if `aria-controls` is missing or does not resolve | covered — red by contract |
| AC-3 | The exposed panel lists all seven destinations in the documented order, each rendered as an in-app link. | `mobile-nav.test.tsx` → "lists exactly the seven destinations, in order, as in-app links" asserts names and hrefs in PRD §5 order; "exposes nothing through the panel until it is opened" pins the closed state | covered — red by contract |
| AC-4 | Pressing Escape with the panel open closes it and leaves focus on the trigger. | `mobile-nav.test.tsx` → "closes on Escape and leaves focus on the trigger" (`isClosed` plus `toHaveFocus`) | covered — red by contract |
| AC-5 | A pointer interaction outside the panel closes it; an interaction inside it does not. | `mobile-nav.test.tsx` → "closes on an interaction outside the panel" and "stays open on an interaction inside the panel" | covered — red by contract |
| AC-6 | Navigating to a listed destination closes the panel. | `mobile-nav.test.tsx` → "closes when the route changes" re-renders with a new mocked `pathname` and asserts closure | covered — red by contract |

Functional requirements described by these tests: FR-1, FR-2, FR-3, FR-4, FR-5, FR-6.
NFR-5 (deterministic tests) holds by construction: the file uses no timers, no animation
waits, and no fake timers.

## Evidence paths

- `conductor/tracks/20261027-public-mobile-navigation/verification/phase-1.md` (this report)
- `.conductor/evidence/20261027-public-mobile-navigation/phase-1-red.log` — targeted red run
- `.conductor/evidence/20261027-public-mobile-navigation/phase-1-red-primary.log` — primary re-run on the checkpoint
- `.conductor/evidence/20261027-public-mobile-navigation/phase-1-whole-suite.log` — whole-suite run proving no pre-existing test broke

## Deviations

None. Only `src/components/layout/__tests__/mobile-nav.test.tsx` was added, which is
inside `Touches`.

## Notes

- **Execution mode.** No phase subagent exists on this host — the available agent set
  exposes only `researcher-web` — so the primary agent executed the phase under the brief
  in `.conductor/runs/20261027-public-mobile-navigation/phase-1-brief.md` and then re-ran
  the verification command against the squashed checkpoint. The skill permits primary
  execution when no subagent is available; the usual separation of implementer and
  verifier is reduced to a re-run on the final commit, and that limitation is recorded
  here rather than hidden.
- **The tests import `Header`.** Deliberately, per P1.T4.1: importing a `MobileNav`
  module that does not exist yet would fail the phase on module resolution instead of on
  the missing behaviour.
- **Why the panel is resolved through `aria-controls`.** The desktop row is always in the
  document, hidden only by a responsive class, so an assertion such as "a link named
  Projects exists" passes today with no mobile panel at all. Reading links from the
  element the trigger controls is the only assertion that can distinguish the two.
- **What "exposed" accepts.** The closed-state assertion passes whether the panel is not
  rendered or is rendered `hidden`, because accessible-role queries ignore hidden
  elements. That keeps FR-2's `aria-controls` contract testable without dictating the
  exposure mechanism, which FR-8 and FR-9 settle in Phase 3.
- **Route-change closure is location-driven.** The shared setup replaces `useLocation`
  with a stub and renders `Link` without forwarding `onClick`, so the test expresses
  closure as a response to a changed location. An implementation that only closed the
  panel from a click handler on the link would not satisfy AC-6.

## Primary verification

Re-ran the phase verification command against the accepted checkpoint, after the task
commit was squashed:

| Command | Exit | Result |
| --- | --- | --- |
| `pnpm test src/components/layout/__tests__/mobile-nav.test.tsx` | 1 | 8 failed (8), 1 file failed — all eight failures are the predicted missing-control assertion; no import or setup error |
| `pnpm test` | 1 | `1 failed \| 51 passed (52)` files, `8 failed \| 175 passed (183)` tests — the phase adds failures and breaks nothing existing |

The expected-red outcome is confirmed, the failure set is the predicted one, and no
pre-existing test was modified or deleted to make room for the new file.
