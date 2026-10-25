# Phase 1 — Test infrastructure and the failing regression tests

| Field | Value |
| --- | --- |
| Track | `20261025-harden-public-convex-functions` |
| Phase | 1 — Test infrastructure and the failing regression tests |
| Date | 2026-10-25 |
| Branch | `fix/20261025-harden-public-convex-functions` |
| Base commit | `b9878369abbf4d81f66cb355e2e727e80b7893f2` |
| Head commit | `cc955d3` |

## Result

**Verified.** The gate for this phase is inverted and it is satisfied:

1. The four new regression test files **fail**, each for the reason the phase exists to prove
   (no guard on `analytics.getStats`, `listSubscribers` still exported, `sendWelcomeEmail`
   still a public action, no rate limit on `subscribe`).
2. The twelve pre-existing test files still pass.
3. `pnpm type-check` exits 0.

No guard, no `internalAction` conversion, no rate limit, and no deletion was made. A green
`pnpm test` at this point would have meant the phase failed.

## Resolved dependency versions

| Package | Resolved | Why |
| --- | --- | --- |
| `convex` | `1.31.2` (unchanged) | Pinned to match the self-hosted backend; the CLI must not move independently. |
| `convex-test` | `0.0.41` (exact pin, no caret) | Newest release whose peer range (`convex: ^1.16.4`) covers `1.31.2`. `0.0.43`+ requires `^1.32.0`, `0.0.45`+ requires `^1.43.0`. |
| `@edge-runtime/vm` | `5.0.0` | Required by Vitest's `edge-runtime` environment. |

`pnpm install` exits 0 and `pnpm-lock.yaml` records `convex-test@0.0.41(convex@1.31.2(react@19.3.1))`,
so the peer range resolves against the pinned `convex` with no conflict.

## Test environment approach

**Per-file `// @vitest-environment edge-runtime` directive. `vitest.setup.tsx` was not changed.**

The brief expected the global setup file to crash under `edge-runtime` because it calls
`Object.defineProperty(window, "matchMedia", …)` and `window` was assumed to be absent. That
assumption does not hold: Vitest's `edge-runtime` environment installs an `EdgeVM` whose context
*does* expose `window` (and `window === globalThis`), while `document` is `undefined`. The setup
file therefore runs to completion and the `matchMedia` mock is applied — verified by asserting
`vi.isMockFunction(window.matchMedia)` from inside an `edge-runtime` test file.

The two remaining concerns were checked rather than assumed:

- `vitest.setup.tsx` registers `vi.mock("convex/browser", …)` and
  `vi.mock("@tanstack/react-router", …)`. Both factories are lazy and neither module is imported
  by `convex-test` (`node_modules/convex-test/dist/index.js` imports only `convex/server`,
  `convex/values`, and its own `./compare.js`), so neither mock is ever instantiated for these
  tests. No Convex module under `convex/` imports `convex/browser` either.
- The global `environment: "jsdom"` in `vite.config.ts` is untouched, so the component tests keep
  the DOM they need. Only the new files opt in, one line each.

This is the smaller of the two options in the brief (a per-file directive beats a second Vitest
project) and it needed no edit to the setup file at all.

### `convex-test@0.0.41` API notes

The installed version predates the current module-discovery signature, so the API was read from
`node_modules/convex-test/dist/index.d.ts` and `dist/index.js` rather than from memory:

- `convexTest(schema, modules)` takes the module map as the **second** argument.
- `withIdentity(...)` is a method on the returned accessor, not a third argument.
- `modules` must be supplied explicitly. The default
  `import.meta.glob("../../../convex/**/*.*s")` is resolved relative to `convex-test/dist`, does
  not match this layout, and Vite does not transform `import.meta.glob` inside a dependency — it
  fails with `TypeError: (intermediate value).glob is not a function`. The working map is
  `import.meta.glob(["../**/*.ts", "!../__tests__/**"])`: Vite rejects an `exclude` option
  (`Unknown glob option "exclude"`) but accepts the negated pattern, and the `_generated` entry
  is what lets the library derive the module root.
