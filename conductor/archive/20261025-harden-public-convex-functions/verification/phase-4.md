# Phase 4 — Replace the placeholder tests and audit the surface

| Field | Value |
| --- | --- |
| Track | `20261025-harden-public-convex-functions` |
| Phase | 4 — Replace the placeholder tests and audit the surface |
| Date | 2026-10-25 |
| Branch | `fix/20261025-harden-public-convex-functions` |
| Base commit | `798d08df5771f01e66f2429d8406e19604b9321d` |
| Head commit | `0e38ba22ef6af9824bec891f8f8b2d58d71120cf` (last code commit; this evidence file lands in the commit immediately after it) |

## Result

**Verified.** No placeholder assertion remains under `convex/__tests__/`. The three fake
tests that predated this track now assert real behaviour and would fail against a broken
implementation. All 21 Convex modules are classified by access model below; the five
intentionally-public functions are unchanged and still public. The full five-command gate
is green, including `pnpm build`.

`pnpm test` exits **0** with **42 passed, 0 failed** across 17 files — up from 40, and no
file was deleted to get there.

## Placeholder replacement

`convex/__tests__/contact.test.ts` and `convex/__tests__/uses.test.ts` were the only two
files asserting `expect(true).toBe(true)`. Both were rewritten against the `convex-test`
harness, keeping the `// @vitest-environment edge-runtime` directive and the
`import.meta.glob(["../**/*.ts", "!../__tests__/**"])` modules glob from
`newsletter.subscribe.rateLimit.test.ts`.

### `contact.test.ts` — 2 tests became 4

| Old claim | What it now asserts | Fails against a wrong implementation because |
| --- | --- | --- |
| "submissions are ordered desc" | **`listAll` rejects a caller with no identity.** A submission is seeded first, then `t.query(api.contact.listAll, {})` must throw `/Unauthorized/i`. | If `requireAdmin` were removed the query would resolve; the helper returns the string `"resolved"` and the match fails. |
| "unread count counts isRead=false" | **`unreadCount` rejects a caller with no identity.** Same shape, seeded row, `t.query(api.contact.unreadCount, {})` must throw `/Unauthorized/i`. | Same as above — a removed guard turns the rejection into a resolved value. |
| *(new)* | **`listAll` returns newest first for an admin.** Three submissions inserted in the order `oldest`, `middle`, `newest`; the result's `name` sequence must be `["newest", "middle", "oldest"]`. | Dropping `.order("desc")` yields insertion order, so `"oldest"` comes first and the sequence assertion fails. |
| *(new)* | **`unreadCount` counts only `isRead === false` for an admin.** Four rows seeded as `[false, true, false, true]`; the result must be `2`. | Counting every row, or dropping the `by_read` index filter, returns `4`. |

The two guard assertions are the property this track exists for. The two admin assertions
use `t.withIdentity({ subject: "admin-user", email: ADMIN_EMAIL })`, which satisfies the
`ADMIN_EMAILS.includes(email)` check in `convex/lib/auth.ts` because `beforeEach` stubs
`ADMIN_EMAIL` before any handler imports `lib/auth.ts`. `requireAdmin` is **not** stubbed or
mocked anywhere.

The ordering test depends on `convex-test` stamping `_creationTime` monotonically: its
`insert` bumps `_lastCreationTime` by `0.001` on a tie, so three inserts in one `t.run`
have strictly increasing creation times and `.order("desc")` is deterministic.

### `uses.test.ts` — 1 test stayed 1

| Old claim | What it now asserts | Fails against a wrong implementation because |
| --- | --- | --- |
| "listVisible filters items" | **`listVisible` returns only visible items, ordered by `displayOrder`.** Four `usesItems` rows are seeded interleaved — hidden@1, visible@2, visible@3, hidden@4 — and the result must be exactly `["Visible one", "Visible two"]`. | Removing the `isVisible` filter returns all four names; ordering by `_creationTime` instead of `by_order` would reorder the pair; returning hidden rows fails the `toEqual`. |

`uses.listVisible` is a public query, so no identity is supplied — that is itself part of
what the test pins down. One honest test was preferred over a second shallow one covering
`byCategory`.

### Confirmation

`grep` over `convex/__tests__/` for the literal `expect(true).toBe(true)` returns **zero
matches**. Neither file was deleted.

## Access-model audit

### Method

Two greps, then a read of every ambiguous result:

