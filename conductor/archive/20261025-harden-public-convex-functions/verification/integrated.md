# Integrated Verification

| Field | Value |
|---|---|
| Track | `20261025-harden-public-convex-functions` |
| Branch | `fix/20261025-harden-public-convex-functions` |
| Base | `main` @ `6d475db55790679499b9af9cdbb72b881785b499` |
| Final commit | `ac87ad2` |
| Date | 2026-10-25 |
| **Result** | **passed** |

Run by the primary agent on the completed branch, after all four phases were verified
individually. This is the whole-track check: the full verification strategy from
`conductor/workflow.md`, not a single phase's gate.

## Layers

| Layer | Command | Exit | Result |
|---|---|---|---|
| Setup | `pnpm install --frozen-lockfile` | 0 | lockfile up to date, `pnpm v12.4.1` |
| Static | `pnpm type-check` | 0 | `tsc --noEmit` clean on TypeScript 7.0.2 |
| Static | `pnpm lint` | 0 | 154 files, **99 warnings, 0 errors** |
| Static | `pnpm format:check` | 0 | 154 files, no fixes applied |
| Unit | `pnpm test` | 0 | **43 passed, 0 failed, 17 files** |
| Unit | `pnpm test:coverage` | 0 | above the ratchet — see below |
| Build | `pnpm build` | 0 | `.output/nitro.json` generated |

The warning count is **99, identical to the count on `main` before this branch**. Nothing
was silenced to reach green, and nothing new was introduced.

## Coverage

| Metric | At track start | Now | Floor |
|---|---|---|---|
| Lines | 3.96% (79/1993) | **6.81%** | 3% |
| Functions | 3.49% (23/659) | **5.44%** | 3% |
| Statements | 3.91% (82/2096) | 6.62% | — |
| Branches | 10.4% (133/1278) | 11.74% | — |

The floor was never touched. Lines nearly doubled because real assertions were written, which
is the ratchet behaving as designed.

## Acceptance criteria

| ID | Criterion | Status | Evidence |
|---|---|---|---|
| AC-1 | `getStats` rejects an anonymous caller; an admin identity still reaches the handler | **Met** | `analytics.getStats.test.ts` — 2 tests: anonymous → `/Unauthorized/i`; admin → resolves `null` (Umami unset). See note below on what the second case does and does not prove. |
| AC-2 | `api.d.ts` no longer exposes `newsletter.listSubscribers`; no hits outside git history | **Met** | `convex/_generated/api.d.ts` contains no `listSubscribers`. The only remaining textual occurrences are inside the regression test that asserts its absence. |
| AC-3 | `sendWelcomeEmail` is `internalAction`; `subscribe` schedules it via `internal.newsletter.sendWelcomeEmail` | **Met** | `newsletter.ts:2` imports `internalAction`, `:66` declares it, `:60` schedules `internal.newsletter.sendWelcomeEmail`. |
| AC-4 | 5 subscribes succeed, the 6th throws "Too many attempts", `rateLimits` holds 5 rows with `action: "newsletter_subscribe"` | **Met** | `newsletter.subscribe.rateLimit.test.ts` — asserts the message, the row count, the identifier, the action string, and that the rejected attempt wrote no row and scheduled no email. |
| AC-5 | `NewsletterForm.tsx` obtains the IP from a `createServerFn` and passes it as `clientIp` | **Met** | `NewsletterForm.tsx:13` defines `getClientIp` via `createServerFn`; `:45` passes `{ email, clientIp }`. |
| AC-6 | At least 5 real Convex assertions; no `expect(true).toBe(true)` anywhere | **Met** | 0 occurrences by grep; the four Convex test files now hold 13 real assertions. |
| AC-7 | Evidence file classifies every exported function by access model | **Met** | `verification/phase-4.md` — all 21 modules, with the audit method. |
| AC-8 | `pnpm build` exits 0 and the analytics widget still renders for a signed-in admin | **Partially met** | Build exits 0. The widget's render path is not exercisable in `jsdom` against a live deployment; the handler signature and return shape are unchanged and an admin identity is proven to reach the handler, so the contract the widget depends on is intact. Flagged rather than claimed. |
| AC-9 | ≥31 passing tests and coverage at or above 3% lines/functions | **Met** | 43 passing (baseline 31); 6.81% lines / 5.44% functions. |

