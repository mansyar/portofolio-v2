# Rate Limit Identity — Implementation Plan

> **Branch:** `fix/20261027-rate-limit-identity`
> **Base:** `main` @ `60012bdf2e99e8c9b09a9ce2e6eb32ebda41ac58`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.
>
> **Ordering note:** Phase 1 is deliberately red. It writes the HTTP-level and
> resolver tests before any endpoint exists, records the failures as proof the
> defect is real, and moves the two mutation-level rate-limit assertions onto the
> HTTP surface rather than deleting them (NFR-4). Phase 2 makes them green.

## Phase 1: Failing regression tests at the HTTP boundary

- **Goal:** Tests exist that describe the new boundary — one identifier from
  headers, internal mutations, CORS, refusal semantics — and every one of them
  fails against today's code for the reason the spec predicts.
- **Depends on:** none
- **Covers:** FR-1 through FR-11, FR-12, AC-1 through AC-10, NFR-4
- **Touches:** `convex/__tests__/**`
- **Verification:** `pnpm test convex/__tests__/clientIdentity.test.ts convex/__tests__/contact.http.test.ts convex/__tests__/newsletter.subscribe.http.test.ts` — expected to FAIL at this stage; the failure set is the evidence.
- **Status:** verified

- [x] **P1.T1: Resolver unit tests** — covers: FR-12, AC-10
  - [x] **P1.T1.1: Single-hop chain** — `x-forwarded-for: 203.0.113.7` resolves to that address
  - [x] **P1.T1.2: Forged leading hop** — `"1.2.3.4, 203.0.113.7"` resolves to `203.0.113.7`, not the forged entry
  - [x] **P1.T1.3: Multi-hop with private proxy addresses** — `"203.0.113.7, 172.18.0.2, 10.0.0.5"` resolves to `203.0.113.7`
  - [x] **P1.T1.4: Unresolvable chains** — absent headers, only private/loopback entries, and empty string each resolve to `null`
  - [x] **P1.T1.5: IPv6 and mapped forms** — `::1`, `fc00::/7`, and `::ffff:203.0.113.7` are classified correctly
- [x] **P1.T2: Contact HTTP tests** — covers: FR-1, FR-2, FR-3, FR-4, FR-9, FR-11, AC-1, AC-2, AC-7, AC-9
  - [x] **P1.T2.1: Rotation is inert** — three posts with three different `x-forwarded-for` values and three different body identifiers all consume one bucket; the fourth is `429`
  - [x] **P1.T2.2: Missing identity is refused** — no headers yields `429`, and `contactSubmissions`, `rateLimits`, and `_scheduled_functions` are unchanged
  - [x] **P1.T2.3: Successful post** — `200`, one submission row, three attempt rows, one scheduled Slack action
  - [x] **P1.T2.4: Honeypot** — filled honeypot returns `200` with no rows and no scheduled work
  - [x] **P1.T2.5: Malformed input** — invalid JSON and a missing required field each return `400` with no writes
- [x] **P1.T3: Newsletter HTTP tests** — covers: FR-5, FR-6, AC-3, AC-4
  - [x] **P1.T3.1: Identity bucket** — six posts from one connection, six different addresses: first five succeed, sixth is `429`
  - [x] **P1.T3.2: Address bucket** — six posts against one address with six different header values: sixth is `429`
  - [x] **P1.T3.3: Both rows recorded** — `newsletter_subscribe` and `newsletter_subscribe_email` rows exist for each allowed attempt
  - [x] **P1.T3.4: Unresolved identity** — subscribe succeeds, and the sixth attempt against that address is still refused
  - [x] **P1.T3.5: Response shape** — a new signup returns `alreadySubscribed: false`; a repeat returns `true`
