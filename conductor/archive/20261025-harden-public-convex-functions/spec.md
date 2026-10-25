# Harden Public Convex Functions - Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

Close the authentication and abuse-control gaps on this project's public Convex
surface. Three functions that should be privileged or internal are currently
callable by anyone with the deployment URL, and one public mutation has no rate
limit at all. The track also installs `convex-test` so a security guard can be
proven by a test that fails without it, rather than by reading the code.

## Problem / Motivation

Convex exposes every function declared with `query`, `mutation`, or `action` at
the deployment URL. Authorization is the function's own responsibility —
`convex/lib/auth.ts` provides `requireAdmin`, but nothing enforces that it is
called. An audit of all 21 backend modules found four gaps:

| Function | Kind | Guard today | Consequence |
| --- | --- | --- | --- |
| `analytics.getStats` | public action | **none** | Any anonymous caller receives visitor analytics. The action authenticates to Umami with server-side `UMAMI_USERNAME`/`UMAMI_PASSWORD`, so it spends the owner's credentials on the caller's behalf. |
| `newsletter.listSubscribers` | public query | **none** | Any anonymous caller receives every newsletter subscriber's email address. No UI references this function. |
| `newsletter.sendWelcomeEmail` | public action | **none** | Any anonymous caller can send the "Welcome to Ansyar's Newsletter!" email to an arbitrary address, repeatedly. A spam relay that spends the Resend quota and the sending domain's reputation. |
| `newsletter.subscribe` | public mutation | n/a (public by design) | No rate limit. `contact.submit` allows 3 per hour per IP; subscribe allows unlimited, so it can be used to enumerate which addresses are subscribed (the return value distinguishes `alreadySubscribed`) and to mail-bomb a victim. |

The newsletter gaps matter most because the data is other people's — a
subscriber list is personal data collected under the privacy commitment in
`product-guidelines.md`. The `sendWelcomeEmail` gap is worse than a read: it
lets a stranger send mail from `newsletter@ansyar-world.top`.

A secondary problem makes the fix hard to prove. `convex-test` is not
installed, and all four files under `convex/__tests__/` are placeholders —
5 of the repository's 31 tests assert `expect(true).toBe(true)`. There is
currently no way to demonstrate that a guard actually rejects an anonymous
caller, so a future edit could silently remove one.

## Goals & Success Metrics

- **Goal:** Every Convex function that is not intentionally public requires an
  authenticated admin, and every intentionally public mutation is rate limited.
- **Metric:** A test exists for each function in scope that invokes it with no
  identity and asserts rejection; the test suite fails if any guard is removed.
- **Goal:** `analytics.getStats` still works for a signed-in admin, so the
  dashboard is not broken by the fix.
- **Metric:** The admin analytics widget loads real numbers after the change.

## Scope

### In Scope

- Guard `analytics.getStats` with `requireAdmin`.
- Delete `newsletter.listSubscribers`.
- Convert `newsletter.sendWelcomeEmail` to `internalAction` and update its one
  caller.
- Add rate limiting to `newsletter.subscribe` at 5 attempts per hour per IP,
  reusing the existing `rateLimits` table and `by_identifier_action` index with
  action `"newsletter_subscribe"`.
- Resolve the caller's IP server-side in the newsletter form via
  `createServerFn`, mirroring `src/routes/contact.tsx`.
- Install `convex-test` and `@edge-runtime/vm` as devDependencies.
- Replace the four placeholder files under `convex/__tests__/` with real
  assertions covering the functions in scope.
- Record the audit method so future functions can be checked the same way.

### Out of Scope

- Building a subscriber admin screen (the reason `listSubscribers` might have
  been kept; it is deleted instead and can return with proper auth when the
  screen is built).
- The unsubscribe flow, which `product-guidelines.md` requires but this track
  does not deliver.
- Fixing IP spoofing on the rate limit. The value is resolved server-side and
  passed to Convex by the client, exactly as `contact.submit` already does, so
  a determined caller can supply a different IP. Closing that needs the Convex
  HTTP layer or a trusted proxy header, which is a separate design change.
- Any change to `blog`, `projects`, `sitemap`, `settings.getPublic`, `resume`,
  `skills`, or `uses` — those public functions are intentional.
