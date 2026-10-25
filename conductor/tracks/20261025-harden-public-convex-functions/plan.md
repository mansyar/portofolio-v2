# Harden Public Convex Functions - Implementation Plan

> **Branch:** `fix/20261025-harden-public-convex-functions`
> **Base:** `main` @ `6d475db55790679499b9af9cdbb72b881785b499`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.
>
> **Test dependency note:** `convex-test@0.0.41` is the newest version whose peer
> range (`convex: ^1.16.4`) covers the pinned `convex@1.31.2`. `0.0.43` requires
> `^1.32.0` and `0.0.45`+ requires `^1.43.0`, so the pin is the constraint. Do
> not upgrade `convex` to satisfy `convex-test`.

## Phase 1: Test infrastructure and the failing regression tests

- **Goal:** `convex-test` runs real Convex handlers under Vitest, and four
  regression tests exist that currently fail because the guards are missing.
- **Depends on:** none
- **Covers:** FR-6, AC-6
- **Touches:** `package.json`, `pnpm-lock.yaml`, `convex/__tests__/**`
- **Verification:** `pnpm test` (expected to FAIL on the new guard tests at this
  stage — record the failures as the proof the bug is real)
- **Status:** verified

- [x] **P1.T1: Install convex-test at a version compatible with convex 1.31.2** - covers: FR-6
  - [x] **P1.T1.1: Add `convex-test@0.0.41` and `@edge-runtime/vm` as devDependencies**
  - [x] **P1.T1.2: Confirm `pnpm install` exits 0 with no peer-dependency error, and record the resolved versions**
- [x] **P1.T2: Make the Convex test environment work alongside jsdom** - covers: FR-6
  - [x] **P1.T2.1: Determine whether `convex-test` needs the `edge-runtime` environment and configure it per-file or via a Vitest project, without changing the global `jsdom` setting for component tests**
  - [x] **P1.T2.2: Confirm the existing 12 test files still pass in their current environment**
- [x] **P1.T3: Write the failing regression tests** - covers: FR-1, FR-2, FR-3, FR-4
  - [x] **P1.T3.1: `analytics.getStats` called with no identity throws**
  - [x] **P1.T3.2: `newsletter.listSubscribers` is not reachable — asserted on the module export and the deployment path, not on `api`, which is a proxy that resolves every property**
  - [x] **P1.T3.3: `newsletter.sendWelcomeEmail` cannot be invoked as a public action**
  - [x] **P1.T3.4: `newsletter.subscribe` rejects the 6th call in an hour from one IP**
  - [x] **P1.T3.5: Run `pnpm test` and record which of these fail — every one of them must fail before Phase 2 begins**

**Result:** verified
**Checkpoint:** 7ba1f96
**Evidence:** conductor/tracks/20261025-harden-public-convex-functions/verification/phase-1.md
**Deviation:** `vitest.setup.tsx` was listed in Touches but deliberately left unchanged — the predicted crash under `edge-runtime` does not occur, because Vitest's edge environment exposes `window` as an alias of `globalThis` and only `document` is undefined, so the `matchMedia` stub runs harmlessly. The per-file `// @vitest-environment edge-runtime` directive was sufficient. The subagent's scratch probe could not be deleted under its permission set, so the primary kept it as a legitimate harness test and renamed it `__probe.test.ts` → `convexTest.harness.test.ts`.

## Phase 2: Close the authorization gaps

- **Goal:** The three unguarded functions are no longer anonymously callable,
  and the Phase 1 guard tests pass.
- **Depends on:** Phase 1
- **Covers:** FR-1, FR-2, FR-3, AC-1, AC-2, AC-3
- **Touches:** `convex/analytics.ts`, `convex/newsletter.ts`,
  `convex/_generated/**`
- **Verification:** `pnpm type-check && pnpm lint && pnpm format:check && pnpm test`
- **Status:** verified

- [x] **P2.T1: Guard `analytics.getStats` with `requireAdmin`** - covers: FR-1
  - [x] **P2.T1.1: Call `await requireAdmin(ctx)` as the first statement in the handler, before the Umami env-var check, so an anonymous caller cannot distinguish configured from unconfigured** - placed above the `try`/`catch` that returns `null`, which would otherwise swallow the rejection
  - [x] **P2.T1.2: Confirm the admin dashboard path still works - the action signature and return type are unchanged**
- [x] **P2.T2: Delete `newsletter.listSubscribers`** - covers: FR-2
  - [x] **P2.T2.1: Remove the query and regenerate the Convex API types** - `npx convex dev --once` ran clean (11.13s) with no diff; `api.d.ts` derives the surface via `FilterApi` over module types rather than enumerating function names
  - [x] **P2.T2.2: Confirm no reference remains in `src/`, and record that the subscriber admin screen is a future track**
- [x] **P2.T3: Make `sendWelcomeEmail` internal** - covers: FR-3
  - [x] **P2.T3.1: Change `action` to `internalAction`**
  - [x] **P2.T3.2: Update the `subscribe` scheduler call to `internal.newsletter.sendWelcomeEmail`**
