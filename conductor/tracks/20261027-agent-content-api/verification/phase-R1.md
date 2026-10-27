# Phase R1 — Review Fixes

- **Track:** 20261027-agent-content-api — Blog Content API for Agent Authoring
- **Phase:** R1
- **Date:** 2026-10-27
- **Branch:** feat/20261027-agent-content-api
- **Base commit:** `9832a93`
- **Head commit:** `1a40b3e`
- **Result:** verified

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| static | `pnpm type-check` | 0 | `tsc --noEmit` clean |
| static | `pnpm lint` | 0 | Biome clean |
| static | `pnpm format:check` | 0 | Biome formatter clean |
| unit | `pnpm test` | 0 | 57 files, 255 tests passed (250 before the fixes, +5 cases) |
| unit | `pnpm test:coverage` | 0 | 41.13% lines / 30.31% functions, above the 40 / 30 gate |
| build | `pnpm build` | 0 | Vite build succeeded |

## Findings resolved

| ID | Severity | Resolution | Test |
| --- | --- | --- | --- |
| F1 | High | A supplied slug is validated against `^[a-z0-9][a-z0-9._-]*$` (max 80) before any read; anything else is a 400 naming the allowed characters. Derived slugs satisfy the pattern by construction. | "rejects an explicit slug a URL cannot carry" (spaces, slash, upper case, leading separator) and "honours an explicit slug that is URL-safe" (including a round-trip read) |
| F2 | Medium | Added the five missing cases: non-boolean `publish`, non-array `tags`, non-string `tags` entry, and both ends of the `limit` clamp. | "rejects a publish flag that is not a boolean", "rejects tags that are not an array of strings", "clamps the limit at both ends" (51 seeded posts → floor 1, ceiling 50) |
| F3 | Low | PATCH reads the body with `readOptionalText`, so a present-but-blank body reaches the converter and is rejected as an empty body rather than reported as a missing field. | "rejects an empty body without changing the stored one" now asserts `body must not be empty` |

## Notes

- The fix was made at the root: validation lives in the mutation that writes the
  row, not only in the HTTP adapter, so any future caller of `create` inherits it.
- No opportunistic changes were made. The diff is the four paths in `Touches`.
- `slugify` and the admin form's own client-side slugification remain separate,
  as before this track; the API's rule is now explicit and enforced server-side.

## Primary verification

| Command | Exit | Result |
| --- | --- | --- |
| `pnpm type-check && pnpm lint && pnpm format:check && pnpm test` | 0 | Re-run after the fix commit: static layers clean, 255/255 tests passed; coverage 41.13 / 30.31 and the build also re-run green |

Working tree clean after the fix commit; the diff for `9832a93..HEAD` is exactly
the four declared `Touches` paths.
