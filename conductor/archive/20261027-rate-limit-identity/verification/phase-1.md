# Phase 1 — Failing regression tests at the HTTP boundary

- **Track:** `20261027-rate-limit-identity`
- **Phase:** 1
- **Date:** 2026-10-27
- **Branch:** `fix/20261027-rate-limit-identity`
- **Phase base:** `2df9dcc90deedcf60f53b08e12c19f347c06e86b`
- **Head:** recorded by the state commit that follows this file
- **Result:** verified (red by contract)

## What this phase delivers

Four test files describe the boundary that does not exist yet:

| File | Cases | Purpose |
| --- | --- | --- |
| `convex/__tests__/clientIdentity.test.ts` | 10 | Header-only identity resolution: forged leading hop, private proxy hops, mapped IPv6, junk values, unresolvable chains |
| `convex/__tests__/contact.http.test.ts` | 9 | `POST /contact` limits, refusal, honeypot, malformed input, CORS and preflight, and both write paths no longer being public |
| `convex/__tests__/newsletter.subscribe.http.test.ts` | 5 | Both newsletter buckets, case normalization, unresolved-identity policy, no side effects on rejection |
| `convex/__tests__/newsletter.subscribe.identity.test.ts` | 3 | Casing normalization, distinct tokens, and re-subscribe token rotation, moved off the public mutation |

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| unit (targeted red run) | `pnpm test convex/__tests__/clientIdentity.test.ts convex/__tests__/contact.http.test.ts convex/__tests__/newsletter.subscribe.http.test.ts` | 1 | 3 files failed, 14 tests failed — the expected red set |
| unit (identity red run) | `pnpm test convex/__tests__/newsletter.subscribe.identity.test.ts` | 1 | 3 tests failed, each `404` from an unrouted endpoint |
| lint | `pnpm lint` | 0 | 21 warnings, all pre-existing |
| format | `pnpm format:check` | 0 | clean after `biome check --write` on the four files |
| typecheck | `pnpm type-check` | 1 | one error, `TS2307: Cannot find module '../lib/clientIdentity'` — the module Phase 2 creates |

## The red set

```
FAIL  convex/__tests__/clientIdentity.test.ts [ convex/__tests__/clientIdentity.test.ts ]
Error: Cannot find module '../lib/clientIdentity' imported from convex/__tests__/clientIdentity.test.ts

FAIL  convex/__tests__/contact.http.test.ts (9 tests | 9 failed)
  × limits the connection, not the forged hop a caller rotates            expected 200, received 404
  × refuses a submission it cannot attribute and writes nothing           expected 429, received 404
  × records one submission, one attempt, and one notification...          expected 200, received 404
  × answers a filled honeypot with success while writing nothing          expected 200, received 404
  × rejects malformed JSON with 400 and writes nothing                    expected 400, received 404
  × rejects a payload missing a required field with 400...                expected 400, received 404
  × exposes neither write path as a public function                       expected "internal", received "public"
  × answers preflight for both endpoints with 204...                      expected 204, received 404
  × carries the origin header on POST responses...                        expected origin, received null

FAIL  convex/__tests__/newsletter.subscribe.http.test.ts (5 tests | 5 failed)
  × rejects the sixth attempt from one connection within an hour          expected 200, received 404
  × records every allowed attempt and rejects the sixth...                 expected 200, received 404
  × rejects the sixth attempt against one address...                      expected 200, received 404
  × treats differently-cased forms of one address as the same bucket      expected 200, received 404
  × subscribes without an identity header and still caps the address      expected 200, received 404

FAIL  convex/__tests__/newsletter.subscribe.identity.test.ts (3 tests | 3 failed)
  × keeps one subscriber when one address arrives with different casing   expected 200, received 404
  × gives every subscriber a distinct, non-empty token                    expected 200, received 404
  × refreshes the token and reactivates an address...                     expected 200, received 404
```

Every failure is the predicted one: an unrouted path (`404`), a module that
does not exist yet, or a mutation that is still public. None is an assertion
about behaviour that already works, so Phase 2 can make them green without
editing a test.

## Acceptance criteria

All criteria are written; each is proven in Phase 2.

| ID | Criterion | Test | Status |
| --- | --- | --- | --- |
| AC-1 | Rotating forged hops does not buy allowance; fourth contact post is 429 | `contact.http.test.ts` — "limits the connection, not the forged hop a caller rotates" | pending |
| AC-2 | No identity headers → contact 429 with no writes | `contact.http.test.ts` — "refuses a submission it cannot attribute and writes nothing" | pending |
| AC-3 | Sixth newsletter post from one connection is 429; both row kinds recorded | `newsletter.subscribe.http.test.ts` — "records every allowed attempt…" | pending |
| AC-4 | Unresolved identity subscribes; address bucket still caps | `newsletter.subscribe.http.test.ts` — "subscribes without an identity header…" | pending |
| AC-5 | Both write paths are internal | `contact.http.test.ts` — "exposes neither write path as a public function" | pending |
| AC-6 | Preflight 204 with origin, `POST` carries the origin header | `contact.http.test.ts` — surface block | pending |
| AC-7 | Invalid JSON and missing fields are 400 with no writes | `contact.http.test.ts` — two cases | pending |
| AC-8 | `getClientIp` gone from `src/`, forms reference endpoints | grep + Phase 3 tasks | pending |
| AC-9 | Honeypot returns success with no writes | `contact.http.test.ts` — "answers a filled honeypot…" | pending |
| AC-10 | Resolver covers single-hop, forged, multi-hop, unresolvable | `clientIdentity.test.ts` — 10 cases | pending |

## Deviations

1. **No phase subagent on this host.** `spawn_agents` rejected `gpt-5-agent` as
   unavailable, and no phase-executor agent is exposed, so the primary wrote the
   phase under the skill's "unless a phase subagent is unavailable" allowance.
2. **`newsletter.subscribe.identity.test.ts` moved with the rate-limit test.**
   It also called `api.newsletter.subscribe` with `clientIp` and would stop
   compiling the moment the mutation turns internal. It is inside `Touches`, so
   it is migrated here rather than left as a Phase 2 surprise.
3. **Plan wording corrected.** P1.T2.3 said "three attempt rows" for one post;
   the correct invariant is one attempt row per allowed post. The test asserts
   the correct invariant.
4. **Honeypot field name.** The browser form sends its `website` input as the
   `honeypot` argument; the tests post `honeypot` and the endpoint is expected
   to accept that field name.

## Notes

- The newsletter suite asserts that no attempt row is ever written against an
  `"unknown"` identifier — the shared-bucket defect from the prior track's
  limitation 2 — rather than merely asserting that signup still works.
- The CORS tests set `Origin` and, for preflight,
  `Access-Control-Request-Method`, so a missing `OPTIONS` handler fails here
  instead of only in a browser.

## Primary verification

The primary re-ran the phase verification command independently after the phase
commit, and the static checks:

| Command | Exit | Result |
| --- | --- | --- |
| `pnpm test convex/__tests__/clientIdentity.test.ts convex/__tests__/contact.http.test.ts convex/__tests__/newsletter.subscribe.http.test.ts` | 1 | 3 files / 14 tests failed, matching the red set above exactly |
| `pnpm test convex/__tests__/newsletter.subscribe.identity.test.ts` | 1 | 3 tests failed, all `404` |
| `pnpm lint` | 0 | 21 warnings, unchanged from the base commit |
| `pnpm format:check` | 0 | clean |
| `pnpm type-check` | 1 | only `TS2307` for the module Phase 2 creates |

The red state is the deliverable of this phase: every failure is a missing
route, a missing module, or a still-public mutation.