- [x] **P2.T4: Verify the guard tests now pass** - covers: AC-1, AC-2, AC-3
  - [x] **P2.T4.1: Run `pnpm test` and confirm the Phase 1 failures are now green** - failures dropped from 6 to 2; the remaining two are the Phase 3 rate-limit pair and fail at the Convex validator on the missing `clientIp` argument

**Result:** verified
**Checkpoint:** 2eda002
**Evidence:** conductor/tracks/20261025-harden-public-convex-functions/verification/phase-2.md

**Deviation:** none. `convex/_generated/**` was listed in Touches but needed no edit — regeneration was a genuine no-op, so nothing generated was hand-written. The phase gate is partially green by design: `pnpm test` exits 1 with exactly the two rate-limit failures that Phase 3 resolves. `subscribe` was deliberately left without a rate limit so the two phases stay independently verifiable.

## Phase 3: Rate-limit newsletter subscribe

- **Goal:** `newsletter.subscribe` rejects the 6th attempt per hour per IP, keyed
  on a server-resolved address, and the Phase 1 rate-limit test passes.
- **Depends on:** Phase 2
- **Covers:** FR-4, FR-5, AC-4, AC-5
- **Touches:** `convex/newsletter.ts`, `src/components/features/NewsletterForm.tsx`,
  `src/components/features/NewsletterForm.css`, `convex/__tests__/**`
- **Verification:** `pnpm type-check && pnpm lint && pnpm format:check && pnpm test`
- **Status:** in_progress

- [ ] **P3.T1: Add the rate-limit check to `subscribe`** - covers: FR-4
  - [ ] **P3.T1.1: Accept `clientIp` as a required argument, mirroring `contact.submit`**
  - [ ] **P3.T1.2: Query `rateLimits` via `by_identifier_action` with `action: "newsletter_subscribe"` and reject at 5 attempts in the last hour**
  - [ ] **P3.T1.3: Throw before any insert or scheduled email, so a blocked attempt has no side effects**
  - [ ] **P3.T1.4: Record each allowed attempt in `rateLimits`**
- [ ] **P3.T2: Resolve the caller's IP server-side in the form** - covers: FR-5
  - [ ] **P3.T2.1: Add a `createServerFn` that resolves the request IP, following `src/routes/contact.tsx`**
  - [ ] **P3.T2.2: Pass the resolved IP to `subscribe` as `clientIp`**
  - [ ] **P3.T2.3: Degrade gracefully when the IP cannot be resolved — signup must still work rather than break**
- [ ] **P3.T3: Confirm the rate-limit test passes and the form still subscribes** - covers: AC-4, AC-5
  - [ ] **P3.T3.1: Run `pnpm test` and confirm the 6th-attempt test is green and `rateLimits` contains 5 rows for the IP**

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261025-harden-public-convex-functions/verification/phase-3.md
-->

## Phase 4: Replace the placeholder tests and audit the surface

- **Goal:** No placeholder assertions remain under `convex/__tests__/`, every
  Convex function is classified by access model, and the full gate is green.
- **Depends on:** Phase 3
- **Covers:** FR-7, NFR-2, NFR-3, AC-6, AC-7, AC-9
- **Touches:** `convex/__tests__/**`,
  `conductor/tracks/20261025-harden-public-convex-functions/verification/**`
- **Verification:** `pnpm type-check && pnpm lint && pnpm format:check && pnpm test && pnpm build`
- **Status:** pending

- [ ] **P4.T1: Replace the remaining placeholder tests** - covers: NFR-2, AC-6
  - [ ] **P4.T1.1: Give `contact.test.ts` and `uses.test.ts` real assertions — these are the only two files that assert `expect(true).toBe(true)`; `helpers.test.ts` and `discovery.test.ts` already contain real logic tests and are out of scope**
  - [ ] **P4.T1.2: Confirm no file under `convex/__tests__/` contains `expect(true).toBe(true)`**
- [ ] **P4.T2: Classify every Convex function by access model** - covers: FR-7, AC-7
  - [ ] **P4.T2.1: Produce a table of every exported function in `convex/` marked public-by-design, admin-guarded, or internal**
  - [ ] **P4.T2.2: Note the audit method so the check can be repeated when functions are added**
- [ ] **P4.T3: Full verification** - covers: NFR-3, AC-9
  - [ ] **P4.T3.1: Run the full five-command gate and record every exit code**
  - [ ] **P4.T3.2: Run `pnpm test:coverage` and confirm coverage stays at or above the 3% ratchet**
  - [ ] **P4.T3.3: Confirm the test count is at least 31 and that the number rose because assertions were added, not because files were deleted**

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261025-harden-public-convex-functions/verification/phase-4.md
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

- [ ] **R1.T1: Resolve <finding ID>** - covers: <finding ID>
-->
