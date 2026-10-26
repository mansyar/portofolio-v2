# Phase 1 — Subscriber identity

- **Track:** `20261026-newsletter-lifecycle` — Newsletter Lifecycle
- **Phase:** 1
- **Date:** 2026-10-26
- **Branch:** `fix/20261026-newsletter-lifecycle`
- **Base:** `099a84939320625983e3e2adce75f72d211a5862`
- **Head:** `557757d`
- **Result:** verified

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| unit | `pnpm exec vitest run convex/__tests__/newsletter.subscribe.identity.test.ts convex/__tests__/newsletter.normalizeSubscribers.test.ts` | 0 | 6 tests passed |
| static | `pnpm type-check` | 0 | `tsc --noEmit` clean |
| static | `pnpm lint` | 0 | 168 files; 21 warnings, 0 errors |
| static | `pnpm format:check` | 0 | Biome check clean |
| unit | `pnpm test` | 0 | 40 files, 112 tests |
| red run | The two new suites before the fix | 1 (expected) | 6 failures: 2 rows for one address, missing tokens, no reactivation |

The phase verification command was run as written and exited `0`.

## Red run

The suites were written first and run against the unfixed `subscribe`
(`phase-1-red-run.txt`). Failures were exactly the defects in the spec: the casing test
found `[ { …(5) }, { …(5) } ]` instead of one row, the token test found no token, and the
reactivation test found the original row still `unsubscribed` because the mixed-case lookup
matched nothing and inserted a second row. The migration suite failed with "no such export:
`normalizeSubscribers`".

## Acceptance criteria in this phase

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-1 | `A@B.com` then `a@b.com` leaves one row and reports `alreadySubscribed: true`. | `keeps one subscriber when one address arrives with different casing and spacing`; the stored value is asserted as `ana@example.com`. | covered |
| AC-2 | Tokens exist, are non-empty, and differ; re-subscribing an unsubscribed address yields active plus a token. | Two tests: distinct tokens (length ≥ 16) and the reactivation case, which also asserts the token changes. | covered |
| AC-5 | The migration normalizes, collapses onto the earliest, backfills tokens, and is a no-op the second time. | Three migration tests, including the second-run assertion that all three counters are zero and the row set is unchanged. | covered |
| FR-1 | Normalize before lookup and insert. | `normalizeEmail` is applied to the lookup key and the inserted value; the rate-limit keys keep using it. | covered |
| FR-2 | Token on insert and on re-subscribe, with an index. | `unsubscribeToken` + `by_token` index; both write paths set it. | covered |
| FR-5 | Idempotent backfill. | `normalizeSubscribers`, conditional patch so identical rows are not rewritten. | covered |

FR-3, FR-4, FR-6 and their criteria belong to Phases 2 and 3.

## Evidence paths

- `.conductor/evidence/20261026-newsletter-lifecycle/phase-1-red-run.txt`
- `.conductor/evidence/20261026-newsletter-lifecycle/phase-1-gate.txt`
- `convex/__tests__/newsletter.subscribe.identity.test.ts`
- `convex/__tests__/newsletter.normalizeSubscribers.test.ts`

## Deviations

None. All four changed files are inside `Touches`.

## Notes

- **Token generation:** `crypto.randomUUID()` runs inside the mutation. Convex's runtime
  provides Web Crypto, confirmed by the passing tests under the edge-runtime environment.
- **Token rotation is limited to reactivation:** an already-active subscriber keeps the token
  in mail already sent, so old unsubscribe links stay valid until they are used or the
  address lapses.
- **Owner step:** `npx convex run newsletter:normalizeSubscribers` has not been run. Until it
  is, pre-existing mixed-case rows are invisible to the normalized lookup and Phase 2's mail
  omits the link when a row has no token.
- **Test isolation:** fake timers are used so the scheduled welcome action never runs outside
  the test transaction, matching the existing rate-limit suite.