1. `export const <name> = (query|mutation|action|internalQuery|internalMutation|internalAction|httpAction)(` across `convex/` — 103 matches, the complete public/internal surface.
2. `requireAdmin\(|requireAuth\(|optionalAdmin\(` across `convex/` — 76 matches, each one mapped back to the enclosing export by line number.
3. For every export with **no** `requireAdmin` call, the handler body was read to confirm it is either a content read that filters `isVisible`/`status === "published"`, or one of the five intentionally-public functions, or a framework export.
4. Per-file call counts were reconciled against the number of admin functions: `blog` 14/14, `contact` 5/5, `dashboard` 2/2, `media` 4/4, `mediaActions` 1/1, `resume` 13/13, `settings` 3/3, `skills` 9/9, `uses` 8/8, `activity` 1/1, `analytics` 1/1. `projects` shows 12 calls for 10 admin functions only because `create` and `update` call `requireAdmin` a second time to read the actor email for the activity log; `remove` calls it once, after its writes (see Notes).

This is a repeatable check: re-running grep 1 and grep 2 and diffing the two sets surfaces
any new export that is neither internal nor guarded. It does not catch a guarded function
whose guard sits after a write; that is why step 3 reads the unguarded-looking bodies.

### Classification — all 21 modules

| Module | Public-by-design | Admin-guarded (`requireAdmin`) | Internal |
| --- | --- | --- | --- |
| `admin.ts` | — | — | `getUserEmail` |
| `activity.ts` | — | `list` | `log` |
| `analytics.ts` | — | `getStats` (action; guard is the first statement, above the env check and outside the `try` that returns `null`) | — |
| `auth.config.ts` | No exported functions — default export of the provider config | — | — |
| `auth.ts` | `signIn`, `signOut` (framework auth endpoints; must be reachable by anonymous callers) | — | — (plus `auth`, `store` from `convexAuth`, not Convex functions) |
| `blog.ts` | `listPublished`, `listRecent`, `bySlug`, `getCategories`, `getTags`, `getRelated`, `getTagsWithCounts`, `listForRss` — content reads, every one filtered to `status === "published"` | `listAll`, `getAdminPost`, `createCategory`, `updateCategory`, `deleteCategory`, `createPost`, `updatePost`, `deletePost`, `togglePublish`, `createTag`, `updateTag`, `deleteTag`, `removePostsBulk`, `toggleStatusBulk` | `publishScheduled` |
| `contact.ts` | `submit` (see below) | `listAll`, `getById`, `unreadCount`, `markAsRead`, `remove` | `sendSlackNotification` |
| `crons.ts` | No exported functions — default export of the cron table | — | Schedules `internal.blog.publishScheduled` |
| `dashboard.ts` | — | `getStats`, `getRecentMessages` | — |
| `http.ts` | No exported functions — default export of the HTTP router; registers the `@convex-dev/auth` routes, which are anonymous by nature | — | — |
| `media.ts` | — | `generateUploadUrl`, `saveFile`, `remove`, `list` | — |
| `mediaActions.ts` | — | `upload` | — |
| `newsletter.ts` | `subscribe` (see below) | — | `sendWelcomeEmail` |
| `projects.ts` | `listVisible`, `listFeatured`, `bySlug`, `getUniqueTechStacks`, `getRelated` — content reads, all filtered to `isVisible` (or `bySlug` returning `null` for a hidden row) | `listAll`, `getById`, `create`, `update`, `remove`, `toggleVisibility`, `reorder`, `removeBulk`, `toggleVisibilityBulk`, `toggleFeaturedBulk` | — |
| `resume.ts` | `getProfile`, `getExperiences`, `getEducation`, `getCertifications` — content reads, the three list reads filtered to `isVisible` | `listAllExperiences`, `listAllEducation`, `listAllCertifications`, `updateProfile`, `createExperience`, `updateExperience`, `deleteExperience`, `createEducation`, `updateEducation`, `deleteEducation`, `createCertification`, `updateCertification`, `deleteCertification` | — |
| `schema.ts` | No exported functions — default export of `defineSchema` | — | — |
| `seed.ts` | — | — | `seedData` |
| `settings.ts` | `getPublic` (see below) | `getAll`, `set`, `setBulk` | — |
| `sitemap.ts` | `getSitemapData` (see below) | — | — |
| `skills.ts` | `listVisible`, `byCategory`, `getCategories` — content reads, all filtered to `isVisible` | `listAll`, `getById`, `create`, `update`, `remove`, `reorder`, `toggleVisibility`, `removeBulk`, `toggleVisibilityBulk` | — |
| `uses.ts` | `listVisible`, `byCategory` — content reads, both filtered to `isVisible` | `listAll`, `getById`, `create`, `update`, `remove`, `toggleVisibility`, `removeBulk`, `toggleVisibilityBulk` | — |

Two helper modules sit outside the 21 and export no Convex functions:
`convex/lib/auth.ts` (`requireAdmin`, `optionalAdmin`, `requireAuth`) and
`convex/lib/validation.ts` (constants and predicates).