- [x] **P1.T4: Surface and transport tests** — covers: FR-7, FR-8, AC-5, AC-6
  - [x] **P1.T4.1: No public write path** — assert on the module exports that `contact.submit` and `newsletter.subscribe` are internal, not on the `api` proxy, which resolves every property
  - [x] **P1.T4.2: Preflight** — `OPTIONS` to both paths returns `204` with `Access-Control-Allow-Origin` for the configured origin
  - [x] **P1.T4.3: Response header** — a `POST` response carries the same origin header
- [x] **P1.T5: Record the red run** — covers: NFR-4
  - [x] **P1.T5.1: Run the targeted suite and capture which cases fail and why** — absent routes and unresolved modules, not assertion mismatches
  - [x] **P1.T5.2: Move the two mutation-level rate-limit assertions in `newsletter.subscribe.rateLimit.test.ts` and `contact.test.ts` onto the HTTP surface** — no case is deleted, and `pnpm test` is expected to be red at the end of this phase

**Result:** verified (red by contract — the failing tests are the deliverable)
**Checkpoint:** `69b847f`
**Evidence:** conductor/tracks/20261027-rate-limit-identity/verification/phase-1.md

## Phase 2: One enforcement point inside Convex

- **Goal:** The identifier is derived from request headers only, both endpoints
  enforce their limits, the two public mutations are internal, and the Phase 1
  suite is green.
- **Depends on:** Phase 1
- **Covers:** FR-1 through FR-9, FR-11, FR-12, AC-1 through AC-7, AC-9
- **Touches:** `convex/http.ts`, `convex/lib/clientIdentity.ts`,
  `convex/lib/http.ts`, `convex/contact.ts`, `convex/newsletter.ts`,
  `convex/_generated/**`
- **Verification:** `pnpm test convex`
- **Status:** verified

- [x] **P2.T1: Client identity resolver** — covers: FR-1, FR-12
  - [x] **P2.T1.1: Parse `x-forwarded-for`, split on commas, trim, validate as an address; fall back to `x-real-ip`**
  - [x] **P2.T1.2: Drop private, loopback, link-local, and unspecified entries, including `::ffff:` mapped forms, then take the rightmost survivor**
  - [x] **P2.T1.3: Return `null` rather than a placeholder, so "unresolved" is distinguishable from an address**
  - [x] **P2.T1.4: Document the trusted-hop assumption in the module and in `conductor/tech-stack.md`**
- [x] **P2.T2: Shared response helper** — covers: FR-8, FR-9
  - [x] **P2.T2.1: One module for JSON responses, `Access-Control-Allow-Origin` from `SITE_URL` plus loopback dev origins, and the `OPTIONS` answer**
  - [x] **P2.T2.2: `Vary: Origin` on responses so a cached preflight cannot leak across origins**
- [x] **P2.T3: Contact endpoint** — covers: FR-2, FR-3, FR-4, FR-11, AC-1, AC-2, AC-9
  - [x] **P2.T3.1: `POST /contact` validates the payload and returns `400` before touching the database**
  - [x] **P2.T3.2: Resolve identity; when `null`, return `429` with the retry copy and write nothing**
  - [x] **P2.T3.3: Convert `contact.submit` to `internalMutation`, taking the resolved identifier as an argument and keeping its honeypot branch**
  - [x] **P2.T3.4: Preserve the existing limit (3/hour), insert order, and Slack scheduling**
- [x] **P2.T4: Newsletter endpoint** — covers: FR-5, FR-6, AC-3, AC-4
  - [x] **P2.T4.1: Convert `newsletter.subscribe` to `internalMutation`, taking the resolved identifier or `null`**
  - [x] **P2.T4.2: Keep both buckets: skip the identity bucket when unresolved, always enforce the normalized-address bucket**
  - [x] **P2.T4.3: `POST /newsletter/subscribe` maps thrown limit errors to `429` and validation errors to `400`, preserving `{ success, alreadySubscribed }`**
- [x] **P2.T5: Green the Phase 1 suite** — covers: AC-5, AC-6, AC-7
  - [x] **P2.T5.1: Run the full Convex suite and account for every Phase 1 failure**
  - [x] **P2.T5.2: Confirm `npx convex dev --once` leaves `_generated/` either unchanged or regenerated by the CLI, never hand-edited**

