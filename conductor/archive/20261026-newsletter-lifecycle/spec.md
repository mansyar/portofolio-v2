# Newsletter Lifecycle — Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

Give newsletter subscribers a way out and give each subscriber one identity. Today the
schema declares an `unsubscribed` status that nothing can ever set, outgoing mail carries no
unsubscribe link, and the same address written in a different case becomes a second
subscriber row that receives a second welcome email.

## Problem / Motivation

`convex/newsletter.ts` exports exactly two functions: `subscribe` and `sendWelcomeEmail`.
A repository-wide search for `unsubscribe` returns two hits — a comment inside `subscribe`
and the `"unsubscribed"` literal in the schema — so no mutation, route, or link can move a
subscriber into that state. The welcome email's HTML ends with the signature and no footer.
For a list that sends marketing mail, a missing opt-out is a compliance defect, not a
missing convenience.

The same function is inconsistent about identity. It computes `normalizedEmail`
(`trim().toLowerCase()`) and uses it for both rate-limit keys, but the deduplication lookup
and the insert both use the raw `email` argument. Convex string comparison is exact, so
`A@B.com` and `a@b.com` are different subscribers: two rows, two welcome emails, and a
`subscribedAt` that reflects the most recent casing. The per-address rate limit still applies
(5/hour), which is why this has stayed invisible — the duplicate is throttled, not
prevented.

Rows already stored with mixed case make a naive fix incomplete: normalizing only new
subscriptions would leave the old rows unreachable by a normalized lookup, and a second
signup would create a fresh duplicate. The fix therefore needs a one-off backfill as well as
a code change.

The subscriber list was removed from the public API by the
`20261025-harden-public-convex-functions` track, and a regression test asserts that
`newsletter.listSubscribers` is neither exported nor callable. Any admin visibility added
here must be a separate, `requireAdmin`-guarded query rather than a return of that function.

## Goals & Success Metrics

- **Goal:** Every subscriber can opt out from the email they received, and one address has
  exactly one subscriber record.
- **Metric:** 1 working unsubscribe path reachable from outgoing mail; 0 rows with an
  un-normalized address after the migration; 0 duplicate rows per address after the
  migration; 0 public subscription-listing functions; all configured gates exit 0.

## Scope

### In Scope

- Add an `unsubscribeToken` to subscribers, generated on insert and on re-subscribe, with an
  index for lookup.
- Normalize the address (trim + lowercase) before the deduplication lookup and before insert.
- An unauthenticated, token-bearing unsubscribe mutation that is idempotent and reveals
  nothing about addresses it does not know.
- A public `/newsletter/unsubscribe` page that reads the token from the query string, calls
  the mutation, and reports the outcome.
- An unsubscribe link in the welcome email, built from the subscriber's token.
- An idempotent internal migration that lowercases existing addresses, collapses duplicates
  onto the earliest `subscribedAt`, and backfills missing tokens.
- A `requireAdmin`-guarded subscriber listing and a small admin page that shows email, status,
  and subscribed date.
- Tests for identity, tokens, unsubscription, the mail footer, the migration, and the admin
  guard.

### Out of Scope

- Sending campaign or broadcast mail; only the existing welcome email changes.
- Double opt-in / confirmation emails, bounce handling, or list segmentation.
- Re-adding any public subscriber-listing function; the harden track's test must keep
  passing.
