# Phase 3 — Callers, ratchet, and full gate

- **Track:** `20261027-rate-limit-identity`
- **Phase:** 3
- **Date:** 2026-10-27
- **Branch:** `fix/20261027-rate-limit-identity`
- **Phase base:** `28c238b6ef740554e5bd42b7b99acb4625debe76`
- **Result:** verified

## What changed

| File | Change |
| --- | --- |
| `src/lib/convex/http.ts` | New. `postToConvex(path, body)` and `responseError(data, fallback)` — one call site for both forms |
| `src/routes/contact.tsx` | Local `getClientIp` server function deleted; submissions post to `/contact`; the server's 429 message is shown verbatim; `isPending` became local `isSubmitting` |
| `src/components/features/NewsletterForm.tsx` | Duplicated `getClientIp` deleted; signup posts to `/newsletter/subscribe`; `alreadySubscribed` still drives the toast copy |
| `vite.config.ts` | Coverage floor raised from 3/3 to 29/21 |
| `conductor/workflow.md` | Config thresholds and the ratchet paragraph now record the 2026-10-27 baseline |
| `conductor/tech-stack.md` | New dated section: the two HTTP writes, the identity rule, the failure policy, the single-proxy assumption, and CORS |
| `docs/PRD.md` | The paragraph that called the limit "transport-trusted" now describes the derived identity and its CDN limitation |

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| static | `pnpm type-check` | 0 | clean |
| static | `pnpm lint` | 0 | 21 warnings, unchanged from the base commit |
| static | `pnpm format:check` | 0 | 186 files clean |
| unit | `pnpm test` | 0 | 50 files, 167 tests passed (was 146 / 48 at `main`) |
| coverage | `pnpm test:coverage` | 0 | statements 29.92%, branches 35.19%, functions 21.87%, lines 30.0% — above the new 29/21 floor |
| build | `pnpm build` | 0 | Nitro server built in 31.48s |

## Runtime checks against the built server

`PORT=3010 node .output/server/index.mjs`, then HTTP requests:

| Check | Result |
| --- | --- |
| `GET /contact` | `200`; the rendered form carries `name="name"`, `name="email"`, `name="message"`, `name="website"` (the honeypot) |
| `GET /about` | `200`; the newsletter form markup (`newsletter-inline-input`) is present |
| Endpoint path in the build | `/newsletter/subscribe` appears in `main-*.js` and the server chunk, so the callers ship with the new path |
| Resolver leftovers | no `x-forwarded-for` anywhere in `.output/` — the resolver lives in the Convex deployment, not the app bundle |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-1 | Rotating forged hops does not buy allowance | `contact.http.test.ts` | covered |
| AC-2 | No identity headers → contact 429, no writes | `contact.http.test.ts` | covered |
| AC-3 | Sixth newsletter post from one connection is 429; both rows | `newsletter.subscribe.http.test.ts` | covered |
| AC-4 | Unresolved identity subscribes; address bucket caps | `newsletter.subscribe.http.test.ts` | covered |
| AC-5 | Both write paths internal | `contact.http.test.ts` | covered |
| AC-6 | Preflight 204 with origin; `POST` carries the header | `contact.http.test.ts` | covered |
| AC-7 | Invalid JSON / missing fields → 400, no writes | `contact.http.test.ts` | covered |
| AC-8 | `getClientIp` gone from `src/`; forms reference the endpoints | `grep -r getClientIp src` empty; both files import `postToConvex` and use `/contact`, `/newsletter/subscribe` | covered |
| AC-9 | Honeypot returns success with no writes | `contact.http.test.ts` | covered |
| AC-10 | Resolver covers the four chain shapes | `clientIdentity.test.ts` (11 cases) | covered |
| AC-11 | Full gate green and coverage floor raised | commands table; `vite.config.ts` 29/21; `workflow.md` baseline | covered |

## Deviations

1. **No phase subagent on this host**, as in Phases 1 and 2.
2. **`src/lib/convex/http.ts` is outside `Touches`.** Both forms need the same
   "post JSON, read the error message" logic, and duplicating it would recreate the
   exact drift this track removes. It is the smallest shared addition; every other
   file touched is inside the phase contract.
3. **`isPending` → `isSubmitting`.** The contact form's loading flag came from the
   removed mutation hook, so it is now local state. Behaviour is unchanged.
4. **Doc sync ran here, not only after review,** because the plan put it in
   `P3.T3`. Product and guideline documents were not changed; only `tech-stack.md`,
   `workflow.md`, and the overstated `docs/PRD.md` paragraph.

## Notes

- The ratchet moved from 3% to 29/21 because the suite grew from 146 to 167 tests
  and the Convex modules gained real coverage: `convex/lib/clientIdentity.ts` is at
  88.33% statements, `convex/lib/http.ts` at 100%, and the endpoints' error paths are
  exercised.
- `pnpm build` succeeds without a live Convex deployment, as `workflow.md` says it
  must.
