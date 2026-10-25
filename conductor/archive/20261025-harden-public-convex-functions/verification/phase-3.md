# Phase 3 — Rate-limit newsletter subscribe

| Field | Value |
| --- | --- |
| Track | `20261025-harden-public-convex-functions` |
| Phase | 3 — Rate-limit newsletter subscribe |
| Date | 2026-10-25 |
| Branch | `fix/20261025-harden-public-convex-functions` |
| Base commit | `fe161f24ff18a3811ce9f5881649ecb0048352b6` |
| Head commit | `221e996dcc921aede6cc6708bc950f6b1d0bb969` |

## Result

**Verified.** `newsletter.subscribe` now rejects the sixth attempt within an hour from one
IP, records every allowed attempt in `rateLimits` under `action: "newsletter_subscribe"`,
and the form resolves the caller's address server-side and passes it as `clientIp`.

`pnpm test` exits **0** with **40 passed, 0 failed** across 17 files. This is the first
fully green suite on this branch: the two Phase 1 rate-limit failures that Phase 2
deliberately left standing are now passing, and nothing else moved.

## The ordering of `subscribe`

1. Validate the email (`!email.includes("@")` → throw).
2. **Rate-limit check** — count `rateLimits` rows for `(clientIp, "newsletter_subscribe")`
   newer than one hour; throw `"Too many attempts. Please try again later."` at 5 or more.
3. **Insert the `rateLimits` row** for this allowed attempt.
4. Look up `newsletterSubscribers` by email, then insert or patch — including the
   `alreadySubscribed: true` early return.
5. Schedule `internal.newsletter.sendWelcomeEmail`.
6. Return `{ success: true, alreadySubscribed: false }`.

**Why the rate-limit insert sits before the existing-subscriber early return:** a caller
who hammers one address they have already subscribed to never reaches the subscriber
write, so if the attempt were logged after that early return those calls would be free and
the limit would be trivially bypassed. Logging first means every attempt counts regardless
of which branch the subscriber state takes. The test depends on exactly this — it
subscribes the same email five times and expects five `rateLimits` rows with one subscriber
row.

The rejected path is clean by construction: the throw at step 2 happens before any insert
and before the scheduler call, so a blocked attempt leaves `rateLimits` at 5,
`newsletterSubscribers` at 1, and `_scheduled_functions` unchanged.

## `clientIp` resolution

**Where it lives:** a `createServerFn({ method: "GET" })` named `getClientIp` inside
`src/components/features/NewsletterForm.tsx`. It reads `x-forwarded-for` (Traefik puts the
client first, so the value is split on `,` and the first entry trimmed) and falls back to
`x-real-ip`.

**What it does when headers are absent:** `getRequest()` returning nothing, or neither
header being present, yields the literal string `"unknown"`. The resolver call is also
wrapped in `try`/`catch` in `handleSubmit` — a resolver failure falls back to `"unknown"`
and the signup proceeds. A newsletter form that stops working because a proxy header is
missing would be a worse bug than a shared rate-limit bucket.

**Known limitation — the shared `"unknown"` bucket.** Every caller whose IP cannot be
resolved shares one bucket, so five unresolved signups from anywhere in the world would
block a sixth. This is the same trade-off `contact.submit` already makes, and it is
accepted here for consistency rather than fixed: a correct fix needs a trusted-proxy
configuration, not a code change in this component.

`clientIp` is a **required** `v.string()`, not `v.optional(...)`. An optional argument would
let a caller omit the field and bypass the limit entirely.

## Commands

| Command | Exit | Result |
| --- | --- | --- |
| `pnpm type-check` | 0 | `tsc --noEmit` clean, no output. |
| `pnpm lint` | 0 | 154 files checked, 99 warnings, 0 errors — identical to the entering baseline. |
| `pnpm format:check` | 0 | 154 files, no fixes applied, 99 warnings. |
| `pnpm test` | **0** | **17 passed files / 40 passed tests, 0 failed.** Duration 7.68s. |

Each command was run separately, never chained.

