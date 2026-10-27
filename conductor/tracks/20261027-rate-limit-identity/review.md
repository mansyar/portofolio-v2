# Review: Rate Limit Identity

- **Track:** `20261027-rate-limit-identity`
- **Type:** `bug`
- **Branch:** `fix/20261027-rate-limit-identity`
- **Range:** `60012bdf2e99e8c9b09a9ce2e6eb32ebda41ac58..be3a121`
- **Date:** 2026-10-27
- **Verdict:** `PASS WITH FINDINGS`

## Summary

The enforcement point moved to where it can be trusted: both public writes now
arrive at Convex HTTP actions, the identity is derived from the connection the
proxy recorded, and the mutations a browser could previously call directly are
internal. The Phase 1 red run is the strongest evidence in the track — fourteen
tests failed for the predicted reasons before any endpoint existed, and Phase 2
turned them green without touching a test.

Volume strategy: **large** (15 non-Conductor files, +984/−253). Reviewed per phase
checkpoint (`69b847f`, `fdb6e5d`, `f20dc44`) plus a cross-phase pass over
`convex/http.ts` ↔ `convex/lib/*` ↔ both forms.

Three findings, all fixable: the new client transport module has no tests, IPv4
normalization does not canonicalize zero-padded octets, and the CORS allowlist
special-cases a loopback `SITE_URL` in a way that silently drops the other loopback
origin.

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| test | `pnpm test` | pass | 50 files, 167 tests |
| coverage | `pnpm test:coverage` | pass | 29.92% statements, 30.0% lines (floor 29/21) |
| lint | `pnpm lint` | pass | 21 warnings, none new |
| typecheck | `pnpm type-check` | pass | clean |
| format | `pnpm format:check` | pass | 186 files |
| build | `pnpm build` | pass | Nitro output |
| container | `docker build -f docker/Dockerfile …` | pass | image exported |

## Requirements

| ID | Implemented by | Verified by | Status |
| --- | --- | --- | --- |
| FR-1 | P2.T1, P2.T3, P2.T4 | `clientIdentity.test.ts`, `contact.http.test.ts` | covered |
| FR-2 | P2.T3 | `contact.http.test.ts` case 3 | covered |
| FR-3 | P2.T3 | `contact.http.test.ts` case 1 | covered |
| FR-4 | P2.T3 | `contact.http.test.ts` case 2 | covered |
| FR-5 | P2.T4 | `newsletter.subscribe.http.test.ts` cases 1–3 | covered |
| FR-6 | P2.T4 | `newsletter.subscribe.http.test.ts` case 5 | covered |
| FR-7 | P2.T3, P2.T4 | `contact.http.test.ts` visibility case | covered |
| FR-8 | P2.T2 | preflight and response-header cases | covered |
| FR-9 | P2.T3 | malformed JSON / missing-field cases | covered |
| FR-10 | P3.T1, P3.T2 | `grep getClientIp src` empty; SSR render check | covered |
| FR-11 | P2.T3 | honeypot case | covered |
| FR-12 | P2.T1 | `clientIdentity.test.ts` (11 cases) | covered |
| NFR-1 | no dependency change | `package.json` unchanged in range | covered |
| NFR-2 | no secret in bundle | build output scan | covered |
| NFR-3 | limit before writes | case 2 snapshot equality | covered |
| NFR-4 | no test deleted | `newsletter.subscribe.rateLimit.test.ts` renamed and strengthened | covered |
| NFR-5 | full gate | verification table | covered |
| NFR-6 | form copy unchanged | SSR render + component diff | covered |
| AC-1 … AC-11 | see `verification/*.md` | phase evidence | covered |

## Findings

### Critical

- none

### High

- none

### Medium

- **F1 — The new client transport is untested**
  - **File:** `src/lib/convex/http.ts:26`
  - **What:** `postToConvex` and `responseError` carry every public write, and
    neither has a test. Their branches — missing `VITE_CONVEX_URL`, a non-JSON
    error body, a server message versus the fallback — are unverified. The
    project tests other `src/lib` helpers (`site.test.ts`, `client-ip` before it
    was removed), so this is a gap in the established pattern, not a demand for
    coverage for its own sake.
  - **Why:** a regression here silently turns a rate-limit response into
    "Network error.", which is the one message a limited user must never see
    instead of the real reason.
  - **Fix:** add `src/lib/__tests__/convex-http.test.ts` covering the endpoint
    URL (including a trailing slash), the posted method and body, a non-JSON
    error response, message extraction, the fallback, and the missing-URL throw.
  - **Requirement:** NFR-6, AC-8
  - **Test gap:** the file names above.

### Low

- **F2 — IPv4 normalization does not canonicalize zero-padded octets**
  - **File:** `convex/lib/clientIdentity.ts:105`
  - **What:** `parseIpv4` validates octets but `classifyEntry` returns the raw
    string, so `203.000.113.7` and `203.0.113.7` resolve to different strings.
    The proxy writes canonical addresses, so this is not exploitable today; it is
    an aliasing hole waiting for the first caller that does not.
  - **Fix:** return `octets.join(".")` after validation, and pin it with a case.
  - **Requirement:** FR-12
  - **Test gap:** one resolver case.

- **F3 — The CORS allowlist special-cases a loopback `SITE_URL`**
  - **File:** `convex/lib/http.ts:24`
  - **What:** when `SITE_URL` equals `http://localhost:3000`, the allowlist
    returns only that origin and drops `http://127.0.0.1:3000`, so the two
    loopback spellings behave differently depending on configuration.
  - **Fix:** start from the site origin and append each loopback origin that is
    not already present.
  - **Requirement:** FR-8
  - **Test gap:** none needed; existing preflight cases cover the allow path.

## Plan compliance

Every phase has a `Result`, `Checkpoint`, and `Evidence`; all 14 tasks are marked
complete and are present in the diff. The only file outside the union of `Touches`
is `src/lib/convex/http.ts`, reported as a deviation in Phase 3 and justified: both
forms need identical transport logic, and duplicating it would recreate the drift
this track removes.

## Out of scope

- A second key for contact beyond the connection identity (per-address), which the
  spec explicitly leaves out.
- CDN/edge support in the resolver. Recorded as an assumption: one proxy, no CDN.
- The admin inbox pagination and the certifications surface, both separate track
  candidates.

## Debt

- **Unresolved newsletter callers have no global volume bound.** Before this
  track, an `"unknown"` bucket capped them at 5/hour; now only the address bucket
  applies. This is not filed as a defect because the deployed topology always
  appends `x-forwarded-for`, so a remote caller cannot reach the endpoint without
  an identity, and contact fails closed in that state. If the deployment ever
  changes so requests can arrive without proxy headers, a bounded global breaker
  should be added. Reason recorded here rather than as an issue: strict mode
  allows no unresolved in-scope finding, and this is an accepted, reasoned risk
  rather than an open defect.
- **The contact refusal message reads "Too many submissions" for a caller that
  submitted once.** FR-4 mandates the retry message, so changing it would be a
  spec change. Not filed.

## History

| Round | Verdict | Critical | High | Medium | Low | Fixed |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | PASS WITH FINDINGS | 0 | 0 | 1 | 2 | 0 |

## Doc sync

`pending` — post-review sync follows the fix round.
