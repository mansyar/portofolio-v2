# Rate Limit Identity — Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

Move the two public write paths — the contact form and newsletter signup —
behind Convex HTTP actions, so the rate-limit identifier is derived from the
connection the server observes instead of a value the browser supplies. The
public mutations become `internalMutation`s reachable only from those actions,
and the duplicated TanStack server function that resolves the client IP is
deleted from both call sites.

## Problem / Motivation

Both rate limits are advisory against anyone who talks to the Convex API
directly. `contact.submit` and `newsletter.subscribe` declare `clientIp` as an
ordinary string argument ([contact.ts:79-85](../../../convex/contact.ts),
[newsletter.ts:20-21](../../../convex/newsletter.ts)); the value is resolved in a
TanStack server function ([contact.tsx:16-27](../../../src/routes/contact.tsx),
duplicated in [NewsletterForm.tsx:13-23](../../../src/components/features/NewsletterForm.tsx))
and then handed back to the browser, which passes it to the mutation. A caller
that skips the form chooses any identifier per attempt, so the "3 per hour" and
"5 per hour" caps cost nothing to defeat. The forms are honest; the control is
not.

The defect is already recorded as debt. The hardening track's spec deferred it
explicitly ("closing that needs the Convex HTTP layer or a trusted proxy
header, which is a separate design change"), and its integrated verification
lists three consequences this track inherits:

1. the identity is transport-trusted and rotatable;
2. every caller whose address cannot be resolved shares one `"unknown"` bucket,
   so five unresolved signups block a sixth;
3. the resolver is duplicated in two files, and its comment admits a shared
   module is the right home.

If left alone, the newsletter key remains enumerable and mail-bombable per
address only, and the contact mailbox — the owner's only inbound channel — is
protected by a number the sender controls.

## Goals & Success Metrics

- **Goal:** A caller cannot obtain more allowance by choosing the identifier.
- **Metric:** An HTTP-level test that rotates spoofed `x-forwarded-for` values
  and per-call identifiers is limited exactly like a caller that does not, and
  the historical public mutation paths are no longer invocable from a client.
- **Goal:** Neither form regresses for a legitimate visitor.
- **Metric:** Both forms complete successfully against the new endpoints in the
  built app, with the same success, "already subscribed", and rate-limited
  messaging as today.
- **Goal:** One resolver, one enforcement point.
- **Metric:** `getClientIp` exists in zero files under `src/`; no rate-limit
  query is reachable from a browser-facing function.

## Scope

### In Scope

- `POST /contact` and `POST /newsletter/subscribe` as Convex HTTP actions in
  `convex/http.ts`, alongside the existing auth routes.
- Converting `contact.submit` and `newsletter.subscribe` to `internalMutation`,
  invoked only by those actions.
- `convex/lib/clientIdentity.ts`: parse `x-forwarded-for` and `x-real-ip`, drop
  private, loopback, and unspecified addresses, and take the rightmost remaining
  entry — the address of the hop nearest this deployment that is a real client.
  Return `null` when nothing survives.
- Missing identity policy: contact is refused; newsletter proceeds and relies on
  its per-address bucket.
- CORS on both endpoints for the configured site origin and loopback
  development origins, including an `OPTIONS` preflight.
- Both client forms posting JSON to the endpoints, using the already-required
  `VITE_CONVEX_URL`, and deleting their local `getClientIp` server functions.
- HTTP-level regression tests under `convex/__tests__/`, including spoofed
  header chains, preflight, and blocked-attempt side effects.
- Doc sync: the tech stack's header-trust note and the PRD paragraph that
  currently overstates the guarantee.
- Raise the coverage floor to the measured baseline, per the workflow's ratchet
  rule.

### Out of Scope

- A second rate-limit key for contact (for example per address). One identity
  dimension plus the honeypot is the agreed bar for this track.
- A global or per-process throughput cap, proxy rate limiting, or WAF rules.
- Cloudflare or any CDN in front of the proxy. If one is introduced, the
  rightmost-public-address rule no longer distinguishes the client from the
  edge, and that is a separate design change.
- The admin inbox, the unsubscribe flow, and every function not named above.
- Schema changes. `rateLimits` already stores an `identifier`/`action` pair.
- Redesigning either form's markup or copy beyond what status handling needs.

## Bug Details

- **Reproduction steps:**
  1. From a machine with the deployment URL, call
     `api.contact.submit` four times in a row with a different `clientIp`
     string each time (`203.0.113.1`, `203.0.113.2`, …) and valid form fields.
  2. Repeat against `api.newsletter.subscribe` six times, varying `clientIp`
     and the address.
  3. Optionally send `X-Forwarded-For: 198.51.100.9` to the app's IP server
     function and observe that the returned value is the header's first entry.
- **Expected behavior:** The fourth contact submission and the sixth
  subscription are refused with a "try again later" error, because they come
  from one client.
- **Actual behavior:** Every call succeeds. Each fresh string is a fresh bucket;
  `rateLimits` gains one row per supplied value.
- **Root-cause hypothesis:** The identifier enters the system as a mutation
  argument, so it sits on the untrusted side of the boundary. Resolving it
  earlier — in a TanStack server function — does not help, because the browser
  still forwards the result and a direct caller never passes through it.
  Enforcement has to happen where the request arrives at Convex.
- **Regression test:** A `convex-test` case that posts to the new HTTP endpoint
  with attacker-chosen `x-forwarded-for` values and body identifiers, asserting
  the allowance is consumed by connection identity rather than by those values;
  and a case asserting `contact.submit` is not a public function. Both fail
  before the change (no route; public mutation present) and pass after it.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | The rate-limit identifier is derived inside Convex from request headers only; no client-supplied identifier is accepted by any function that records an attempt. | must |
| FR-2 | `POST /contact` accepts the existing form fields, enforces 3 attempts per hour per derived identity, and returns `200` with `{ success: true }` on a new submission. | must |
| FR-3 | A contact attempt refused by the limit returns `429` with a human-readable message and writes nothing: no `contactSubmissions` row, no `rateLimits` row, no scheduled Slack action. | must |
| FR-4 | When the identity cannot be derived, `POST /contact` returns `429` with the same retry message and writes nothing. | must |
| FR-5 | `POST /newsletter/subscribe` enforces 5 attempts per hour per derived identity **and** 5 per normalized address, recording both rows, and preserves the `{ success, alreadySubscribed }` response. | must |
| FR-6 | When the identity cannot be derived, `POST /newsletter/subscribe` still subscribes, and the per-address limit still applies. | must |
| FR-7 | `contact.submit` and `newsletter.subscribe` are `internalMutation`s; a client can no longer invoke either by path. | must |
| FR-8 | Both endpoints answer `OPTIONS` with `204` and the CORS headers for the site origin, and every response carries `Access-Control-Allow-Origin` for that origin. | must |
| FR-9 | Malformed or incomplete payloads return `400` with a message, never a `500` and never a partial write. | must |
| FR-10 | Both forms call the endpoints over HTTP and display the returned message on failure; the two `getClientIp` server functions are deleted. | must |
| FR-11 | The honeypot path still returns success while writing nothing. | must |
| FR-12 | `convex/lib/clientIdentity.ts` is the only place header parsing happens, and it is unit-tested against single-hop, multi-hop, private-only, and absent-header chains. | should |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | No new runtime dependency; `convex` stays pinned at `1.31.2` and `convex-test` at `0.0.41`. |
| NFR-2 | No secret or deployment admin key enters the client bundle; the endpoints are public by design and rely on the limits, not on auth. |
| NFR-3 | A refused attempt performs no writes and schedules no work, so an attack costs one indexed read per request and leaves no residue. |
| NFR-4 | The existing suite stays green: no test is deleted or weakened; the two Superseded rate-limit tests move to the HTTP layer rather than disappearing. |
| NFR-5 | `pnpm type-check`, `pnpm lint`, `pnpm format:check`, `pnpm test`, and `pnpm build` all exit 0. |
| NFR-6 | Behaviour, copy, and accessibility of both forms are unchanged for the success and already-subscribed paths. |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | A `convex-test` HTTP case posts three contact submissions from one connection with three different `x-forwarded-for` values and three different body identifiers; the fourth is `429`. | FR-1, FR-2, FR-3 |
| AC-2 | A case with no `x-forwarded-for` and no `x-real-ip` gets `429` from `POST /contact`, and `contactSubmissions`, `rateLimits`, and scheduled functions are unchanged. | FR-4, NFR-3 |
| AC-3 | Six newsletter posts from one connection against six different addresses: the first five succeed, and rows exist for both `newsletter_subscribe` and `newsletter_subscribe_email` actions. | FR-5 |
| AC-4 | A newsletter post with no resolvable identity succeeds, and the sixth attempt against the same address is rejected regardless of header. | FR-6 |
| AC-5 | `api.contact.submit` and `api.newsletter.subscribe` are not public functions; asserting on the module exports, not on the `api` proxy. | FR-7 |
| AC-6 | An `OPTIONS` request to both paths returns `204` with `Access-Control-Allow-Origin` set to the configured site origin, and a `POST` response carries the same header. | FR-8 |
| AC-7 | A `POST` with invalid JSON and one with a missing field each return `400`; no row is written. | FR-9 |
| AC-8 | `grep -r getClientIp src` returns nothing, and both forms reference the new endpoint paths. | FR-10 |
| AC-9 | A honeypot-filled contact post returns `200` with no `contactSubmissions`, `rateLimits`, or scheduled row. | FR-11 |
| AC-10 | `clientIdentity` unit tests cover the four chain shapes, including a forged leading entry that is discarded. | FR-12 |
| AC-11 | Full gate is green and the coverage floor is raised to the measured baseline in `vite.config.ts` and `conductor/workflow.md`. | NFR-4, NFR-5 |

## Edge Cases

- **Spoofed leading hop.** A client sending `X-Forwarded-For: 1.2.3.4` gets its
  real address appended by the proxy; the rightmost public entry wins, so the
  forged value is inert.
- **Private-only chain.** Container-to-container addresses (`10/8`, `172.16/12`,
  `192.168/16`, `127/8`, `::1`, `fc00::/7`, `::ffff:` mapped forms) are dropped.
  If nothing remains, contact is refused and newsletter falls back to the
  address bucket.
- **CDN in front later.** All clients would collapse to the edge's address. That
  is recorded as a limitation of this design, not silently accepted.
- **Legacy rows.** `rateLimits` already holds rows keyed on addresses and on
  plaintext emails. New rows reuse the same action strings, so old rows still
  count while they are within the hour.
- **Invalid JSON, missing field, oversized body.** `400`, no writes.
- **Honeypot.** Unchanged: successful-looking response, no writes.
- **Re-subscribe of an existing address.** Still counts against both buckets and
  still returns `alreadySubscribed: false`, as today.
- **Browser preflight.** A JSON `POST` triggers `OPTIONS`; a missing preflight
  answer would break both forms only in the browser, not in tests, so it needs
  its own assertion.
- **Local development.** `SITE_URL` is unset or a loopback origin; the CORS
  allowlist must include the local app origin or `pnpm dev` forms stop working.
- **SSR.** Both forms render on the server; removing the server functions must
  not leave a server-only import in a client component.
- **Old bundle in a cached tab.** A tab still calling the removed mutation path
  receives Convex's "no such function" error; correct outcome, no shim.

## Dependencies

- **Tracks:** none. `20261025-harden-public-convex-functions` is merged and is
  the source of the deferral this track closes.
- **External:** none. `convex/http.ts` and `convex-test`'s `t.fetch` already
  exist; `VITE_CONVEX_URL` already reaches the deployment, and `SITE_URL` is
  already the Convex-side site origin used by the welcome email.

## Open Questions & Assumptions

- **Assumption:** The deployment sits behind exactly one reverse proxy and
  receives public client addresses, so the rightmost public `x-forwarded-for`
  entry is the client. The observed header chain cannot be inspected before a
  deploy; if the chain differs, the contact refusal is the visible symptom and
  the fix is a hop count, not a redesign.
- **Assumption:** Convex HTTP actions receive the proxy's headers unmodified.
  Phase 2 proves parsing against synthetic headers; the real chain is a manual
  production observation, recorded as a limitation if it cannot be confirmed.
- **Assumption:** `auth.addHttpRoutes` uses `/api/auth/*`, so `/contact` and
  `/newsletter/subscribe` do not collide.
- **Assumption:** An unresolved newsletter identity is bounded only by the address
  key — there is no global volume limit for it. In the deployed topology the reverse
  proxy always appends `x-forwarded-for`, so a remote caller cannot reach the endpoint
  without an identity; the state therefore exists only behind a misconfigured proxy or
  in local development, where contact already fails closed. If the deployment ever
  allows requests to arrive without proxy headers, a bounded global breaker should be
  added. Recorded in `review.md` Debt.
- **Question:** Should contact also be keyed per sender address? Deferred — it
  buys little against spam, which rarely reuses an address.
- **Question:** Should the two endpoints share one JSON error envelope with the
  admin surface? Deferred until a third endpoint exists.

## References

- `conductor/archive/20261025-harden-public-convex-functions/spec.md` — the
  deferral of IP spoofing as out of scope.
- `conductor/archive/20261025-harden-public-convex-functions/verification/integrated.md`
  — the three recorded limitations this track closes.
- `conductor/product-guidelines.md` — privacy commitment for subscriber data.
- `conductor/tech-stack.md` — `convex` pinned to match the self-hosted backend.
- `convex/http.ts`, `convex/contact.ts`, `convex/newsletter.ts`,
  `convex/schema.ts` (`rateLimits`), `src/routes/contact.tsx`,
  `src/components/features/NewsletterForm.tsx`.
