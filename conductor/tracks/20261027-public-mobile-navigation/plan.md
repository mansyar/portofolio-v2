# Public Mobile Navigation — Implementation Plan

> **Branch:** `fix/20261027-public-mobile-navigation`
> **Base:** `main` @ `196693e67fa4c0c378139b55f732c800bae5965a`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.
>
> **Ordering note:** Phase 1 is deliberately red. It writes the mobile-navigation
> tests before the control exists, records the failures as proof the defect is real,
> and is verified on the strength of that failure set. Phase 2 makes it green. No
> phase is `verified` by a command that did not run.

## Phase 1: Failing regression tests for the mobile navigation contract

- **Goal:** Tests exist that describe the trigger, the seven destinations, dismissal and
  focus, and every one of them fails against today's `Header.tsx` for the reason the spec
  predicts — there is no control, not a setup error.
- **Depends on:** none
- **Covers:** FR-1 through FR-6, AC-1 through AC-6, NFR-5
- **Touches:** `src/components/layout/__tests__/mobile-nav.test.tsx`
- **Verification:** `pnpm test src/components/layout/__tests__/mobile-nav.test.tsx` — expected to FAIL at this stage; the failure set is the evidence.
- **Status:** verified

- [x] **P1.T1: Trigger contract tests** — covers: FR-1, FR-2, AC-1, AC-2
  - [x] **P1.T1.1: A trigger exists in the mobile cluster and its accessible name states the open action**
  - [x] **P1.T1.2: Activating it flips `aria-expanded` false → true → false and `aria-controls` resolves to the exposed panel**
- [x] **P1.T2: Panel content tests** — covers: FR-3, AC-3
  - [x] **P1.T2.1: The exposed panel lists the seven destinations in PRD §5 order, each as an in-app link**
  - [x] **P1.T2.2: Nothing extra appears — the panel is exactly those seven links, not the admin or theme controls**
- [x] **P1.T3: Dismissal and focus tests** — covers: FR-4, FR-5, FR-6, AC-4, AC-5, AC-6
  - [x] **P1.T3.1: Escape closes the panel and leaves focus on the trigger**
  - [x] **P1.T3.2: A pointer interaction outside closes it; one inside does not**
  - [x] **P1.T3.3: Navigating to a listed destination closes it**
- [x] **P1.T4: Record the red run** — covers: NFR-5
  - [x] **P1.T4.1: Run the targeted file and capture which cases fail and why** — a missing control, not an unresolved module or a bad import
  - [x] **P1.T4.2: Confirm no existing test was modified or deleted to make room; the header, a11y and route-surface suites still pass unchanged**

**Result:** verified (red by contract — the failing tests are the deliverable)
**Checkpoint:** `7068af5`
**Evidence:** conductor/tracks/20261027-public-mobile-navigation/verification/phase-1.md

## Phase 2: Trigger, panel, and the dismissal contract

- **Goal:** The disclosure exists and works: the trigger opens a panel of the seven
  destinations, Escape, outside pointer interaction and navigation each close it, focus
  stays on the trigger, and the panel is closed in the server-rendered markup.
- **Depends on:** Phase 1
- **Covers:** FR-1 through FR-6, AC-1 through AC-6, NFR-3
- **Touches:** `src/components/layout/MobileNav.tsx`, `src/components/Header.tsx`
- **Verification:** `pnpm type-check && pnpm lint && pnpm format:check && pnpm test`
- **Status:** in_progress

- [ ] **P2.T1: One destination list** — covers: FR-3
  - [ ] **P2.T1.1: The seven destinations gain a single definition, consumed by both the desktop row and the mobile panel** — no second hardcoded array, so order can never drift
- [ ] **P2.T2: The trigger** — covers: FR-1, FR-2, AC-1, AC-2
  - [ ] **P2.T2.1: An icon-only button with `aria-expanded`, `aria-controls`, a state-dependent accessible name, and a ≥44×44 px target**
  - [ ] **P2.T2.2: Mounted in the header's mobile cluster beside the logo and theme toggle; the desktop row at ≥768 px is left byte-for-byte in behaviour**
- [ ] **P2.T3: The panel** — covers: FR-3, AC-3
  - [ ] **P2.T3.1: A dropdown under the sticky header using existing tokens, no fixed widths, and closed in the SSR markup (NFR-3)**
  - [ ] **P2.T3.2: Links navigate through the router, so a tap is an SPA transition with a real URL — no full reload**
