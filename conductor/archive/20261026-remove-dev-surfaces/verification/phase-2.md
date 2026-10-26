# Phase 2 — Admin dashboard truthfulness

- **Track:** `20261026-remove-dev-surfaces` — Remove Dev Surfaces and Admin Dead Ends
- **Phase:** 2
- **Date:** 2026-10-26
- **Branch:** `chore/20261026-remove-dev-surfaces`
- **Base:** `112adaed804df299e22f6abdd8d29bc25cc54dd4`
- **Head:** `17ecf67`
- **Result:** verified

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| static | `pnpm type-check` | 0 | `tsc --noEmit` clean, including both typed `Link` targets |
| static | `pnpm lint` | 0 | 163 files; 22 pre-existing warnings, 0 errors |
| static | `pnpm format:check` | 0 | Biome check clean |
| unit | `pnpm test` | 0 | 34 files, 88 tests passed |
| source | `grep -n "TODO\|99.9%\|456MB\|CPU:\|Memory:\|Disk:\|System Status" src/routes/admin/index.tsx` | 1 | No matches (expected empty) |
| scope | `git diff --name-only 112adae..HEAD` | 0 | Only `src/routes/admin/index.tsx` |

The phase verification command was run as written:

```text
pnpm type-check && pnpm lint && pnpm format:check
```

It exited `0`. `verify_phase` (`pnpm type-check && pnpm lint && pnpm format:check && pnpm test`)
also exited `0`.

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-4 | The dashboard renders enabled links named "View All" and "Draft New Post" to `/admin/messages` and `/admin/blog/new`, and no TODOs remain. | Source now uses `Link to="/admin/messages"` (line 75) and `Link to="/admin/blog/new"` (line 137); typecheck validates both against the generated route union; TODO grep empty. The rendered assertion is added in Phase 3. | covered at source; rendering test in Phase 3 |
| AC-5 | The rendered dashboard contains no hardcoded system metrics. | The System Status block was deleted; the literal grep returned no matches. The rendered assertion is added in Phase 3. | covered at source; rendering test in Phase 3 |
| NFR-3 | No auth or Convex change. | The only changed file is `src/routes/admin/index.tsx`; `requireAdmin` and every query are untouched. | covered |
| NFR-4 | The new actions are real, keyboard-operable links and no a11y findings appear. | `Link` renders an anchor; Biome's seven a11y rules remain at `error` and report no diagnostics. | covered |
| NFR-5 | No secrets or PII. | Diff contains only the two links, the export keyword, and the removed status block. | covered |

## Evidence paths

- `.conductor/evidence/20261026-remove-dev-surfaces/phase-2-artifacts.txt`
- `git show 17ecf67 --stat`
- `git show 17ecf67 -- src/routes/admin/index.tsx`

## Deviations

None. The only changed path is inside `Touches`.

## Notes

- `Dashboard` is now a named export so Phase 3 can render it directly, matching the
  existing `AdminLayout` and `AdminMessagesInbox` testability pattern.
- The first format check failed on leftover whitespace from removing the status block;
  the structure was repaired and the full gate re-run clean. No behaviour changed.
- An earlier formatting repair briefly joined two closing `div` tags; it was corrected
  before the passing run, and the final diff is the intended 9-insertion/20-deletion
  change.

## Primary verification

Run by the primary agent on `17ecf67`:

| Command | Exit | Result |
| --- | --- | --- |
| `pnpm type-check && pnpm lint && pnpm format:check` | 0 | Clean; 22 pre-existing warnings |
| `pnpm type-check && pnpm lint && pnpm format:check && pnpm test` | 0 | 34 test files, 88 tests |
| `grep -n "TODO\|99.9%\|456MB\|CPU:\|Memory:\|Disk:\|System Status" src/routes/admin/index.tsx` | 1 | No matches |
| `git diff --name-only 112adae..HEAD` | 0 | Only `src/routes/admin/index.tsx` |
