# Phase 2 — Close the authorization gaps

| Field | Value |
| --- | --- |
| Track | `20261025-harden-public-convex-functions` |
| Phase | 2 — Close the authorization gaps |
| Date | 2026-10-25 |
| Branch | `fix/20261025-harden-public-convex-functions` |
| Base commit | `bce66e68e74161cf69e77ad78ac543684be948d8` |
| Head commit | `0d570f7dd113d836ca7850e8716fe7ef56286722` |

## Result

**Verified.** All three unguarded functions are closed and the Phase 1 regression tests
that cover them now pass:

1. `analytics.getStats` calls `await requireAdmin(ctx)` as its first statement.
2. `newsletter.listSubscribers` is deleted — not guarded, removed.
3. `newsletter.sendWelcomeEmail` is an `internalAction`; `subscribe` schedules it through
   `internal.newsletter.sendWelcomeEmail`.

`pnpm test` drops from **6 failures / 34 passing** to **2 failures / 38 passing**. The two
remaining failures are the Phase 3 rate-limit pair in
`newsletter.subscribe.rateLimit.test.ts`, which need the `clientIp` argument and the limit
that Phase 3 adds. That is expected and is this phase's gate: the six failures reduced to
exactly two, and the other four pass. `pnpm type-check`, `pnpm lint`, and
`pnpm format:check` all exit 0.

## Before / after

| Function | Export before | After | Test that flipped | Failure before → after |
| --- | --- | --- | --- | --- |
| `analytics.getStats` | `action({ … handler: async (_ctx, …) })` — no guard, anonymous callers received visitor stats and the action spent the owner's Umami credentials on their behalf | `action` with `await requireAdmin(ctx)` as the first statement, above the `try` and above the Umami env check; `_ctx` renamed `ctx` | `analytics.getStats.test.ts` → "rejects a caller without an identity" | `expected 'resolved' to match /Unauthorized/i` → **passes** |
| `newsletter.listSubscribers` | `query({ args: {}, handler: … })` — returned every subscriber's email to any caller | **deleted**; the module no longer exports it | `newsletter.listSubscribers.test.ts` → "is no longer exported by the newsletter module" | `expected true to be false` → **passes** |
| `newsletter.listSubscribers` | — | — | `newsletter.listSubscribers.test.ts` → "cannot be invoked through the public API" | `promise resolved "[]" instead of rejecting` → **passes** |
| `newsletter.sendWelcomeEmail` | `action({ … })` — any anonymous caller could send mail from `newsletter@ansyar-world.top` and spend the Resend quota | `internalAction({ … })`, still exported and still callable by `subscribe` | `newsletter.sendWelcomeEmail.test.ts` → "is not exposed as a public action" | `expected true to be false` on `isPublic` → **passes** |
| `newsletter.subscribe` | `mutation`, no rate limit | **unchanged** — deliberately out of scope for this phase | `newsletter.subscribe.rateLimit.test.ts` → both tests | still fail; Phase 3 |

### Why the guard sits where it does

`requireAdmin` is the first statement of the handler, **before** the `try` block and
**before** the Umami env-var check. Both reasons are load-bearing and both are stated in
the brief:

1. The handler wraps everything in `try`/`catch` that returns `null` on any error. A guard
   call inside that `try` would have its throw swallowed, the handler would still return
   `null`, and the test would have stayed red.
2. The env check returns `null` when Umami is unconfigured. If an anonymous caller could
   reach that branch they would learn whether analytics is configured. Guard first, then
   check env vars.

The real helper is used, not a hand-rolled identity check. `requireAdmin` resolves the
email through `internal.admin.getUserEmail` when the identity carries no email claim, so
it works in an action context with no extra plumbing. The action signature and return type
are unchanged, so `AnalyticsWidget` needs no edit.

### `sendWelcomeEmail`: visibility, not removal

The action is converted, not deleted. `subscribe` still delivers the welcome email, now via
`internal.newsletter.sendWelcomeEmail`. The test file asserts both halves — that `isPublic`
is absent and `isInternal` is present, *and* that the export still exists and is still
invocable — so this phase cannot satisfy it by deleting the function.

