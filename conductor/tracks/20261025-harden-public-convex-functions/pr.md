## Summary

Convex exposes every function at the deployment URL, so authorization is each function's own
job. An audit of the 21 modules found four gaps: two unguarded reads/actions and one public
action that would send mail to any address supplied to it. This closes all four, adds the
first real Convex tests to the repo, and replaces five placeholder assertions that counted
toward the test total while asserting `expect(true).toBe(true)`.

## Track

- **ID:** `20261025-harden-public-convex-functions`
- **Type:** bug
- **Spec:** [`spec.md`](../../conductor/archive/20261025-harden-public-convex-functions/spec.md)
- **Plan:** [`plan.md`](../../conductor/archive/20261025-harden-public-convex-functions/plan.md)
- **Review:** [`review.md`](../../conductor/archive/20261025-harden-public-convex-functions/review.md)

## What happened

| Phase | Checkpoint | What changed |
|---|---|---|
| 1. Test infrastructure | `7ba1f96` | `convex-test@0.0.41` + `@edge-runtime/vm`; six regression tests written and observed **failing** against the unfixed code |
| 2. Close the gaps | `2eda002` | `getStats` guarded, `listSubscribers` deleted, `sendWelcomeEmail` → `internalAction`. Failures 6 → 2 |
| 3. Rate limit | `3f11da9` | `subscribe` limited per IP, IP resolved server-side. Suite green |
| 4. Tests and audit | `dc5a0ee` | Placeholders replaced with real assertions; 21-module access-model audit. 40 → 42 tests |
| R1. Review fixes | `84913cf` | Address-keyed limit added; production admin path tested. 42 → 46 tests |

## The four gaps

| Function | Before | After |
|---|---|---|
| `analytics.getStats` | Public action, no guard — any caller could spend the owner's Umami credentials | `requireAdmin(ctx)` first, above the `try` that returns `null` and above the env check |
| `newsletter.listSubscribers` | Public query returning every subscriber email | Deleted (no UI used it) |
| `newsletter.sendWelcomeEmail` | Public action — a spam relay spending Resend quota and domain reputation | `internalAction`, unreachable from the client |
| `newsletter.subscribe` | Public by design, unlimited | 5/hour on **two** keys: the IP and the normalized address |

## Requirements

- [x] **FR-1** `analytics.getStats` requires an admin identity
- [x] **FR-2** `newsletter.listSubscribers` removed
- [x] **FR-3** `sendWelcomeEmail` is an `internalAction`
- [x] **FR-4** `subscribe` rate limited
- [x] **FR-5** The form resolves the IP server-side
- [x] **FR-6** `convex-test` installed, four regression tests exist
- [x] **FR-7** Every Convex function classified by access model
- [x] **NFR-1** No behaviour change to public or admin flows
- [x] **NFR-2** Test count 31 → 46, no file deleted
- [x] **NFR-3** Coverage above the ratchet
- [x] **NFR-4** All gate commands exit 0
- [x] **NFR-5** `maxWorkers: 4` respected
- [x] **NFR-6** No new client-side secret
- [x] **AC-1 … AC-9** Met — see `verification/integrated.md` (AC-8's widget render path is not exercisable in jsdom and is flagged rather than claimed)

## Verification

| Layer | Command | Result |
|---|---|---|
| Setup | `pnpm install --frozen-lockfile` | pass |
| Static | `pnpm type-check` | pass — TypeScript 7.0.2 |
| Static | `pnpm lint` | pass — 154 files, 99 warnings, **0 errors** (identical to `main`) |
| Static | `pnpm format:check` | pass |
| Unit | `pnpm test` | **46 passed, 17 files** |
| Unit | `pnpm test:coverage` | 7.99% lines / 5.88% functions vs the 3%/3% floor |
| Build | `pnpm build` | pass — `.output/nitro.json` |

Full record: [`verification/integrated.md`](../../conductor/archive/20261025-harden-public-convex-functions/verification/integrated.md).

## Media

No visual demo — the changes are server-side authorization, a rate limit, and tests. The only
UI-touching edit is the newsletter form's submit path, which renders identically.

## Review

**PASS WITH FINDINGS**, 1 round, 5 findings (0 Critical, 0 High, 2 Medium, 3 Low) — 4 fixed,
1 recorded as debt. The reviewer independently enumerated all 103 Convex exports and 74
`requireAdmin` sites and confirmed no unguarded public mutation exists beyond the two
rate-limited ones.

## Deviations and risks

- **The IP half of the rate limit is transport-trusted.** The address comes from request
  headers and is then supplied by the client, so it bounds honest volume, not a determined
  caller. The address-keyed limit is what actually makes enumeration cost something. Closing
  the IP hole needs the Convex HTTP layer — out of scope, now documented rather than implied
  away.
- **`convex` stays pinned at 1.31.2.** `convex-test` was pinned to 0.0.41, the newest release
  whose peer range covers it. Do not upgrade `convex` to satisfy a test dependency — a newer
  CLI breaks `convex deploy` against the older self-hosted backend.
- **`projects.remove` guards after it writes.** Not exploitable today (transactional
  rollback) and outside this track's scope; recorded as debt.
- **`contact.submit` keeps its IP-only limit.** Same class as the newsletter gap, but changing
  it was outside Touches.
- **`convex-test@0.0.41` does not enforce public/internal visibility.** The `sendWelcomeEmail`
  test therefore asserts on the `isInternal` flag rather than on a rejected call.
- 99 Biome warnings are pre-existing on `main`; none were added.

## Follow-ups

1. Move `requireAdmin` to the first statement in `projects.remove`.
2. Add an address-keyed limit to `contact.submit`.
3. Extract the duplicated IP resolver to `src/lib/server/client-ip.ts`.
4. Close the IP-spoofing hole via a Convex HTTP action or a trusted proxy header.

## Rollback

Single revert of the squash commit:

```bash
git revert --no-edit <squash-sha>
```

No schema migration, no data change, no feature flag. Reverting restores the four original
gaps, so if it is ever needed, revert and re-land rather than leaving it reverted.