The suite count is the confirmation that the rate-limit behaviour is correct: Phase 2
ended at **38 passing / 2 failed** (40 total), and this phase ends at **40 passing / 0
failed**. The two that flipped are exactly the pair in
`newsletter.subscribe.rateLimit.test.ts`, and the second of them asserts the
`rateLimits` row count, identifiers, action string, subscriber count, and scheduled-call
count directly — so a green run *is* the proof that the table holds exactly 5 rows for the
IP.

## Before / after — the two rate-limit tests

| Test | Before (Phase 2) | After |
| --- | --- | --- |
| `newsletter.subscribe.rateLimit.test.ts` → "rejects the sixth attempt from one IP within an hour" | `AssertionError: expected [ …(5) ] to deeply equal [ 'ok', 'ok', 'ok', 'ok', 'ok' ]`, receiving `Validator error: Unexpected field \`clientIp\` in object` five times | **passes** |
| `newsletter.subscribe.rateLimit.test.ts` → "records every allowed attempt and rejects the sixth with no side effects" | `Error: Validator error: Unexpected field \`clientIp\` in object`; `rateLimits` empty | **passes** |

Both failed at the validator because the argument did not exist; both now pass on the
unchanged test file. No test was edited in this phase.

## Deviations

None. Every change stayed inside `Touches`:

- `convex/newsletter.ts` — the `clientIp` argument and the rate-limit block.
- `src/components/features/NewsletterForm.tsx` — the resolver, the try/catch fallback, and
  the argument pass-through.

`src/components/features/NewsletterForm.css` was **not** touched: the markup did not
change, so nothing in the stylesheet needed to. `convex/_generated/**` was not touched or
regenerated — the argument change is inside an existing function, so the generated API
surface is unaffected (Phase 2 established the same property for a function deletion).

`src/routes/contact.tsx` was **not** edited.

## Notes

- **Follow-up: the IP resolver is duplicated.** `getClientIp` now exists verbatim in both
  `src/routes/contact.tsx` (lines 16-26) and
  `src/components/features/NewsletterForm.tsx`. The right shape is a shared
  `src/lib/server/client-ip.ts` imported by both, but extracting it means editing
  `contact.tsx`, which is outside this phase's `Touches`. Worth doing as a small
  standalone refactor — the two copies must not be allowed to drift, because a
  divergence in header precedence would silently split the rate-limit buckets.
- **`subscribe` did not gain an auth check**, and should not. It is public by design; the
  gap was the missing rate limit, not a missing identity. `requireAdmin` was deliberately
  not applied here, unlike the three functions Phase 2 closed.
- **The `rateLimits` schema was not changed.** `by_identifier_action` already existed and
  `action` is a free-form string, so `"newsletter_subscribe"` needed no schema or index
  work.
- **The limit is 5 per hour, not 3.** `contact.submit` uses 3; the spec (FR-4) and the test
  both specify 5 for subscribe, so the two limits intentionally differ.
- **Lint warning count is unchanged at 99.** Neither touched file carries a warning, so no
  new debt was introduced and none was cleared — clearing adjacent warnings would have
  been scope creep.
- **No `// biome-ignore` comments were added**, and no `as` cast or non-null assertion was
  introduced; the resolver returns `string` on every path.
- `maxWorkers: 4` in `vite.config.ts` was left alone. The suite ran in 7.68s.
- `vi.useFakeTimers()` in the test file was left in place — it is what keeps all six
  attempts inside the same hour and stops the scheduled welcome email from firing outside
  a transaction.

## Acceptance

- FR-4 (6th attempt rejected, each attempt recorded with `action: "newsletter_subscribe"`)
  — met; both rate-limit tests pass.
- FR-5 (form obtains the IP from a `createServerFn` and passes `clientIp`) — met.
- AC-4, AC-5 — met.
- No new lint warnings; warning count identical at 99.
- `pnpm test` exits 0 for the first time on this branch.

**Result: verified.**

## Primary verification