The `api` import in `convex/newsletter.ts` became unused once the scheduler call moved to
`internal`, so it was replaced with `import { internal } from "./_generated/api"` rather
than left to trip the linter. The `query` import likewise became unused when
`listSubscribers` was deleted, so it was dropped from `./_generated/server`.

## Regeneration outcome

`npx convex dev --once` ran successfully against a reachable deployment:

```
- Preparing Convex functions...
✔ 21:15:51 Convex functions ready! (11.13s)
```

**It produced no diff under `convex/_generated/`.** That is correct, not a skipped step.
`convex/_generated/api.d.ts` does not enumerate function names: it imports each module
(`import type * as newsletter from "../newsletter.js"`) and derives the surface with
`FilterApi<typeof fullApi, FunctionReference<any, "public">>`. Deleting `listSubscribers`
and changing `sendWelcomeEmail`'s visibility therefore change the *module type* that the
generated file points at, not the generated file's own text. Confirmed by reading
`convex/_generated/api.d.ts` after the run: no `listSubscribers` member, and none before
either.

This also refines AC-2 as written. The criterion says `api.d.ts` "no longer exposes
`newsletter.listSubscribers`". It never exposed it by name, so the observable form of the
criterion is the two things the tests assert: the module export is gone, and the
deployment path no longer resolves. Both hold. The generated files were never hand-edited.

## Commands

Each run separately, never chained.

| Command | Exit | Result |
| --- | --- | --- |
| `pnpm type-check` | 0 | No output (TypeScript 7.0.2). |
| `pnpm lint` | 0 | 154 files, 99 warnings, 0 errors — identical to the entering baseline. |
| `pnpm format:check` | 0 | 154 files, no fixes needed, 99 warnings. |
| `pnpm test` | **1** | 16 passed files / 38 passed tests; **1 failed file / 2 failed tests**. |
| `npx convex dev --once` | 0 | `Convex functions ready! (11.13s)`; no diff under `convex/_generated/`. |

### The two remaining failures are expected

Both are in `convex/__tests__/newsletter.subscribe.rateLimit.test.ts`:

- "rejects the sixth attempt from one IP within an hour" — `expected […(5)] to deeply equal
  ['ok','ok','ok','ok','ok']`, receiving `Validator error: Unexpected field \`clientIp\` in
  object` five times.
- "records every allowed attempt and rejects the sixth with no side effects" — the same
  validator error; `rateLimits` is empty.

They fail because `subscribe` does not yet accept a `clientIp` argument and has no rate
limit. **That is Phase 3's work.** The rate limit and the `clientIp` argument were
deliberately not added here: doing so would have blurred two independently verifiable
phases, and the tests were written against the post-Phase-3 contract precisely so they
pass unchanged once Phase 3 lands.

## No `src/` reference to `listSubscribers` remains

`grep listSubscribers src/` → **no matches.** The function had no UI caller, which is why
deleting was correct rather than guarding.

`grep listSubscribers convex/` → 4 matches, all in
`convex/__tests__/newsletter.listSubscribers.test.ts`, which asserts the symbol's absence
(the `makeFunctionReference("newsletter:listSubscribers")` path, the `describe` name, the
`Object.hasOwn` assertion, and the rejection assertion). Those are the regression guard, not
a dependency.

## Deviations

None. Every change stayed inside `Touches` (`convex/analytics.ts`, `convex/newsletter.ts`,
`convex/_generated/**`), and `convex/_generated/**` needed no edit because the
regeneration was a genuine no-op.

## Notes

- **`listSubscribers` returns with auth when the admin screen is built.** The subscriber
  admin screen is a future track, explicitly out of scope here. The query can come back as
  a `requireAdmin`-guarded query at that point; it is deleted now because an unguarded
  subscriber list is a live leak of other people's personal data.
- **`subscribe` remains unguarded and unlimited** until Phase 3. It is public by design;
  the gap is the missing rate limit, not a missing identity check.
- **`convex-test@0.0.41` does not enforce public/internal visibility.** That is why the
  `sendWelcomeEmail` test asserts the `isPublic`/`isInternal` properties rather than
  expecting a rejected call. The test was not "fixed" to expect a rejection it cannot
  observe.
- **Warning count is unchanged at 99.** None of the pre-existing warnings are in the two
  files this phase touched, so no new lint debt was introduced and none was cleared —
  clearing adjacent warnings would have been scope creep.
