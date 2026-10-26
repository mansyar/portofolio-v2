# Review: Newsletter Lifecycle

- **Track:** `20261026-newsletter-lifecycle`
- **Type:** `bug`
- **Branch:** `fix/20261026-newsletter-lifecycle`
- **Range:** `1e721b43b2e82c2c0f93e43681c7dc332e20e2cf..88aed77`
- **Date:** 2026-10-26
- **Verdict:** `PASS`
- **Doc sync:** `none`

## Summary

The track closes the two defects it was scoped for and one it exposed. Subscribers now have
a single identity per address and an opt-out token; the welcome email carries a working
unsubscribe link; a public page honours it and reports the outcome without disclosing which
tokens exist; and the owner can see the list through a guarded query while the removed
public function stays removed.

Review found one Low defect, fixed in Phase R1, plus two acceptances recorded below rather
than silently carried.

## Findings

| ID | Severity | Finding | Resolution |
| --- | --- | --- | --- |
| F1 | Low | The unsubscribe page's one-shot boolean guard meant a second token opened in the same tab was never sent, while the page displayed the first token's result. | Fixed in Phase R1 — the ref stores the handled token and a different token re-runs the mutation; a rerender test pins it. |

## Accepted, not changed

| Item | Why accepted |
| --- | --- |
| `unsubscribe` is unauthenticated and unthrottled. | The token is a UUID; guessing is infeasible, each call is one indexed read, and a valid token only ever moves one row to `unsubscribed`. A limiter would add a new public surface for no reachable abuse case. |
| `listForAdmin` collects all subscribers. | Matches the precedent of `contact.listAll`; a personal newsletter list is small, and the query is admin-only. Revisit if the list grows into the thousands. |
| Unknown tokens report "unsubscribed". | Required by the spec: a distinguishable answer would turn the endpoint into a token oracle. The trade-off is a slightly odd message for a malformed link. |

## Verification

All commands run fresh on the final HEAD by the primary, as separate processes.

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| build | `pnpm build` | pass (exit 0) | verification/integrated.md, phase-r1.md |
| typecheck | `pnpm type-check` | pass (exit 0) | verification/integrated.md, phase-r1.md |
| lint | `pnpm lint` | pass (exit 0 — 21 warnings, 0 errors) | verification/phase-r1.md |
| format | `pnpm format:check` | pass (exit 0) | verification/phase-r1.md |
| test | `pnpm test` | pass (exit 0 — 44 files, 127 tests) | verification/phase-r1.md |
| coverage | `pnpm test:coverage` | pass (exit 0 — lines 24.96%, functions 18.37%) | verification/integrated.md |

## Requirements

| ID | Implemented by | Verified by | Status |
| --- | --- | --- | --- |
| FR-1 | P1.T2 | identity suite: one row, `alreadySubscribed: true`, normalized storage | covered |
| FR-2 | P1.T1 | token present on insert and rotated on re-subscribe; `by_token` index | covered |
| FR-3 | P2.T1 | unsubscribe suite: status, timestamp, idempotence, unknown token, isolation | covered |
| FR-4 | P2.T2 | builder suite: link contains the token, encodes it, omits it when absent | covered |
| FR-5 | P1.T3 | migration suite: collapse, earliest timestamp, active wins, second run no-op | covered |
| FR-6 | P3.T1, P3.T2 | admin suite: rejection without identity, rows for admin, tokens excluded, `listSubscribers` still absent | covered |
| NFR-1 | — | no dependency or lockfile change in the diff | covered |
| NFR-2 | P2.T3 | route suite: `h1`, `role="status"` in every state, no interaction required | covered |
| NFR-3 | — | existing rate-limit suite unchanged and green inside the 127-test run | covered |
| NFR-4 | — | no secrets; fixtures use `example.com`; admin payload excludes tokens | covered |
| NFR-5 | R1 | every gate command exits 0 on HEAD | covered |
| AC-1 | P1 | identity suite | covered |
| AC-2 | P1 | identity suite (distinct tokens, reactivation) | covered |
| AC-3 | P2 | unsubscribe suite | covered |
| AC-4 | P2 | builder suite | covered |
| AC-5 | P1 | migration suite | covered |
| AC-6 | P3 | admin suite | covered |
| AC-7 | P2, R1 | route suite, including the second-token case | covered |
| AC-8 | P1, R1 | the identity suites failed against the pre-fix handler (`phase-1-red-run.txt`); gates green | covered |

## Overrides

None required.

## Notes

- **Reviewer execution:** performed inline against `spec.md`, `plan.md`, the phase evidence,
  and the project guidelines. No separate reviewer subagent is available in this environment.
- **Doc sync:** `product-guidelines.md` already requires an unsubscribe path; this track
  makes the product meet it rather than changing the rule. No product or tech-stack text
  needed an edit.
- **Owner action outstanding:** `npx convex run newsletter:normalizeSubscribers` has not run.
  Until it does, pre-existing mixed-case rows are not found by the normalized lookup and mail
  to them omits the opt-out link.
- **Accessibility:** the admin page uses a real table with a screen-reader caption and
  column headers; the unsubscribe page needs no interaction, so there is no keyboard trap or
  focus management to review.
