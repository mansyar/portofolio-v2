# Phase 2 — One enforcement point inside Convex

- **Track:** `20261027-rate-limit-identity`
- **Phase:** 2
- **Date:** 2026-10-27
- **Branch:** `fix/20261027-rate-limit-identity`
- **Phase base:** `ff7c42a3342de8dfaf9c416dd9134d2c26752a65`
- **Result:** verified

## What changed

| File | Change |
| --- | --- |
| `convex/lib/clientIdentity.ts` | New. `resolveClientIdentity(headers)` drops private/loopback/link-local/unspecified entries, normalizes `::ffff:` mapped addresses, and returns the rightmost public entry or `null` |
| `convex/lib/http.ts` | New. CORS allowlist from `SITE_URL` plus loopback dev origins, `Vary: Origin`, JSON responses, `OPTIONS` answer |
| `convex/http.ts` | New routes `POST /contact` and `POST /newsletter/subscribe`, each with an `OPTIONS` handler; payload validation, honeypot short-circuit, identity derivation, limit-to-429 mapping |
| `convex/contact.ts` | `submit` is now an `internalMutation` taking `identifier`; the limit throws `ConvexError({ code: "rate_limited" })` |
| `convex/newsletter.ts` | `subscribe` is now an `internalMutation` taking `identifier: string | null`; the identity bucket is skipped when unresolved, the address bucket always applies, and no row is written for an unresolved identity |

The resolver's rule, in one sentence: **the rightmost entry that is a public
address wins**, because proxies append the address they actually saw to whatever
the caller sent.

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| unit | `pnpm test convex` | 0 | 17 files, 67 tests passed (was 14 failing in Phase 1) |
| lint | `pnpm lint` | 0 | 21 warnings, unchanged from the base commit |
| format | `pnpm format:check` | 0 | clean |
| typecheck | `pnpm type-check` | 1 | exactly two errors, both in the Phase 3 callers that still reference the now-internal mutations: `NewsletterForm.tsx:28` and `contact.tsx:41` |
| build | `pnpm build` | not run | Phase 3 owns the build with the client callers in place |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-1 | Rotating forged hops does not buy allowance; fourth contact post is 429 | `contact.http.test.ts` case 1 — statuses `[200,200,200,429]`, all three attempt rows keyed on the appended address | covered |
| AC-2 | No identity headers → contact 429 with no writes | `contact.http.test.ts` case 2 — 429 plus zero submissions, attempts, and scheduled calls | covered |
| AC-3 | Sixth newsletter post from one connection is 429; both row kinds recorded | `newsletter.subscribe.http.test.ts` cases 1 and 2 — 5 identity + 5 address rows, 429 on the sixth | covered |
| AC-4 | Unresolved identity subscribes; address bucket still caps | `newsletter.subscribe.http.test.ts` case 5 — three signups with no headers succeed, no `"unknown"` row exists, sixth attempt on one address is 429 | covered |
| AC-5 | Both write paths are internal | `contact.http.test.ts` — module exports report `isInternal` | covered |
| AC-6 | Preflight 204 with origin, `POST` carries the origin header | `contact.http.test.ts` — surface block, both paths, plus a foreign origin receiving no header | covered |
| AC-7 | Invalid JSON and missing fields are 400 with no writes | `contact.http.test.ts` cases 5 and 6 | covered |
| AC-8 | `getClientIp` gone from `src/`, forms reference endpoints | — | pending (Phase 3) |
| AC-9 | Honeypot returns success with no writes | `contact.http.test.ts` case 4 | covered |
| AC-10 | Resolver covers single-hop, forged, multi-hop, unresolvable | `clientIdentity.test.ts` — 11 cases | covered |
| AC-11 | Full gate green, coverage floor raised | — | pending (Phase 3) |

## Deviations

1. **No phase subagent on this host.** As in Phase 1, the primary executed the
   phase directly; no executor agent is exposed here.
2. **`ConvexError` payload arrival.** The limit error crosses `runMutation`
   serialized, and the receiving side is not the same class instance, so
   `instanceof ConvexError` alone was not sufficient. The endpoint recognises the
   limit by payload shape (`{ code: "rate_limited", message }`), accepting both a
   serialized string and an object. Found by a failing test, not by inspection.
3. **Unresolved newsletter identity writes no attempt row.** FR-6 requires the
   copy to work; FR-1 forbids recording a placeholder identity. Both are met by
   skipping the identity bucket entirely rather than by writing `"unknown"`, which
   is asserted directly.
4. **`honeypot` is handled before identity resolution**, so a bot cannot learn
   whether its connection was attributable. Both paths write nothing.

## Notes

- `convex/_generated/` needed no regeneration: the generated API surface derives
  from module types rather than enumerating function names, so a
  public-to-internal change is type-visible without a CLI run. Confirmed by the
  two expected `type-check` errors naming the removed members and nothing else.
- The `type-check` failure is the planned intermediate state, not an accepted
  defect: Phase 3 replaces both callers.

## Primary verification

Re-run by the primary after the phase commit:

| Command | Exit | Result |
| --- | --- | --- |
| `pnpm test convex` | 0 | 17 files, 67 tests passed — every Phase 1 red case is green without a test edit |
| `pnpm lint` | 0 | 21 warnings (no new warning; one `useOptionalChain` finding was fixed rather than suppressed) |
| `pnpm format:check` | 0 | clean |
| `pnpm type-check` | 1 | only the two Phase 3 callers |

`git diff --name-only ff7c42a..HEAD` lists exactly the five backend files plus this
evidence file — no test file and nothing outside `Touches`.