### The five intentionally-public functions

Unchanged by this track, and none of them gained a guard in this phase:

| Function | Why it is public |
| --- | --- |
| `contact.submit` | The public contact form. Guarded by a honeypot check and by a `rateLimits` window of **3 submissions per hour per IP** (`action: "contact_submit"`), both evaluated before any insert. |
| `newsletter.subscribe` | The public signup. Rate limited at **5 attempts per hour per IP** (`action: "newsletter_subscribe"`), and the attempt row is written before the already-subscribed early return so that branch cannot be used to bypass the limit. Added in Phase 3. |
| `settings.getPublic` | Site name and SEO read, called by `Seo` on every page render. Returns the `siteSettings` key/value map only. |
| `sitemap.getSitemapData` | Feeds `/sitemap.xml`. Returns static routes plus the slugs of visible projects and published posts — no document bodies. |
| the content queries (`uses.listVisible`, `uses.byCategory`, `skills.listVisible`, `skills.byCategory`, `skills.getCategories`, `projects.listVisible`, `projects.listFeatured`, `projects.bySlug`, `projects.getUniqueTechStacks`, `projects.getRelated`, `blog.listPublished`, `blog.listRecent`, `blog.bySlug`, `blog.getCategories`, `blog.getTags`, `blog.getRelated`, `blog.getTagsWithCounts`, `blog.listForRss`, `resume.getProfile`, `resume.getExperiences`, `resume.getEducation`, `resume.getCertifications`) | They render the public pages. Every one filters on `isVisible === true` or `status === "published"`, so hidden and draft content is not reachable through them. |

No unguarded public **mutation** was found. Every mutation in `convex/` is either
`requireAdmin`-guarded, `internalMutation`, or one of the two rate-limited public forms.

## Commands

All five gate commands were run separately, never chained.

| Command | Exit | Result |
| --- | --- | --- |
| `pnpm type-check` | 0 | clean |
| `pnpm lint` | 0 | 99 warnings, 0 errors — unchanged from the entering state |
| `pnpm format:check` | 0 | 99 warnings, 0 errors |
| `pnpm test` | 0 | **42 passed, 0 failed**, 17 files, 7.38 s |
| `pnpm build` | 0 | client 1m 5s, SSR 4.46 s, nitro 40.04 s; `deps.optimizer.web` deprecation and the zod `@__PURE__` Rollup warnings are the pre-existing noise noted in the brief |
| `pnpm test:coverage` | 0 | 42 passed; **6.81 % lines / 5.44 % functions** against the 3 % / 3 % ratchet |

Coverage rose from the entering 5.37 % lines / 4.68 % functions to 6.81 % / 5.44 %:
`contact.ts` moved from 0 % to 31.7 % lines and `uses.ts` from 0 % to 25.53 %, which is the
real handlers behind the previously fake tests being exercised for the first time.

`pnpm lint` and `pnpm format:check` are both `biome check .` in `package.json`, so the gate
runs the same check twice. That is pre-existing and was not changed.

## Untouched files

`convex/__tests__/helpers.test.ts` and `convex/__tests__/discovery.test.ts` were **not
touched**: both already contained real logic tests, so they were never placeholders and
FR-7 does not apply to them. `git diff 798d08d..0e38ba2 -- convex/__tests__/` lists only
`contact.test.ts` and `uses.test.ts`.

## Deviations

None. `convex/__tests__/**` and the evidence file are the only paths changed, both inside
Touches. No `convex/*.ts` function module was edited, no guard was added or removed, and no
file was deleted.

## Notes

- **`projects.remove` guards after it writes.** The handler does `ctx.db.get`,
  `ctx.db.delete`, and only then calls `requireAdmin(ctx)` — the guard's only job in that
  body is to supply the actor email for the activity log. It is *not* an authorization
  hole, because a Convex mutation is transactional: `requireAdmin` throws before the
  transaction commits, so the delete rolls back and an anonymous caller cannot remove a
  project. It is nevertheless a guard-last shape, one refactor away from a real gap, and it
  is the only handler in the audit where the check is not the first statement. Recorded
  here as follow-up debt; not fixed, per this phase's rules.
- `contact.submit` and `newsletter.subscribe` share the `rateLimits` table with different
  `action` strings, so their buckets are independent. Both rate-limit checks read the
  window with a `.filter()` on `timestamp` rather than an index range, which means the
  count is correct but the read is not index-bounded. Fine at this scale; noted for a future
  track.