Appended by the primary agent after independently re-running the gate at `7ef0d3b`.
Timestamp: 2026-10-25T22:23:16+11:00.

### First fully green suite on this branch

| Command | Exit | Result |
|---|---|---|
| `pnpm type-check` | 0 | `tsc --noEmit` clean on TypeScript 7.0.2 |
| `pnpm lint` | 0 | 154 files, 99 warnings, 0 errors — identical to the entering baseline |
| `pnpm format:check` | 0 | 154 files, no fixes applied |
| `pnpm test` | **0** | **40 passed, 0 failed, 17 files** |
| `pnpm test:coverage` | 0 | above the 3% ratchet |

### The six failures are closed

| Phase | Failing | Passing | Suite |
|---|---|---|---|
| Entering (Phase 1) | 6 | 34 | red |
| After Phase 2 | 2 | 38 | red |
| **After Phase 3** | **0** | **40** | **green** |

Every one of the four guard tests and both rate-limit tests now passes. No test was
deleted, skipped, or weakened to get here — the count only ever rose.

### Independent review of the implementation

Read the diff rather than trusting the report.

**The rate limit is correctly ordered.** The sequence in `subscribe` is: validate the
email → count `rateLimits` for `(clientIp, "newsletter_subscribe")` newer than an hour →
throw at 5 → **insert the attempt row** → existing-subscriber lookup → schedule email →
return. The insert deliberately precedes the `alreadySubscribed` early return, with a
comment saying so. That matters: without it, a caller could repeatedly hit an address that
is already subscribed and never accrue an attempt, using the early return as a bypass. The
test subscribes the same email five times and expects five rows, so this ordering is load-
bearing rather than stylistic.

**`clientIp` is required, not optional.** `args: { email: v.string(), clientIp:
v.string() }`. An optional argument would let a caller omit it and sidestep the limit
entirely — the rate limit would be decorative.

**The error message matches the register of the existing one.** `"Too many attempts.
Please try again later."` against `contact.ts`'s `"Too many submissions. Please try
again later."` The test matches `/too many/i`, so the wording was a free choice and this
was the right one.

**IP resolution degrades rather than breaks.** `getClientIp` mirrors `contact.tsx`
exactly (`x-forwarded-for` first entry, then `x-real-ip`, else `"unknown"`) and is
wrapped in its own `try`/`catch` inside the submit handler, falling back to
`"unknown"`. A missing header does not stop a signup.

**No auth check was added to `subscribe`.** It is public by design; the defect was the
missing limit, not a missing identity. Confirmed the function still has no
`requireAdmin`.

### Coverage rose, and the ratchet is intact

`pnpm test:coverage` reports **5.37% lines** (108/2010) and **4.68% functions** (31/661),
up from 3.96% and 3.49% at the start of the track. The gate is a ratchet at 3% / 3%, so the
floor is unchanged and the project is now comfortably above it. This is the ratchet working
as designed — real tests moved the number, nothing was lowered.

### Acceptance

- FR-4 (rate limit at 5/hour/IP) — met; both rate-limit tests pass.
- FR-5 (server-resolved IP) — met; `getClientIp` added, degrades to `"unknown"`.
- AC-4, AC-5 — met.
- No new lint warnings; count identical at 99.
- `maxWorkers: 4` respected.

### Known limitations, carried forward deliberately

- **The duplicated IP resolver.** `getClientIp` now exists in both
  `src/routes/contact.tsx` and `src/components/features/NewsletterForm.tsx`. Extracting
  `src/lib/server/client-ip.ts` is the right fix and needs editing `contact.tsx`, which
  was outside this phase's Touches. Recorded as follow-up debt, not silently accepted.
- **The `"unknown"` bucket is shared.** Callers whose IP cannot be resolved all count
  against one bucket, so five unresolved signups globally would block a sixth. This is the
  same trade-off `contact.submit` already makes, and closing it properly needs the Convex
  HTTP layer or a trusted-proxy header rather than client-transported values.

**Result: verified.** Phase 4 is the last one: replace the remaining placeholder tests and
audit the full public surface.