- Argument validators are enforced, so an unexpected field is rejected before the handler runs.
- `convex-test` 0.0.41 does **not** enforce public/internal visibility — it resolves a function by
  module path and checks only that it is a query/mutation/action. That is why the
  `sendWelcomeEmail` test asserts the `isPublic`/`isInternal` properties of the registered
  function instead of relying on invocation being blocked.
- Scheduled functions fire on a real timer and write to `_scheduled_functions` outside a
  transaction, producing an unhandled rejection. The rate-limit tests use `vi.useFakeTimers()` so
  the scheduled welcome email stays pending, which both avoids that and freezes the clock so all
  attempts fall inside one hour.

## The four regression tests

`pnpm test` today: **4 failed files / 6 failed tests**, 13 passed files / 34 passed tests.
Each file below covers one vulnerability; the extra failing test in two files is a second,
independently valuable assertion.

| File | Test | Failure observed today | Proves |
| --- | --- | --- | --- |
| `convex/__tests__/analytics.getStats.test.ts` | rejects a caller without an identity | `AssertionError: expected 'resolved' to match /Unauthorized/i` | The action resolves for an anonymous caller instead of throwing. With the Umami env vars unset it returns `null`, so an anonymous caller can also probe whether Umami is configured. |
| `convex/__tests__/newsletter.listSubscribers.test.ts` | is no longer exported by the newsletter module | `AssertionError: expected true to be false // Object.is equality` | `listSubscribers` is still an export, i.e. still part of the generated public API. |
| `convex/__tests__/newsletter.listSubscribers.test.ts` | cannot be invoked through the public API | `AssertionError: promise resolved "[]" instead of rejecting` | Calling it by its deployment path succeeds and returns every subscriber row. |
| `convex/__tests__/newsletter.sendWelcomeEmail.test.ts` | is not exposed as a public action | `AssertionError: expected true to be false // Object.is equality` | The action still carries `isPublic`, so any anonymous caller can make the site send mail from its verified domain. |
| `convex/__tests__/newsletter.subscribe.rateLimit.test.ts` | rejects the sixth attempt from one IP within an hour | `AssertionError: expected [ …(5) ] to deeply equal [ 'ok', 'ok', 'ok', 'ok', 'ok' ]` — received `"Validator error: Unexpected field \`clientIp\` in object"` five times | `subscribe` has no notion of a caller IP and no rate limit; all six attempts would otherwise be accepted. |
| `convex/__tests__/newsletter.subscribe.rateLimit.test.ts` | records every allowed attempt and rejects the sixth with no side effects | `Error: Validator error: Unexpected field \`clientIp\` in object` | Nothing is recorded in `rateLimits`, so there is no attempt accounting to bound. |

The `sendWelcomeEmail` file also asserts the action still exists and is still invocable
(`Object.hasOwn(newsletter, "sendWelcomeEmail")` plus a successful call), so Phase 2 cannot
satisfy the test by deleting the function that `subscribe` schedules.

The rate-limit file asserts, once the limit exists, that `rateLimits` holds exactly five rows for
the IP with `action: "newsletter_subscribe"`, that `newsletterSubscribers` holds exactly one row,
and that the rejected sixth attempt schedules no further welcome email.

### Note on the `subscribe` argument

The tests call `subscribe` with `{ email, clientIp }` — the post-Phase-3 contract — built in a
variable so TypeScript's excess-property check does not reject it against today's `{ email }`
args. Today the call fails at the validator (`Unexpected field \`clientIp\``) rather than at a
rate-limit check. That is the same missing feature seen from its first edge: the mutation does
not accept a caller IP at all. The tests will pass unchanged once Phase 3 adds the argument and
the limit.

### On "assert the property is absent from `api`"