- The two guard assertions in `contact.test.ts` are the first tests in the suite that pin
  `requireAdmin`'s rejection message rather than a specific handler's behaviour. If the
  message in `convex/lib/auth.ts` is ever reworded away from `Unauthorized`, both fail —
  intentionally, since the anonymous caller's contract is that the call is refused.

## Primary verification

Appended by the primary agent after independently re-running the gate at `7ea5c21`.

### All five commands green

| Command | Exit | Result |
|---|---|---|
| `pnpm type-check` | 0 | `tsc --noEmit` clean on TypeScript 7.0.2 |
| `pnpm lint` | 0 | 154 files, 99 warnings, 0 errors — unchanged |
| `pnpm format:check` | 0 | 154 files, no fixes applied |
| `pnpm test` | **0** | **42 passed, 0 failed, 17 files** |
| `pnpm build` | **0** | `.output/nitro.json` generated |

### Placeholders are gone, and the count went up

| | Before | After |
|---|---|---|
| `expect(true).toBe(true)` occurrences | 3 | **0** |
| Tests in the suite | 40 | **42** |
| Test files | 17 | 17 |

The count rose rather than fell, which is the point. Deleting the two placeholder files
would have taken the suite to 40 passing tests and looked identical on a dashboard while
asserting strictly less. Instead `contact.test.ts` went from 2 fake tests to 4 real ones
and `uses.test.ts` from 1 fake to 1 real.

Verified by grep: zero matches for `expect(true).toBe(true)` anywhere under
`convex/__tests__/`.

### The new tests would actually catch a regression

Read each one rather than trusting the names.

**`contact.listAll` guard** — seeds a real submission first, then asserts the anonymous
call rejects with `/Unauthorized/i`. The seed matters: without it, an empty-table response
could be mistaken for an authorization failure, and the test would pass against a handler
with no guard at all.

**`contact.unreadCount` guard** — same shape, same seed.

**`contact.listAll` ordering** — seeds three submissions and asserts the names come back
`["newest", "middle", "oldest"]`. An unsorted or ascending result puts `"oldest"` first
and fails.

**`contact.unreadCount` counting** — seeds four rows with `isRead` of
`false, true, false, true` and asserts `2`. Counting every row, or ignoring the field,
returns `4` and fails.

**`uses.listVisible` filtering** — seeds four items with visible and hidden interleaved by
`displayOrder` (hidden at 1 and 4, visible at 2 and 3) and asserts exactly
`["Visible one", "Visible two"]`. The interleaving is deliberate: a missing `isVisible`
filter returns all four, and a wrong index order returns them out of sequence. Either
mistake fails.

`requireAdmin` is not stubbed anywhere. The two admin tests use
`t.withIdentity({ subject: "admin-user", email: ADMIN_EMAIL })` with `ADMIN_EMAIL`
stubbed in `beforeEach`, so the real guard runs against a real identity.

### The audit, independently spot-checked

The subagent reported one finding: `projects.remove` guards after it writes. I verified it
directly rather than accepting it — walked every guarded handler in `projects.ts` comparing
the byte offset of `requireAdmin(` against the offset of the first `await`. Every other
handler differs only by the `await ` prefix. `remove` is the sole outlier: first `await` at
89 (`ctx.db.get`), `requireAdmin` at 227, after the `ctx.db.delete`.

Confirmed it is **not** currently exploitable. A Convex mutation is transactional, so
`requireAdmin` throwing aborts the transaction and the delete rolls back — an anonymous
caller cannot remove a project. But the guard's only role in that body is supplying the
actor email for the activity log, so the shape invites the mistake of treating it as
incidental. If the activity log ever moves from `ctx.runMutation` to
`ctx.scheduler.runAfter`, the transaction boundary changes and the delete would commit
before the guard runs. That is the "one refactor away" argument, and it is why this is
recorded rather than dismissed.

**Not fixed here.** The spec puts changes to `projects.ts` out of scope, and this phase's
brief forbids adding or removing guards. It is follow-up debt with a concrete trigger
condition, not a silent acceptance.

### Coverage rose again

`pnpm test:coverage`: **6.81% lines** (up from 5.37%) and **5.44% functions** (up from
4.68%), against a 3% / 3% ratchet. Three phases of real tests moved the number from 3.96% to
6.81% without the floor ever being touched.

### Acceptance

- FR-7 (no placeholders, audit recorded) — met; 0 occurrences, 21 modules classified.
- NFR-2 (existing tests pass, placeholders replaced not deleted) — met; 42 passing, 0 deleted.
- NFR-3 (coverage above the ratchet) — met; 6.81% / 5.44%.
- AC-6, AC-7, AC-9 — met.
- `pnpm build` green, so the final-phase build layer is satisfied.

**Result: verified.** All four phases complete.