- [ ] **P2.T4: Dismissal and focus** — covers: FR-4, FR-5, FR-6, AC-4, AC-5, AC-6
  - [ ] **P2.T4.1: Escape closes and focus is left on the trigger; no focus trap is introduced**
  - [ ] **P2.T4.2: Outside pointer interaction closes; inside does not**
  - [ ] **P2.T4.3: A route change closes the panel, including navigating to the current route, without a duplicate history entry**
- [ ] **P2.T5: Green the Phase 1 suite** — covers: AC-1 through AC-6
  - [ ] **P2.T5.1: Run the Phase 1 file and account for every recorded failure**
  - [ ] **P2.T5.2: Confirm the first render is closed with no hydration-mismatch warning in the test output**

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261027-public-mobile-navigation/verification/phase-2.md
-->

## Phase 3: Active destination, exposure, and motion preference

- **Goal:** The current destination is indicated without relying on colour, at ≥768 px
  neither the trigger nor the panel is exposed with exactly one navigation landmark
  announced, and the transition is suppressed under reduced motion.
- **Depends on:** Phase 2
- **Covers:** FR-7 through FR-10, AC-7, AC-8, AC-9
- **Touches:** `src/components/layout/MobileNav.tsx`, `src/components/Header.tsx`, `src/components/layout/__tests__/mobile-nav.test.tsx`
- **Verification:** `pnpm type-check && pnpm lint && pnpm format:check && pnpm test`
- **Status:** pending

- [ ] **P3.T1: One active-route rule** — covers: FR-7, AC-7
  - [ ] **P3.T1.1: Derive the desktop rule once — exact match for `/`, prefix match otherwise — and let both rows consume it**
  - [ ] **P3.T1.2: Add a non-colour indicator (weight, border or marker) for the active destination**
  - [ ] **P3.T1.3: Cover both an active and an inactive route, and assert no second link claims the active state**
- [ ] **P3.T2: Exposure rules** — covers: FR-8, FR-9, AC-8
  - [ ] **P3.T2.1: At ≥768 px the trigger and panel are removed from the user and assistive-technology surface**
  - [ ] **P3.T2.2: Exactly one navigation landmark is exposed at any width, including before hydration**
- [ ] **P3.T3: Motion preference** — covers: FR-10, AC-9
  - [ ] **P3.T3.1: Declare the open/close transition and suppress it under `prefers-reduced-motion: reduce`**
  - [ ] **P3.T3.2: Cover both paths — with and without the motion preference**

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261027-public-mobile-navigation/verification/phase-3.md
-->

## Phase 4: Accessibility pass, ratchet, and the build gate

- **Goal:** Targets and focus visibility hold in both themes, the a11y suite is green, the
  coverage floor is not lowered, and the production build compiles.
- **Depends on:** Phase 3
- **Covers:** FR-11, AC-10, AC-11, NFR-1, NFR-2, NFR-4, NFR-6
- **Touches:** `src/components/layout/__tests__/mobile-nav.a11y.test.tsx`, `src/components/layout/MobileNav.tsx`, `vite.config.ts`
- **Verification:** `pnpm type-check && pnpm lint && pnpm format:check && pnpm test:coverage && pnpm build`
- **Status:** pending

- [ ] **P4.T1: Accessibility test file** — covers: FR-11, AC-10
  - [ ] **P4.T1.1: Assert role, accessible name, state and ≥44×44 px target for every control the track adds**
  - [ ] **P4.T1.2: Assert a `focus-visible` style exists on the trigger in both themes**
- [ ] **P4.T2: Guards** — covers: NFR-1, NFR-2, NFR-4
  - [ ] **P4.T2.1: No new Biome diagnostics; the seven a11y rules stay at `error`**
  - [ ] **P4.T2.2: No admin module, layout or import reaches the public header**
  - [ ] **P4.T2.3: No new runtime dependency; Tailwind over existing tokens first, a co-located `.css` file only where a utility cannot express the rule**
- [ ] **P4.T3: Ratchet and build** — covers: NFR-6, AC-11
  - [ ] **P4.T3.1: Raise the `vite.config.ts` thresholds to the measured baseline if this track lifted coverage; never lower the floor**
  - [ ] **P4.T3.2: The production build compiles and the header renders in the built output**

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261027-public-mobile-navigation/verification/phase-4.md
-->

<!--
Review fixes are appended by `conductor-review` as:

## Phase R1: Review Fixes

- **Goal:** Resolve review findings ...
- **Depends on:** Phase 4
- **Covers:** review findings
- **Touches:** ...
- **Verification:** ...
- **Status:** pending

- [ ] **R1.T1: Resolve <finding ID>** — covers: <finding ID>
-->