- Schema changes. The `rateLimits` table already supports a new `action` value.
- UI work beyond what the guards force.

## Bug Details

- **Reproduction steps:**
  1. Open any browser console on a page served from `ansyar-world.top`.
  2. Run `fetch('<VITE_CONVEX_URL>/api/query', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: 'newsletter:listSubscribers', args: {}, format: 'json' }) })`.
  3. Read the response body.
- **Expected behavior:** The request is rejected with an authorization error,
  because the caller has no admin identity.
- **Actual behavior:** The response contains every row of
  `newsletterSubscribers` — email address, subscription timestamp, and status.
  The same call pattern against `analytics:getStats` returns visitor statistics,
  and against `newsletter:sendWelcomeEmail` sends an email to any address in
  `args.email`.
- **Root-cause hypothesis:** `convex/lib/auth.ts` exposes `requireAdmin` but
  nothing enforces its use. Each function must call it, and the three in
  question do not — `listSubscribers` even carries the comment "Only admin
  should call this - you might add auth check if needed", which was never
  actioned. `newsletter.subscribe` was written without the rate-limit block that
  `contact.submit` has.
- **Regression test:** For each of `analytics.getStats`,
  `newsletter.listSubscribers` (before deletion), and
  `newsletter.sendWelcomeEmail`, a `convex-test` case that invokes the function
  with no identity and asserts it throws. Each must fail before the fix and pass
  after it. `newsletter.subscribe` gets a case that calls it 6 times with the
  same IP and asserts the 6th is rejected.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | `analytics.getStats` throws when called without an authenticated admin identity, and returns stats unchanged when called by one. | must |
| FR-2 | `newsletter.listSubscribers` no longer exists in the deployment's public API. | must |
| FR-3 | `newsletter.sendWelcomeEmail` is an `internalAction`, unreachable from a client, and still runs from `subscribe` via `internal.newsletter.sendWelcomeEmail`. | must |
| FR-4 | `newsletter.subscribe` rejects the 6th attempt within one hour from the same IP, and records each attempt in `rateLimits` with `action: "newsletter_subscribe"`. | must |
| FR-5 | The newsletter form resolves the caller's IP server-side and passes it to `subscribe`, so the rate limit is keyed on a real IP rather than a placeholder. | must |
| FR-6 | `convex-test` and `@edge-runtime/vm` are devDependencies, and `pnpm test` runs Convex tests that exercise real handlers. | must |
| FR-7 | Every function in `convex/` is classified as public-by-design, admin-guarded, or internal, and the classification is written down in the track's evidence. | should |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | No behavior change for legitimate users: the admin dashboard, newsletter signup, and contact form all still work. |
| NFR-2 | The existing 31 tests still pass; placeholder assertions in `convex/__tests__/` are replaced by real ones, not deleted to inflate a count. |
| NFR-3 | Coverage does not fall below the 3% ratchet floor. |
| NFR-4 | `pnpm type-check`, `pnpm lint`, `pnpm format:check`, `pnpm test`, and `pnpm build` all exit 0. |
| NFR-5 | Convex tests run under 4 workers, consistent with the machine constraint (four concurrent projects on 20 cores). |
| NFR-6 | No secrets are introduced into the client bundle; the Umami credentials stay server-side. |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | A `convex-test` case calls `analytics.getStats` with no identity and it throws; a second case with an admin identity returns a non-null result (or `null` when Umami env vars are unset, per existing behavior). | FR-1 |
| AC-2 | `convex/_generated/api.d.ts` no longer exposes `newsletter.listSubscribers`, and `grep` for the symbol returns no hits outside git history. | FR-2 |
| AC-3 | `sendWelcomeEmail` is declared `internalAction`, and `subscribe` schedules it via `internal.newsletter.sendWelcomeEmail`. | FR-3 |
| AC-4 | A `convex-test` case subscribes 5 times with the same IP successfully and the 6th throws "Too many attempts"; `rateLimits` contains 5 rows with `action: "newsletter_subscribe"`. | FR-4 |
| AC-5 | `src/components/features/NewsletterForm.tsx` obtains the IP from a `createServerFn` and passes it as `clientIp`. | FR-5 |
| AC-6 | `pnpm test` runs at least 5 real Convex assertions; no file under `convex/__tests__/` contains `expect(true).toBe(true)`. | FR-6 |
| AC-7 | The evidence file contains a table classifying every exported function in `convex/` by its access model. | FR-7 |
| AC-8 | `pnpm build` exits 0 and the admin dashboard's analytics widget still renders for a signed-in admin. | NFR-1 |
| AC-9 | `pnpm test` reports no fewer than 31 passing tests, and `pnpm test:coverage` stays at or above 3% lines and functions. | NFR-2, NFR-3 |