- `maxWorkers: 4` in `vite.config.ts` was left alone. The suite ran in 7.50s.

## Primary verification

Appended by the primary agent after independently re-running the gate at `a322ea6`.
Timestamp: 2026-10-25T21:19:01+11:00.

### The gate is partially green, and that is the design

Phase 2 cannot reach a fully green suite: two tests in
`newsletter.subscribe.rateLimit.test.ts` call `subscribe` with a `clientIp` argument
that does not exist until Phase 3, so they fail at the Convex validator. The phase's stated
success criterion was that the **six** Phase 1 failures drop to **exactly two** — the
rate-limit pair — with everything else passing. That is what happened.

| Command | Exit | Result |
|---|---|---|
| `pnpm type-check` | 0 | `tsc --noEmit` clean on TypeScript 7.0.2 |
| `pnpm lint` | 0 | 154 files, 99 warnings, 0 errors — identical to the entering baseline |
| `pnpm format:check` | 0 | 154 files, no fixes applied |
| `pnpm test` | **1** | **2 failed, 38 passed (40 tests across 17 files)** — the two expected rate-limit failures |

### Failure movement

| | Before (Phase 1) | After (Phase 2) |
|---|---|---|
| Failing tests | 6 | **2** |
| Passing tests | 34 | **38** |
| Failing files | 4 | **1** |

Four tests flipped from red to green, and no new failure appeared. The two that remain are
the same two that were always going to remain.

### The two remaining failures are unchanged, not new

Re-ran the rate-limit file alone and read the assertion output. Both tests still fail with
the identical message they produced in Phase 1:

```
AssertionError: expected [ …(5) ] to deeply equal [ 'ok', 'ok', 'ok', 'ok', 'ok' ]
+   "Validator error: Unexpected field clientIp in object",
+   "Validator error: Unexpected field clientIp in object",
+   "Validator error: Unexpected field clientIp in object",
```

This matters: it proves the two failures are the *absent Phase 3 feature*, not collateral
damage from the Phase 2 changes. `subscribe` was deliberately left untouched — still no
`clientIp` argument, still no rate limit.

### Independent review of the three fixes

Read the diff of both files rather than trusting the report.

**`analytics.getStats`** — `await requireAdmin(ctx);` is the first statement of the
handler, with a comment explaining both reasons it must sit there. It is above the
`try`/`catch` that returns `null` (which would otherwise swallow the rejection and
leave the test red) and above the Umami env-var check (which would otherwise leak whether
analytics is configured to an anonymous caller). `_ctx` was renamed to `ctx`. The
action's signature and return shape are untouched, so `AnalyticsWidget` is unaffected.

**`listSubscribers`** — deleted outright, including the `// Only admin should call this`
comment that had been sitting there unactioned. `query` was dropped from the
`_generated/server` import as a consequence. Confirmed by grep that no `src/` reference
remains.

**`sendWelcomeEmail`** — `action` → `internalAction`; the scheduler call in
`subscribe` now targets `internal.newsletter.sendWelcomeEmail`; the `api` import was
replaced by `internal`. The action body is unchanged, so welcome emails still send — only
the caller's reach changed.

### Regeneration was a genuine no-op

`npx convex dev --once` succeeded against a reachable deployment (`Convex functions
ready! 11.13s`) and produced **no diff** under `convex/_generated/`. That is correct
rather than suspicious: `api.d.ts` derives the surface through `FilterApi<typeof
fullApi, …>` and imports each module by reference, so it never enumerated function names.
Deleting a function changes the referenced module's type, not the generated text. Nothing
under `convex/_generated/` was hand-edited.

This also means AC-2's observable form is what the Phase 1 test already asserts — the
module export is gone *and* the deployment path no longer resolves — rather than a diff in
generated code.

### Acceptance

- FR-1 (`getStats` guarded) — met; test passes.
- FR-2 (`listSubscribers` gone) — met; both tests pass.
- FR-3 (`sendWelcomeEmail` internal) — met; both tests pass.
- AC-1, AC-2, AC-3 — met.
- No new lint warnings; warning count identical at 99.
- `maxWorkers: 4` respected; suite ran in 7.50s.

**Result: verified.** Phase 3 is the only thing standing between this branch and a green
suite.
