## Summary

The contact and newsletter rate limits were keyed on a value the browser chose: both public mutations took `clientIp` as an ordinary argument, so any caller could rotate it and the "3 per hour" and "5 per hour" caps cost nothing to defeat. This track moves both writes onto Convex HTTP actions, derives the identity from the connection the proxy recorded, and turns the mutations into internal functions that no client can reach.

This closes the limitation the earlier hardening track wrote down ("closing that needs the Convex HTTP layer or a trusted proxy header"), along with its two companions: the shared `"unknown"` bucket and the duplicated IP resolver.

## Track

- **ID:** `20261027-rate-limit-identity`
- **Type:** `bug`
- **Spec:** [`conductor/archive/20261027-rate-limit-identity/spec.md`](conductor/archive/20261027-rate-limit-identity/spec.md)
- **Plan:** [`conductor/archive/20261027-rate-limit-identity/plan.md`](conductor/archive/20261027-rate-limit-identity/plan.md)
- **Review:** [`conductor/archive/20261027-rate-limit-identity/review.md`](conductor/archive/20261027-rate-limit-identity/review.md)

## What happened

| Phase | Goal | Result | Checkpoint | Notes |
| --- | --- | --- | --- | --- |
| 1: Failing tests | Describe the HTTP boundary before it exists | verified | `69b847f` | Red by contract: 14 failures, all `404`s, a missing module, or a still-public mutation |
| 2: Enforcement | Header-derived identity, both endpoints, internal mutations | verified | `fdb6e5d` | All Phase 1 failures green without editing a test |
| 3: Callers | Forms post to the endpoints; ratchet; docs; full gate | verified | `f20dc44` | Build and container build green |
| R1: Review fixes | F1–F3 | verified | `75494f7` | Transport tests, octet canonicalization, allowlist dedupe |

## Requirements

- [x] `FR-1` — identity derived only from request headers (test: `convex/__tests__/clientIdentity.test.ts`)
- [x] `FR-2` — `POST /contact` allows 3 per hour and returns `{ success: true }` (test: `convex/__tests__/contact.http.test.ts`)
- [x] `FR-3` — a refused contact attempt writes nothing (test: same, case 1)
- [x] `FR-4` — unresolvable identity refuses contact with a 429 and no writes (test: case 2)
- [x] `FR-5` — newsletter enforces 5/hour per identity **and** per address (test: `convex/__tests__/newsletter.subscribe.http.test.ts`)
- [x] `FR-6` — newsletter survives an unresolvable identity; the address key still binds
- [x] `FR-7` — `contact.submit` and `newsletter.subscribe` are internal
- [x] `FR-8` — CORS and `OPTIONS 204` for the site origin; `Vary: Origin`
- [x] `FR-9` — malformed payloads are 400s with no writes
- [x] `FR-10` — both forms call the endpoints; `getClientIp` is gone from `src/`
- [x] `FR-11` — honeypot still returns success while writing nothing
- [x] `FR-12` — one resolver, unit-tested against four chain shapes
- [x] `NFR-1` — no new dependency
- [x] `NFR-2` — no secret in the client bundle
- [x] `NFR-3` — a refused attempt costs one indexed read and leaves no residue
- [x] `NFR-4` — no test deleted or weakened; the two mutation-level rate-limit cases moved to HTTP
- [x] `NFR-5` — full gate green
- [x] `NFR-6` — form copy and markup unchanged
- [x] `AC-1` … `AC-11` — see `conductor/archive/20261027-rate-limit-identity/verification/`

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| unit | `pnpm test` | pass — 51 files, 174 tests | `verification/integrated.md` |
| coverage | `pnpm test:coverage` | pass — 30.7% lines, 22.61% functions (floor 29/21) | `verification/integrated.md` |
| static | `pnpm type-check` | pass | `verification/integrated.md` |
| static | `pnpm lint` | pass — 21 warnings, none new | `verification/integrated.md` |
| static | `pnpm format:check` | pass | `verification/integrated.md` |
| build | `pnpm build` | pass | `verification/integrated.md` |
| container | `docker build -f docker/Dockerfile .` | pass | `verification/integrated.md` |

## Review

- **Verdict:** `PASS`
- **Rounds:** 2
- **Fixed:** 3 findings (client transport untested, zero-padded octet aliasing, loopback allowlist)
- **Accepted/deferred:** 0 blocking; two reasoned risks recorded in `review.md` Debt

## Deviations and risks

- **One file outside the phase `Touches`:** `src/lib/convex/http.ts`, the shared client transport. It is the smallest way to avoid re-creating the duplicated resolver this track removes.
- **The identifier rule assumes one reverse proxy and no CDN.** `resolveClientIdentity` takes the rightmost public `x-forwarded-for` entry, which is the address the proxy appended. A CDN in front would make every request arrive from the edge and would require revisiting the resolver.
- **The production header chain is not verified from a developer machine.** It is unit-tested against forged, multi-hop, and private-only chains; the failure mode is chosen to be loud (contact refuses rather than silently allowing), and the fix if the chain differs is a hop count in one function.
- **An unresolved newsletter identity has no global volume bound**, only the address key. Remote callers cannot reach the endpoint without an identity because the proxy always appends one; the state exists only behind a broken proxy configuration. Recorded as an assumption in the spec.

## Follow-ups

- none filed. Two reasoned risks are recorded in the archived `review.md` Debt rather than as issues, because neither is an open defect.

## Rollback

```bash
# Squash commit
git revert --no-edit <squash-commit>
```

No migration or data rollback is needed: the `rateLimits` table keeps its shape, and old rows remain valid. Rolling back restores the public mutations and the client-supplied `clientIp`, which is the defect, so prefer fixing forward.