## Edge Cases

- **`analytics.getStats` with Umami env vars unset.** The action already returns
  `null` when configuration is missing. The guard must run *before* that check,
  so an anonymous caller cannot use the `null` response to probe configuration.
- **Admin identity without an email claim.** `requireAdmin` resolves the email
  from `authAccounts` when the identity lacks one. The `getStats` guard inherits
  that behavior and must not break for such an admin.
- **`subscribe` on the 6th attempt in the same hour.** It must throw before
  inserting a subscriber or scheduling the email, so a blocked attempt has no
  side effects.
- **Re-subscribe of an existing subscriber.** Currently patches `status` back to
  `active` and returns `alreadySubscribed: false`. That path still counts
  against the rate limit, since it triggers an email.
- **IP resolution failure.** If the `createServerFn` cannot determine an IP,
  the form must still submit rather than break signup. The rate limit degrades
  to a shared bucket for unknown IPs.
- **Deleting `listSubscribers` while a stale client bundle references it.** A
  cached browser tab calling the removed path gets Convex's "no such function"
  error, which is the correct outcome and needs no shim.
- **`convex-test` and the jsdom environment.** The global Vitest environment is
  `jsdom`; Convex tests need the edge runtime. Files must opt in per-file or via
  a project, and the existing component tests must not change environment.
- **Placeholder tests replaced by real ones.** `discovery.test.ts` and
  `helpers.test.ts` cover functions not in this track's scope. They must either
  get real assertions or be left clearly marked — deleting them to raise a
  quality signal would be dishonest.

## Dependencies

- **Tracks:** none. The tooling modernization track is merged, so Biome,
  Vitest 5, and TypeScript 7 are in place.
- **External:** `convex-test` and `@edge-runtime/vm` from npm. No credentials
  needed — the tests must not call live Umami or Resend.

## Open Questions & Assumptions

- **Question:** Should the rate limit be keyed on IP at all, given the client
  transports it? Recorded as a known limitation rather than solved here; a
  proper fix needs the Convex HTTP layer or a trusted proxy header.
- **Question:** When a subscriber admin screen is eventually built, does
  `listSubscribers` come back as `requireAdmin`, or is subscriber management
  handled outside the CMS?
- **Assumption:** `analytics.getStats` has exactly one caller, the admin
  dashboard's `AnalyticsWidget`, so requiring admin cannot break a public page.
- **Assumption:** `newsletter.sendWelcomeEmail` has exactly one caller, the
  `subscribe` mutation, verified by grep. Converting it to internal is therefore
  safe.
- **Assumption:** `convex-test` works with the pinned `convex@1.31.2`. It is
  published by the Convex team and tracks the runtime, but the exact compatible
  version must be confirmed at install time; if it requires a newer `convex`, the
  pin holds and the test dependency is held back instead.
- **Assumption:** 5 per hour is enough headroom that no legitimate subscriber
  hits it, since a person subscribes once.

## References

- `conductor/product-guidelines.md` — privacy commitment and the requirement for
  an unsubscribe path.
- `conductor/tech-stack.md` — `convex` pinned to `1.31.2` to match the
  self-hosted backend; the CLI must not move independently.
- `conductor/code_styleguides/project.md` — "every mutation calls
  `await requireAdmin(ctx)` first; skipping it is a security bug".
- `convex/lib/auth.ts` — `requireAdmin`, `optionalAdmin`, `requireAuth`.
- `convex/contact.ts` — the existing rate-limit pattern to mirror.