- Deleting unsubscribe rows rather than marking them; the record is retained for audit.
- Changing the Resend provider, sender address, or email design beyond the footer.
- Running the migration or deploying; both are owner actions against the live backend.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | `subscribe` normalizes the address (trim + lowercase) before the deduplication lookup and before storing it, so case and whitespace variants resolve to a single subscriber row and a single welcome email. | must |
| FR-2 | Every subscriber carries a unique `unsubscribeToken`, generated on insert and refreshed on re-subscribe, with an index that supports lookup by token. | must |
| FR-3 | A public unsubscribe mutation accepts a token, sets `status: "unsubscribed"`, and is idempotent; an unknown or missing token performs no write and returns the same shape as a known token's success. | must |
| FR-4 | The welcome email contains an unsubscribe link whose token matches the recipient's stored token. | must |
| FR-5 | An idempotent internal migration lowercases stored addresses, collapses duplicate rows onto the earliest `subscribedAt`, and backfills missing tokens; running it twice leaves the data unchanged the second time. | must |
| FR-6 | Subscribers are readable only through a `requireAdmin`-guarded query; no unauthenticated listing exists, and the `listSubscribers` removal test keeps passing. | must |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | No dependency is added, removed, or upgraded; `package.json` and `pnpm-lock.yaml` are unchanged. |
| NFR-2 | The unsubscribe page has a single `h1`, is operable with the keyboard, and reports its result in a `role="status"` region. |
| NFR-3 | `subscribe` keeps enforcing its rate limits on both the caller-IP and normalized-address keys, and its existing test keeps passing. |
| NFR-4 | No secrets, provider keys, or real addresses appear in code, tests, or the diff; email addresses in fixtures are obviously synthetic. |
| NFR-5 | `pnpm type-check`, `pnpm lint`, `pnpm format:check`, `pnpm test`, and `pnpm build` exit 0, and coverage does not fall below the configured floor. |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | Subscribing `A@B.com` and then `a@b.com` leaves exactly one subscriber row, with the second call reporting `alreadySubscribed: true`. | FR-1 |
| AC-2 | A subscriber's token is present, non-empty, and different from another subscriber's token; re-subscribing an unsubscribed address yields an active row with a token. | FR-2 |
| AC-3 | Calling unsubscribe with a valid token sets the status to `unsubscribed`; calling it again succeeds without further change; calling it with an unknown token writes nothing and does not throw or disclose address information. | FR-3 |
| AC-4 | The welcome-email builder output contains an unsubscribe URL whose `token` parameter equals the subscriber's token. | FR-4 |
| AC-5 | Running the migration over a mixed-case duplicate set leaves one row per normalized address, the earliest `subscribedAt`, a token on every row, and no change on a second run. | FR-5 |
| AC-6 | The subscriber listing throws for an unauthenticated caller and returns rows for an admin; `newsletter` still has no `listSubscribers` export. | FR-6 |
| AC-7 | The unsubscribe route renders a heading, announces success and failure states, and calls the mutation with the token from the URL. | FR-3, NFR-2 |
| AC-8 | Every command in NFR-5 exits 0 on the final HEAD, and the new identity tests fail against the pre-fix `subscribe`. | FR-1, NFR-5 |

## Edge Cases

- **Whitespace and case:** `" Ana@Example.com "` and `"ana@example.com"` are one subscriber,
  and the stored value is the normalized form.
- **Unknown token:** treated as "already unsubscribed" so the page cannot be used to probe
  which tokens exist.
- **Missing token in the URL:** the page renders an explanatory state without calling the
  mutation.
- **Re-subscribe after unsubscribe:** the existing branch that flips `unsubscribed` to
  `active` stays, and the token is refreshed so old links stop working.
- **Duplicate addresses with different tokens:** the migration keeps one row; the surviving
  row's token is the one that stays valid.
- **Existing rows without a token:** the migration backfills; until it runs, the welcome
  email falls back to no unsubscribe link rather than a broken one.
- **Rate limiting:** normalization must not weaken the per-address limit; both keys still use
  the normalized address.

## Dependencies

- **Tracks:** none. Both prior tracks (`20261026-remove-dev-surfaces`,
  `20261026-blog-discovery-correctness`) are merged and touch no newsletter code.
- **External:** Resend API key and site URL are needed for real mail, but no test requires
  them.

## Open Questions & Assumptions

- **Decision:** tokens are opaque random strings stored in plaintext. They authorise only
  "unsubscribe this address", are not reused for anything else, and rotate on re-subscribe;
  hashing them would defend against a database read that already exposes the addresses.
- **Decision:** the unsubscribe page lives at `/newsletter/unsubscribe` because no
  `/newsletter` route exists yet and the path names the action rather than a preference
  centre.
- **Decision:** the migration is an internal mutation run by the owner
  (`npx convex run newsletter:normalizeSubscribers`), because `convex run`/`deploy` against
  the live backend is a human-only step in `conductor/workflow.md`.
- **Assumption:** the welcome email is the only outbound mail, so the footer change there
  covers every message the list can currently receive.
- **Assumption:** the admin page can reuse the existing admin layout and table conventions
  without new dependencies.
- **Open questions:** none blocking.

## References

- `convex/newsletter.ts` — `subscribe` (raw-email dedupe) and `sendWelcomeEmail` (no footer).
- `convex/schema.ts` — `newsletterSubscribers` with `status` but no token.
- `convex/__tests__/newsletter.*.test.ts` — existing harness, rate-limit, and removal tests.
- `src/components/features/NewsletterForm.tsx` — the subscribe surface.
- `conductor/archive/20261025-harden-public-convex-functions/` — why the public list is gone.
- `conductor/workflow.md` — human-only exception for `convex deploy`/`run`.
