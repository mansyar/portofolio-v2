# Phase 1 — Token gate and transport contract

- **Track:** 20261027-agent-content-api — Blog Content API for Agent Authoring
- **Phase:** 1
- **Date:** 2026-10-27
- **Branch:** feat/20261027-agent-content-api
- **Base commit:** `f68a40784fa1ac777f798026c971e13dd915232f`
- **Head commit:** `5ee6877`
- **Result:** verified

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| static | `pnpm type-check` | 0 | `tsc --noEmit` clean |
| static | `pnpm lint` | 0 | Biome clean for the changed files; repo-wide pre-existing warnings unchanged |
| static | `pnpm format:check` | 0 | Biome formatter clean |
| unit | `pnpm test` | 0 | 54 files, 205 tests passed (195 before this phase) |
| unit | `pnpm vitest run convex/__tests__/contentAuth.test.ts` | 0 | 10 tests passed |

One formatting finding in the new test file was fixed with
`biome check --write` before the recorded runs; no rule was suppressed and no
threshold was changed.

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-2 | A missing, malformed, or wrong token returns 401 and writes no row | `contentAuth.test.ts` → "refuses a missing, malformed, or wrong credential and writes nothing" (four credential shapes, `blogPosts` count asserted 0), "fails closed when the deployment has no configured digest", "fails closed when the configured digest is not a SHA-256 hex string" | met |
| AC-14 | A 300 KB body returns 413 with no write | `contentAuth.test.ts` → "refuses an oversized body with 413 before any write" asserts status 413, the `exceeds … bytes` message, and a zero row count | met |
| AC-16 | Wrong-token and missing-token responses are indistinguishable in shape | `contentAuth.test.ts` → "answers missing and wrong credentials indistinguishably" compares status and body text | met |

## Requirements covered

| ID | How |
| --- | --- |
| FR-1 | `isAuthorized` hashes the presented bearer token and compares it to `CONTENT_API_TOKEN_SHA256` through `constantTimeEqual`; an unset or non-hex digest denies every request |
| FR-10 | Rejections share one `{ error }` shape with lowercase, cause-first messages via `contentJsonResponse` |
| NFR-2 | `readCappedBody` checks a declared `content-length` and the measured body against 256 KB, answering 413 |
| NFR-4 | `contentJsonResponse` emits no CORS headers; a test asserts `access-control-allow-origin` is absent with and without a credential |

## Evidence paths

- `convex/lib/contentAuth.ts`
- `convex/http.ts`
- `convex/__tests__/contentAuth.test.ts`
- `conductor/tracks/20261027-agent-content-api/verification/phase-1.md`

## Deviations

None. The diff is confined to the three paths in `Touches`.

## Notes

- An authorized request currently returns a temporary `501 { error: "not
  implemented yet" }` stub so the gate can be exercised end to end before any
  content mutation exists. Phase 3 replaces the stub with the create handler;
  the stub is deliberately not part of FR-10's final error contract.
- Reads are not yet exposed. `GET /content/blog` arrives with FR-7 in Phase 3,
  which also touches `convex/http.ts`.
- The token is never logged, echoed, or returned: rejections carry a constant
  message regardless of which check failed.

## Primary verification

| Command | Exit | Result |
| --- | --- | --- |
| `pnpm type-check && pnpm lint && pnpm format:check && pnpm test` | 0 | Re-run independently after the phase commit: typecheck, lint, and format clean; 205/205 tests passed |

Working tree clean after the phase commit; the diff for `f68a407..HEAD` is
exactly the three declared `Touches` paths.
