# Review Fixes - Phase R1

| Field | Value |
|---|---|
| Track | `20261025-harden-public-convex-functions` |
| Phase | R1 |
| Date | 2026-10-26 |
| Base commit | `626312e` |
| **Result** | **verified** |

Resolves the five findings from the track review (verdict PASS WITH FINDINGS, 0 Critical,
0 High, 2 Medium, 3 Low).

## Findings and resolutions

| ID | Sev | Finding | Resolution |
|---|---|---|---|
| F1 | Medium | The newsletter rate limit was keyed only on `clientIp`, a client-supplied value. `v.string()` makes the field required, not trustworthy, so a caller who varied it got unlimited attempts — enumeration via `alreadySubscribed` and per-inbox mail-bombing stayed open for a determined caller. | Added a second, independent limit keyed on the **normalized address** (`trim().toLowerCase()`), action `"newsletter_subscribe_email"`, same 5/hour window, checked in the same pre-insert block. Both attempt rows are written before the subscriber lookup. |
| F2 | Medium | The admin-path test supplied `email` on the identity, which production never does — Convex Auth's JWT carries only `sub` (`userId|sessionId`), so `requireAdmin` resolves the address from the `users` table or, in an action context, through `internal.admin.getUserEmail`. If that lookup regressed the sole admin would lose the analytics widget and nothing would fail. | Added a third test that seeds a `users` row, presents `withIdentity({ subject: `${userId}|session` })` **with no email claim**, and asserts the action resolves. Mutation-tested: seeding a non-admin address makes it fail with `Unauthorized: Not an admin`. |
| F3 | Low | `convex/projects.ts` `remove` calls `requireAdmin` after `ctx.db.delete`. | **Not fixed — out of scope.** Verified not exploitable (both statements share one Convex mutation transaction, so a throw rolls the delete back). Recorded as follow-up debt; fixing it means editing `projects.ts`, which the spec excludes. |
| F4 | Low | `docs/PROGRESS.md` was not synced, and the PRD sentence over-stated the rate-limit guarantee. | Added a changelog row for the hardening work and rewrote the PRD paragraph to name both keys, the 5/hour threshold, and the transport-trusted caveat on the IP half. |
| F5 | Low | The test named "still exists as a callable action" read like a reachability guarantee, but passes only because `convex-test@0.0.41` does not enforce public/internal visibility. | Renamed to "is still callable as an action so the subscribe scheduler can reach it" and documented in the body that the sibling test is what pins visibility. |

## Commands

| Command | Exit | Result |
|---|---|---|
| `pnpm type-check` | 0 | clean on TypeScript 7.0.2 |
| `pnpm lint` | 0 | 154 files, **99 warnings, 0 errors** — unchanged from `main` |
| `pnpm format:check` | 0 | 154 files, no fixes applied |
| `pnpm test` | 0 | **46 passed, 0 failed, 17 files** |
| `pnpm test:coverage` | 0 | 7.99% lines / 5.88% functions (was 6.81% / 5.44%) |
| `pnpm build` | 0 | `.output/nitro.json` generated |

## Tests added

| Test | File | Proves |
|---|---|---|
| "resolves an admin whose identity carries no email claim" | `analytics.getStats.test.ts` | The production `requireAdmin` path works when the JWT has no email claim |
| "rejects the sixth attempt against one address even when every IP differs" | `newsletter.subscribe.rateLimit.test.ts` | Rotating the IP cannot bypass the limit |
| "treats differently-cased forms of one address as the same bucket" | `newsletter.subscribe.rateLimit.test.ts` | `User@Example.com` and `user@example.com` share an allowance |

Suite: **43 → 46**.

## Mutation checks

Each new test was verified to fail when the code it covers is removed, rather than merely
passing:

| Mutation | Observed |
|---|---|
| Seed a non-admin email in the no-claim test | `Error: Unauthorized: Not an admin` — 1 failed |
| Drop the `recentForEmail` condition from the rate-limit throw | 2 failed (both address-keyed tests) |
| Restore either | back to green |

## Notes

- The IP half of the limit remains transport-trusted. Closing that needs the Convex HTTP
  action layer or a trusted proxy header, both out of scope; it is now documented as a
  limitation rather than implied away.
- `contact.submit` still has only the IP-keyed limit. The reviewer's fix suggestion was
  scoped to the newsletter, and changing contact's behaviour is outside this track's
  Touches; it is recorded as follow-up debt alongside `projects.remove`.
