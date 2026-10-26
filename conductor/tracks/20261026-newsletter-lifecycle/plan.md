# Newsletter Lifecycle — Implementation Plan

> **Branch:** `fix/20261026-newsletter-lifecycle`
> **Base:** `main` @ `1e721b43b2e82c2c0f93e43681c7dc332e20e2cf`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.

## Phase 1: Subscriber identity

- **Goal:** One address maps to one subscriber row with a token, and an idempotent migration
  brings existing rows to the same shape.
- **Depends on:** none
- **Covers:** FR-1, FR-2, FR-5
- **Touches:** `convex/schema.ts`, `convex/newsletter.ts`,
  `convex/__tests__/newsletter.subscribe.identity.test.ts`,
  `convex/__tests__/newsletter.normalizeSubscribers.test.ts`
- **Verification:** `pnpm exec vitest run convex/__tests__/newsletter.subscribe.identity.test.ts convex/__tests__/newsletter.normalizeSubscribers.test.ts`
- **Status:** verified

- [x] **P1.T1: Give subscribers a token** — covers: FR-2
  - [x] Add `unsubscribeToken` and `unsubscribedAt` to the schema, with a `by_token` index
  - [x] Generate a token on insert and refresh it in the re-subscribe branch
- [x] **P1.T2: Normalize the address before every comparison** — covers: FR-1
  - [x] Use the normalized address for the dedupe lookup, the insert, and the stored record
  - [x] Keep both rate-limit keys on the normalized address
- [x] **P1.T3: Backfill existing rows** — covers: FR-5
  - [x] Add an idempotent internal mutation that lowercases addresses, collapses duplicates
    onto the earliest `subscribedAt`, and backfills tokens
  - [x] Assert a second run changes nothing

**Result:** verified
**Checkpoint:** 557757d
**Evidence:** conductor/tracks/20261026-newsletter-lifecycle/verification/phase-1.md

**Risk:** the migration rewrites subscriber rows. It is an internal mutation the owner runs
against the live backend, never part of `convex deploy`; the test proves idempotence so a
double run is harmless.

## Phase 2: Unsubscribe path

- **Goal:** A recipient can opt out from the email or from a link, and the outcome is
  reported on a real page.
- **Depends on:** Phase 1
- **Covers:** FR-3, FR-4, NFR-2
- **Touches:** `convex/newsletter.ts`, `src/routes/newsletter/unsubscribe.tsx`,
  `convex/__tests__/newsletter.unsubscribe.test.ts`,
  `convex/__tests__/newsletter.welcomeEmail.test.ts`
- **Verification:** `pnpm exec vitest run convex/__tests__/newsletter.unsubscribe.test.ts convex/__tests__/newsletter.welcomeEmail.test.ts`
- **Status:** verified

- [x] **P2.T1: Add the token-bearing unsubscribe mutation** — covers: FR-3
  - [x] Resolve the subscriber by token; set `status: "unsubscribed"` and `unsubscribedAt`
  - [x] Make a second call a no-op and an unknown token return the same shape without writing
- [x] **P2.T2: Build the mail footer from the token** — covers: FR-4
  - [x] Extract the welcome-mail HTML into a testable builder that takes the token and site URL
  - [x] Include the unsubscribe link; omit it when no token exists rather than emitting a
    broken URL
- [x] **P2.T3: Add the unsubscribe page** — covers: FR-3, NFR-2
  - [x] Read `token` from the query string, call the mutation once, and render success,
    already-unsubscribed, missing-token, and error states
  - [x] Single `h1`, keyboard-operable, result announced via `role="status"`

**Result:** verified
**Checkpoint:** 3296b4e
**Evidence:** conductor/tracks/20261026-newsletter-lifecycle/verification/phase-2.md

**Risk:** the page is public and calls a mutation on mount. It must run the call once per
token, tolerate StrictMode double-invocation, and never render the token itself.

## Phase 3: Admin-only subscriber list

- **Goal:** The owner can see subscribers without reintroducing a public listing.
- **Depends on:** Phase 2
- **Covers:** FR-6, NFR-1, NFR-3, NFR-4, NFR-5
- **Touches:** `convex/newsletter.ts`, `src/routes/admin/newsletter/index.tsx`,
  `convex/__tests__/newsletter.adminList.test.ts`
- **Verification:** `pnpm type-check && pnpm lint && pnpm format:check && pnpm test && pnpm build`
- **Status:** in_progress

- [ ] **P3.T1: Add the guarded listing query** — covers: FR-6
  - [ ] `requireAdmin` first, then return email, status, `subscribedAt`, newest first
  - [ ] Assert an unauthenticated call throws and that `newsletter` still exports no
    `listSubscribers`
- [ ] **P3.T2: Render the admin page** — covers: FR-6, NFR-2
  - [ ] Table with email, status, and subscribed date, including an empty state
  - [ ] Follow the existing admin layout and accessible table conventions

**Risk:** the harden track removed the public listing on purpose. The new query must be a
separate name behind `requireAdmin`, and the existing removal test must remain untouched and
green.