### On AC-1's second case

The admin test resolves `null`, and `null` would also be returned by a handler with no guard
at all — so on its own it does not prove the guard ran. What it does prove is narrower and
still worth having: `requireAdmin` does not reject a legitimate admin, so a regression in the
email lookup or in `ADMIN_EMAIL` parsing fails the suite. The anonymous case is what actually
pins the guard.

## The four gaps this track closed

| Function | Before | After |
|---|---|---|
| `analytics.getStats` | public action, no guard — any caller could spend the owner's Umami credentials | `requireAdmin(ctx)` as the first statement, above the `try` that returns `null` and above the env check |
| `newsletter.listSubscribers` | public query returning every subscriber email | deleted |
| `newsletter.sendWelcomeEmail` | public action — a spam relay spending Resend quota and domain reputation | `internalAction` |
| `newsletter.subscribe` | public by design but unlimited | 5 attempts/hour/IP via the existing `rateLimits` table |

## Tests

The suite went **31 → 43** across the track, with no file deleted and no test skipped.

| Phase | Added | Running total |
|---|---|---|
| Baseline on `main` | — | 31 |
| Phase 1 | 6 (4 guard/limit regressions + 2 harness) | 40 total, 6 failing by design |
| Phase 2 | 0 | 40 total, 2 failing by design |
| Phase 3 | 0 | 40 total, **0 failing** |
| Phase 4 | 2 (placeholder replacement) | 42 total |
| Integrated verification | 1 (`getStats` admin path) | **43 total** |

Phase 1's six failures are the proof this track did something. Each was observed failing
against the unfixed code and recorded with its exact message before any fix was written — a
security test that passes before the fix proves nothing.

## Toolchain end state

Unchanged from the previous track and still consistent:

| Concern | Version |
|---|---|
| Node | 24 (`.nvmrc`, `node:24-alpine`, CI `node-version: 24`) |
| pnpm | 12.4.1 (pinned via `packageManager`) |
| TypeScript | 7.0.2 (native compiler) |
| Biome | 2.6.2 — single linter and formatter |
| Vitest | 5.0.5 with `@vitest/coverage-v8` 5 |
| `convex` | 1.31.2 — **pinned, do not upgrade** (self-hosted backend match) |
| `convex-test` | 0.0.41 — newest whose peer range covers `convex@1.31.2` |

## Blocking defects

**None.**

## Known limitations, recorded deliberately

1. **The IP is transport-trusted.** `getClientIp` reads `x-forwarded-for` / `x-real-ip` from
   the request and the resolved value is then sent by the client to the mutation. A caller
   who bypasses the form can forge it and rotate identities. This is the same trade-off
   `contact.submit` already makes; closing it needs the Convex HTTP layer or a trusted-proxy
   header, and is out of scope here.
2. **The `"unknown"` bucket is shared.** Callers whose IP cannot be resolved all count
   against one bucket, so five unresolved signups globally would block a sixth.
3. **The IP resolver is duplicated** in `src/routes/contact.tsx` and
   `NewsletterForm.tsx`. `src/lib/server/client-ip.ts` is the right home; extracting it
   required editing `contact.tsx`, outside every phase's Touches.
4. **`projects.remove` guards after it writes** — `requireAdmin` runs after `ctx.db.delete`.
   Not exploitable today because Convex mutations are transactional, but it is the only
   guard-last handler in the audit and would become a real gap if the activity log moved to
   `ctx.scheduler.runAfter`. Reported by Phase 4, not fixed (out of spec).
5. **Rate-limit reads are not index-bounded.** Both `contact.submit` and
   `newsletter.subscribe` filter on `timestamp` after an index lookup on
   `(identifier, action)` rather than ranging over the index. Correct at this scale.
6. **`convex-test@0.0.41` does not enforce public/internal visibility.** It will happily call
   an `internalAction`. The `sendWelcomeEmail` test therefore asserts on the `isInternal`
   flag rather than on a rejected call.