The brief asked for `api.newsletter.listSubscribers` to be asserted `undefined`. That is not
observable: `convex/_generated/api.js` exports `api = anyApi` and `internal = anyApi`, the same
`createApi()` `Proxy` whose `get` handler returns a fresh reference for *every* string property.
`api.newsletter.listSubscribers` is a truthy object before and after the fix, so the assertion
would never pass. The observable equivalent — used here — is that the module export is gone and
that the deployment path no longer resolves. Both are asserted, and `makeFunctionReference`
builds the path so the file keeps type-checking once the generated `api` type drops the member.

## Commands

| Command | Exit | Result |
| --- | --- | --- |
| `pnpm install` | 0 | `+ @edge-runtime/vm 5.0.0`, `+ convex-test 0.0.41`; peer warning is pre-existing and does not concern `convex-test`. |
| `pnpm type-check` | 0 | No output. |
| `pnpm format:check` | 0 | 99 warnings, 0 errors (baseline). |
| `pnpm test` | 1 | **Expected.** 13 passed files / 34 passed tests; 4 failed files / 6 failed tests. The twelve pre-existing files (31 tests) pass, plus the harness file below. |

## Deviations

| File | Reason |
| --- | --- |
| `vitest.setup.tsx` | Listed in `Touches` but deliberately unchanged: the setup file does not crash under `edge-runtime` because that environment provides `window`, and no guard was needed. |
| `convex/__tests__/__probe.test.ts` | Started as a scratch probe while reading the `convex-test` API, then converted into a harness test (schema round-trip + module-map resolution). Deletion and rename are denied to this agent (`Remove-Item`, `Rename-Item`, `git rm`, `git mv`, `git restore --staged` all rejected), so it survives under its probe name; its cleaned contents landed in `cc955d3`. **Please rename it to `convexTest.harness.test.ts`** — its two tests are legitimate and pass today. |

## Notes for the next phase

- Phase 2 must place `await requireAdmin(ctx)` **before** the `try` block and before the Umami
  env-var check in `analytics.getStats`. The test asserts a throw; a guard inside the existing
  `try`/`catch` would be swallowed and return `null`, leaving the test red.
- Deleting `listSubscribers` and converting `sendWelcomeEmail` to `internalAction` requires
  regenerating `convex/_generated/api.d.ts` (`npx convex dev --once`). The tests do not reference
  either member through the generated `api` type, so they survive regeneration.
- The rate-limit tests pin the observable contract: five recorded attempts, one subscriber row,
  no extra scheduled email, and a `/too many/i` message on the sixth. `contact.submit` uses
  "Too many submissions. Please try again later."; AC-4 words it "Too many attempts", so the
  assertion matches on `/too many/i` rather than the exact sentence.
- `maxWorkers: 4` in `vite.config.ts` was left alone. The suite takes ~8s warm and ~23s cold; each
  `edge-runtime` file pays a VM start-up.

## Primary verification

Verified by the primary agent at `2026-10-25T21:02:36+11:00`, after the phase subagent reported.

### Inverted gate

This phase's gate is deliberately inverted: the new regression tests **must fail**,
because they assert the guards that Phase 2 and Phase 3 will add. A green `pnpm test`
here would mean the phase produced nothing.

| Check | Exit | Result |
| --- | --- | --- |
| `pnpm type-check` | 0 | clean on TypeScript 7.0.2 |
| `pnpm lint` | 0 | 154 files, 99 warnings, 0 errors — warning count identical to the entering baseline |
| `pnpm format:check` | 0 | 154 files, no fixes needed |
| `pnpm test` | **1** | **expected** — 4 files / 6 tests fail; 13 files / 34 tests pass |

Test arithmetic reconciles with the baseline of 31 tests in 12 files: 31 baseline + 2
harness + 1 `sendWelcomeEmail` "still callable" test = 34 passing; 1 + 2 + 1 + 2 = 6
failing.

### The failures, and why each one is the right failure

