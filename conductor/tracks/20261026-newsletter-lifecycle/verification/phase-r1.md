# Phase R1 — Review Fixes

- **Track:** `20261026-newsletter-lifecycle` — Newsletter Lifecycle
- **Phase:** R1
- **Date:** 2026-10-26
- **Branch:** `fix/20261026-newsletter-lifecycle`
- **Base:** `ff23771`
- **Head:** `88aed77`
- **Result:** verified

## Finding resolved

| ID | Severity | Finding | Resolution |
| --- | --- | --- | --- |
| F1 | Low | The page guarded its mutation with a one-shot boolean. Navigating within the route to a different token (second link in the same tab) left `attempted` true, so the new token was never sent and the page kept showing the previous result. | The ref now stores the last handled token; a different token resets the state to pending and is sent. |

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| unit | `pnpm exec vitest run src/routes/__tests__/newsletter-unsubscribe.a11y.test.tsx` | 0 | 4 tests passed (was 3) |
| static | `pnpm type-check` | 0 | Clean |
| static | `pnpm lint` | 0 | 21 warnings, 0 errors |
| static | `pnpm format:check` | 0 | Clean |
| unit | `pnpm test` | 0 | 44 files, 127 tests |
| build | `pnpm build` | 0 | Pass |

## Notes

- The `StrictMode` single-call assertion still passes: the guard compares token values, so a
  repeated render with the same token is still skipped.
- The new test renders once, waits for the first call, rerenders with a second token, and
  asserts exactly two calls with the two tokens — the behaviour a boolean guard would fail.
