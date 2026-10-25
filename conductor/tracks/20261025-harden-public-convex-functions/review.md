# Track Review - Harden Public Convex Functions

| Field | Value |
|---|---|
| Track | `20261025-harden-public-convex-functions` |
| Branch | `fix/20261025-harden-public-convex-functions` |
| Diff | `6d475db..626312e` |
| Reviewed | 2026-10-26 |
| **Verdict** | **PASS WITH FINDINGS** |
| Rounds | 1 |
| Findings | 5 (0 Critical, 0 High, 2 Medium, 3 Low) — all resolved or recorded |

## What was verified independently

- **The surface audit holds.** All 103 `export const` sites across `convex/*.ts` and all 74
  `requireAdmin(` call sites were enumerated independently of the track's evidence. Every
  public export lacking a guard is either a content read filtered to published/visible
  records, one of `settings.getPublic` / `sitemap.getSitemapData` / `contact.submit` /
  `newsletter.subscribe`, or a Convex Auth framework action. **No unguarded public mutation
  exists** beyond the two rate-limited ones.
- **The four gaps are genuinely closed**, not merely harder to reach. `getStats`' guard sits
  above the `try` that returns `null` and above the env check; `listSubscribers` is gone from
  the module, from `api.d.ts`, and from the deployment path; `sendWelcomeEmail` is an
  `internalAction` (confirmed against `registration_impl.js`, where `internalActionGeneric`
  sets `isInternal` and never `isPublic`); `subscribe` is rate limited with the attempt row
  written **before** the `alreadySubscribed` early return, so a repeat subscribe cannot
  bypass the limit.
- **The tests would fail if the fixes were reverted.** Each was traced against the pre-fix
  behaviour, and the two new ones were mutation-tested (see `verification/review-fixes.md`).
- **`projects.remove` is not exploitable today.** `ctx.db.delete` and `requireAdmin` share one
  mutation transaction, so a throw rolls the delete back. The reviewer agreed with Phase 4's
  assessment.
- **Test files cannot be deployed.** The Convex CLI bundler skips any file with multiple dots
  in its name, so putting tests under `convex/` is safe — checked specifically because the
  track did exactly that.
- **Out of Scope was respected.** No schema change, no subscriber admin screen, no edits to
  `blog`/`projects`/`sitemap`/`settings`/`resume`/`skills`/`uses`, and the only UI change is
  the form's submit path.

## Findings

| ID | Sev | Location | Finding | Resolution |
|---|---|---|---|---|
| F1 | Medium | `convex/newsletter.ts` | The rate limit was keyed only on `clientIp`, a client-supplied argument — required forces presence, not authenticity. Rotating the value gave unlimited attempts, so enumeration and per-inbox mail-bombing stayed open for a determined caller. | **Fixed.** Second limit keyed on the normalized address, action `"newsletter_subscribe_email"`, same 5/hour window, both rows written before the subscriber lookup. Two new tests cover it. |
| F2 | Medium | `convex/__tests__/analytics.getStats.test.ts` | The admin test supplied `email` on the identity, which production never does: Convex Auth's JWT carries only `sub`, so `requireAdmin` resolves the address from `users` or `internal.admin.getUserEmail`. A regression there would lock the sole admin out of the dashboard with no failing test. | **Fixed.** Added a no-email-claim test that seeds a `users` row and presents `subject: userId|session`. Mutation-tested. |
| F3 | Low | `convex/projects.ts:220-233` | `remove` calls `requireAdmin` after `ctx.db.delete` — the only guard-last handler in the codebase, and a violation of `code_styleguides/project.md`. | **Recorded, not fixed.** Not exploitable (transactional rollback); `projects.ts` is out of scope. Follow-up debt. |
| F4 | Low | `docs/PROGRESS.md`, `docs/PRD.md` | PROGRESS was not synced; the PRD over-stated the rate-limit guarantee; a pre-existing line still calls Site Settings "planned for a future release" although it is implemented. | **Fixed** for PROGRESS and the guarantee. The settings line is pre-existing drift, surfaced rather than rewritten. |
| F5 | Low | `newsletter.sendWelcomeEmail.test.ts:33` | A test named "still exists as a callable action" read like a reachability guarantee but passes only because `convex-test` ignores visibility. | **Fixed.** Renamed and the limitation documented in the test body. |

## Requirements coverage

| ID | Status | Note |
|---|---|---|
| FR-1 | **covered** | Guard above `try` and env check; anonymous rejection plus both admin paths (identity email, and no-claim resolution) now tested |
| FR-2 | **covered** | Deleted from module, `api.d.ts`, and deployment path; two regression tests |
| FR-3 | **covered** | `internalAction`, scheduled via `internal.newsletter.sendWelcomeEmail` |
| FR-4 | **covered** | Met as specified, and hardened beyond it by the address-keyed limit (F1) |
| FR-5 | **covered** | `createServerFn` resolves the IP; passed as `clientIp` |
| FR-6 | **covered** | `convex-test` 0.0.41 with real handlers; 46 tests |
| FR-7 | **covered** | 21-module classification table, independently re-verified |
| NFR-1 | **covered** | No behaviour change to public or admin flows; build green |
| NFR-2 | **covered** | 31 → 46 tests, no file deleted, 0 placeholders |
| NFR-3 | **covered** | 7.99% lines / 5.88% functions vs the 3%/3% ratchet |
| NFR-4 | **covered** | All five commands exit 0 |
| NFR-5 | **covered** | `maxWorkers: 4` honoured |
| NFR-6 | **covered** | No new client-side secret; Umami/Resend stay in `process.env` on Convex |
| AC-1 | **covered** | Anonymous rejected; admin path proven on the production no-claim branch |
| AC-2 | **covered** | `api.d.ts` clean; residual grep hits only inside the regression test |
| AC-3 | **covered** | Verified against the module and the scheduler call |
| AC-4 | **covered** | Message, row count, identifier, action, and no side effects on the rejected attempt |
| AC-5 | **covered** | `createServerFn` + `clientIp` argument |
| AC-6 | **covered** | 0 occurrences of `expect(true).toBe(true)`; 16 real Convex assertions |
| AC-7 | **covered** | Classification table present and re-verified |
| AC-8 | **covered** | Build exits 0; widget contract unchanged (render path not exercisable in jsdom — flagged in `integrated.md`) |
| AC-9 | **covered** | 46 passing ≥ 31; coverage above the floor |

## Doc sync

Complete. `README.md` (newsletter module in the tree), `docs/PRD.md` (three public API rows,
the access-model paragraph, the corrected rate-limit wording), `docs/PROGRESS.md` (changelog
row). `metadata.doc_sync: complete`.

## Deferred debt

| Item | Why deferred |
|---|---|
| `projects.remove` guards after it writes | Out of spec scope; not exploitable today |
| `contact.submit` has only an IP-keyed limit | Same class as F1; changing it is outside this track's Touches |
| The IP resolver is duplicated in `contact.tsx` and `NewsletterForm.tsx` | Extracting `src/lib/server/client-ip.ts` requires editing `contact.tsx` |
| The IP half of the rate limit is transport-trusted | Needs the Convex HTTP layer or a trusted proxy header |
| The `"unknown"` bucket is shared | Matches the pre-existing `contact.submit` trade-off |
| 99 Biome warnings | Pre-existing on `main`; a11y/style debt tracked as `tech-stack.md` open question |