**Result:** verified (unresolved-identity policy, CORS, and 429 mapping all proven by tests)
**Checkpoint:** `fdb6e5d`
**Evidence:** conductor/tracks/20261027-rate-limit-identity/verification/phase-2.md

## Phase 3: Callers, ratchet, and full gate

- **Goal:** Both forms reach the endpoints over HTTP, the duplicated server
  functions are gone, the coverage floor reflects the new baseline, and the whole
  gate including the build is green.
- **Depends on:** Phase 2
- **Covers:** FR-10, AC-8, AC-11, NFR-1, NFR-2, NFR-3, NFR-5, NFR-6
- **Touches:** `src/routes/contact.tsx`,
  `src/components/features/NewsletterForm.tsx`, `vite.config.ts`,
  `conductor/tech-stack.md`, `conductor/workflow.md`, `docs/PRD.md`
- **Verification:** `pnpm build`
- **Status:** verified

- [x] **P3.T1: Contact form** — covers: FR-10, AC-8
  - [x] **P3.T1.1: Replace the mutation call with a `fetch` to `/contact` built from `VITE_CONVEX_URL`**
  - [x] **P3.T1.2: Delete `getClientIp` and its imports; keep validation, honeypot, toast, and success state**
  - [x] **P3.T1.3: Surface the server's 429 message verbatim instead of a generic failure**
- [x] **P3.T2: Newsletter form** — covers: FR-10, AC-8
  - [x] **P3.T2.1: Replace the mutation call with a `fetch` to `/newsletter/subscribe`; delete the duplicated resolver**
  - [x] **P3.T2.2: Preserve `alreadySubscribed` and failure toasts**
- [x] **P3.T3: Ratchet and doc sync** — covers: AC-11
  - [x] **P3.T3.1: Raise `vite.config.ts` thresholds to the measured baseline and update the matching block in `conductor/workflow.md`**
  - [x] **P3.T3.2: Correct the PRD sentence that overstates the rate-limit guarantee and record the trusted-hop model in `conductor/tech-stack.md`**
- [x] **P3.T4: Full gate** — covers: NFR-4, NFR-5, NFR-6
  - [x] **P3.T4.1: Five-command gate plus `pnpm test:coverage`; record exit codes and the test delta**
  - [x] **P3.T4.2: Confirm `grep -r getClientIp src` is empty and both endpoints are referenced by exactly one form each**
  - [x] **P3.T4.3: Verify the built app serves both pages and that the forms are present in the rendered markup**

**Result:** verified (both callers migrated, floor raised, full gate and build green)
**Checkpoint:** `f20dc44`
**Evidence:** conductor/tracks/20261027-rate-limit-identity/verification/phase-3.md

## Phase R1: Review Fixes

- **Goal:** Resolve review findings F1, F2, and F3 without changing product behaviour.
- **Depends on:** Phase 3
- **Covers:** F1, F2, F3
- **Touches:** `src/lib/__tests__/convex-http.test.ts`, `src/lib/convex/http.ts`,
  `convex/lib/clientIdentity.ts`, `convex/__tests__/clientIdentity.test.ts`,
  `convex/lib/http.ts`
- **Verification:** `pnpm test`
- **Status:** pending

- [ ] **R1.T1: Cover the client transport with tests** — covers: F1
  - [ ] Exercise the endpoint URL (including a trailing slash), the method and body
  - [ ] Cover a non-JSON error response, a server message, the fallback, and a missing `VITE_CONVEX_URL`
- [ ] **R1.T2: Canonicalize IPv4 octets** — covers: F2
  - [ ] Return the joined octets from `classifyEntry` and pin zero-padded input with a resolver case
- [ ] **R1.T3: Deduplicate the CORS allowlist** — covers: F3
  - [ ] Append each loopback origin that is not already present instead of branching on the site origin
