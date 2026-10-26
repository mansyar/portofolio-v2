## Summary

The newsletter had no way out: the schema declared an `unsubscribed` status that nothing
could set, the welcome email carried no opt-out link, and the same address written with
different casing became a second subscriber that received a second welcome email. Each
subscriber now has one normalized identity and a token, the mail carries a working
unsubscribe link, a public page honours it, and the owner can read the list through a
guarded query — with the deliberately removed public listing still absent.

## Track

- **ID:** `20261026-newsletter-lifecycle`
- **Type:** `bug`
- **Spec:** [`conductor/archive/20261026-newsletter-lifecycle/spec.md`](conductor/archive/20261026-newsletter-lifecycle/spec.md)
- **Plan:** [`conductor/archive/20261026-newsletter-lifecycle/plan.md`](conductor/archive/20261026-newsletter-lifecycle/plan.md)
- **Review:** [`conductor/archive/20261026-newsletter-lifecycle/review.md`](conductor/archive/20261026-newsletter-lifecycle/review.md)

## What happened

| Phase | Goal | Result | Checkpoint | Notes |
| --- | --- | --- | --- | --- |
| 1: Subscriber identity | One address, one row, one token; idempotent backfill | verified | `557757d` | Six tests written first and failing against the old handler |
| 2: Unsubscribe path | Token mutation, mail footer, public page | verified | `3296b4e` | Gate re-run after the generated route tree was rebuilt |
| 3: Admin-only subscriber list | Guarded read plus admin page | verified | `4f0596e` | Tokens deliberately excluded from the payload |
| R1: Review fixes | Second token in the same tab is honoured | verified | `88aed77` | Low finding from review |

## Requirements

- [x] `FR-1` — normalize before lookup and insert (test: `convex/__tests__/newsletter.subscribe.identity.test.ts`)
- [x] `FR-2` — token on insert and re-subscribe, `by_token` index
- [x] `FR-3` — idempotent, non-disclosing unsubscribe mutation (test: `convex/__tests__/newsletter.unsubscribe.test.ts`)
- [x] `FR-4` — opt-out link in the welcome mail (test: `convex/__tests__/newsletter.welcomeEmail.test.ts`)
- [x] `FR-5` — idempotent migration (test: `convex/__tests__/newsletter.normalizeSubscribers.test.ts`)
- [x] `FR-6` — admin-guarded listing, public name still absent (test: `convex/__tests__/newsletter.adminList.test.ts`)
- [x] `NFR-1` — no dependency or lockfile change
- [x] `NFR-2` — single `h1`, `role="status"`, no interaction required (test: `src/routes/__tests__/newsletter-unsubscribe.a11y.test.tsx`)
- [x] `NFR-3` — rate limiting unchanged and still green
- [x] `NFR-4` — no secrets; tokens never leave the server for the CMS
- [x] `NFR-5` — all gates exit 0
- [x] `AC-1` … `AC-8` — see the requirements table in `review.md`

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| build | `pnpm build` | pass | `conductor/archive/20261026-newsletter-lifecycle/verification/integrated.md` |
| typecheck | `pnpm type-check` | pass | same |
| lint | `pnpm lint` | pass (21 warnings, 0 errors) | same |
| format | `pnpm format:check` | pass | same |
| test | `pnpm test` | pass (44 files, 127 tests) | `conductor/archive/20261026-newsletter-lifecycle/verification/phase-r1.md` |
| coverage | `pnpm test:coverage` | pass (lines 24.96%, up from 22.82%) | `conductor/archive/20261026-newsletter-lifecycle/verification/integrated.md` |

## Media

Not captured. The changes are a database-level identity fix, an email footer, and two
unauthenticated/admin pages that need a populated backend and an admin session; nothing here
was rendered in a browser, so no screenshot was produced rather than a fabricated one.

## Review

- **Verdict:** `PASS`
- **Rounds:** 2
- **Fixed:** 1 finding (F1, second token in the same tab)
- **Accepted/deferred:** 3 documented acceptances (unthrottled unsubscribe, admin collect,
  vague unknown-token answer)

## ⚠️ Owner action required after merge

The migration that normalizes existing rows and backfills tokens is **not** run by the
deploy. Run it once against the live backend:

```bash
npx convex run newsletter:normalizeSubscribers
```

Until then, an existing mixed-case row is not matched by the normalized lookup, and mail to
a subscriber without a token omits the opt-out link rather than sending a broken one. The
mutation is idempotent, so running it twice is harmless. Set `SITE_URL` in the deployment if
the public origin ever differs from `https://ansyar-world.top`, which is the fallback used to
build the unsubscribe link.

## Deviations and risks

- **New helper file:** `convex/lib/welcomeEmail.ts` holds the mail builder so the footer can
  be tested without sending; it follows the existing `convex/lib/` pattern.
- **Naming:** the admin query is `listForAdmin`, not `listSubscribers`, because a regression
  test asserts the removed public function stays removed.
- **Risk:** a subscriber who unsubscribes by link cannot be told apart from an unknown token.
  That is intentional (no token oracle) and costs a slightly generic message on a malformed
  link.
- **Risk:** `unsubscribe` is a public mutation without a limiter; the UUID token makes
  guessing infeasible and each call is a single indexed read.

## Follow-ups

- None opened; the three acceptances above are recorded in `review.md`.

## Rollback

```bash
# Squash commit
git revert --no-edit <squash-commit>
```

Reverting restores the raw-email lookup and removes the token column usage; existing tokens
in the database are harmless if the code no longer reads them.