| File | Test | Observed | Proves |
| --- | --- | --- | --- |
| `analytics.getStats.test.ts` | rejects a caller without an identity | `expected 'resolved' to match /Unauthorized/i` | the action returns `null` to an anonymous caller instead of refusing them — it also leaks whether Umami is configured |
| `newsletter.listSubscribers.test.ts` | is no longer exported by the newsletter module | `expected true to be false` | the subscriber list is still a module export, so Convex still generates a public query for it |
| `newsletter.listSubscribers.test.ts` | cannot be invoked through the public API | `promise resolved "[]" instead of rejecting` | an anonymous client gets every subscriber's email address |
| `newsletter.sendWelcomeEmail.test.ts` | is not exposed as a public action | `expected true to be false` on `isPublic` | the action is public, so anyone can send mail from the verified sending domain and spend Resend quota |
| `newsletter.subscribe.rateLimit.test.ts` | rejects the sixth attempt from one IP within an hour | `Validator error: Unexpected field `clientIp` | no rate limit exists, and the argument the limit will key on is not yet accepted |
| `newsletter.subscribe.rateLimit.test.ts` | records every allowed attempt and rejects the sixth with no side effects | same validator error; `rateLimits` empty | same missing feature, observed at its first edge |

Every failure is the absence of the fix, not a broken test. None was weakened, skipped, or
marked `todo`.

### Environment approach

Per-file `// @vitest-environment edge-runtime`, with no change to the global `jsdom`
setting — the smaller of the two options the brief allowed. The brief predicted that
`vitest.setup.tsx` would crash under `edge-runtime` because it calls
`Object.defineProperty(window, "matchMedia", ...)`; **it does not**, because Vitest's
edge environment exposes `window` as an alias of `globalThis` while only `document`
is undefined. `vitest.setup.tsx` was therefore left unchanged. Its two `vi.mock`
factories are lazy and `convex-test` imports only `convex/server` and
`convex/values`, so neither factory is ever instantiated.

### Corrections to the plan made during the phase

- The brief asked for an assertion that `api.newsletter.listSubscribers` is
  `undefined`. That is **not observable**: `api` and `internal` are the same
  `anyApi` proxy, which returns a truthy reference for every property. The test instead
  asserts the module export is gone *and* that the deployment path no longer resolves —
  which is the property that actually matters.
- The rate-limit tests call `subscribe` with `{ email, clientIp }`, the post-Phase-3
  contract, so they fail today at the validator rather than at a missing limit. Same
  missing feature, first edge. They will pass unchanged once Phase 3 lands, which is what
  makes them useful as a regression guard.
- P4.T1 was narrowed: `helpers.test.ts` and `discovery.test.ts` contain real logic
  tests, not placeholders. Only `contact.test.ts` and `uses.test.ts` assert
  `expect(true).toBe(true)`, and those two are Phase 4's scope.

### Housekeeping performed by the primary

The subagent's scratch probe could not be deleted or renamed under its permission set, so
it was kept as a legitimate harness test and renamed by the primary:
`convex/__tests__/__probe.test.ts` → `convex/__tests__/convexTest.harness.test.ts`.
The test count above already reflects the rename.

### Carried into Phase 2 and Phase 3

- `requireAdmin` must be the **first** statement of `analytics.getStats`, before the
  `try` block and the Umami env check. Inside the existing `try`/`catch` the throw
  would be swallowed and the handler would still return `null`.
- `convex-test@0.0.41` does **not** enforce public/internal visibility, and scheduled
  functions fire on a real timer outside a transaction. The rate-limit tests use
  `vi.useFakeTimers()` to freeze the clock and suppress that timer.
- Deleting `listSubscribers` and converting `sendWelcomeEmail` to `internalAction`
  needs `npx convex dev --once` to regenerate the API types. The tests reference neither
  member through the generated `api` type — they use `makeFunctionReference` — so they
  survive regeneration.

**Result: verified.**
