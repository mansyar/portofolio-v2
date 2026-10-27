# Phase R1 — Review Fixes

- **Track:** `20261027-rate-limit-identity`
- **Phase:** R1
- **Date:** 2026-10-27
- **Branch:** `fix/20261027-rate-limit-identity`
- **Covers:** F1, F2, F3 from `review.md`
- **Result:** verified

## Fixes

| Finding | Fix | Proof |
| --- | --- | --- |
| F1 — client transport untested | New `src/lib/__tests__/convex-http.test.ts` with six cases: URL, method/body, trailing-slash handling, a non-JSON 502, the missing-URL rejection, and both `responseError` branches | `pnpm test src/lib/__tests__/convex-http.test.ts` — 6 passed |
| F2 — zero-padded octets alias | `classifyEntry` now returns `octets.join(".")`, so `203.000.113.007` canonicalizes to `203.0.113.7` | new resolver case — 12 passed |
| F3 — loopback allowlist dropped one origin | `allowedOrigins()` starts from the site origin and appends each loopback origin not already present | existing preflight cases still pass |

No product behaviour changed: the CORS answers for the configured site origin and
the standard loopback pair are identical, and the identity strings only become
canonical.

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| unit (targeted) | `pnpm test src/lib/__tests__/convex-http.test.ts convex/__tests__/clientIdentity.test.ts` | 0 | 18 tests passed |
| static | `pnpm type-check` | 0 | clean |
| static | `pnpm lint` | 0 | 21 warnings, unchanged |
| static | `pnpm format:check` | 0 | clean after formatting the new test |
| unit | `pnpm test` | 0 | 51 files, 174 tests |
| coverage | `pnpm test:coverage` | 0 | 30.66% statements / 30.7% lines / 22.61% functions — above the 29/21 floor |

## Notes

- The first format run failed on the new test file only (a wrapped `expect` that
  Biome reflowed). It was fixed by running the formatter, not by suppressing the
  check.
- `src/lib/convex/http.ts` is now covered; its coverage moved from untested to
  exercised on both the success and failure branches.
