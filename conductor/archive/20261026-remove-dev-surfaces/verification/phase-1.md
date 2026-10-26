# Phase 1 — Remove the dev route surface

- **Track:** `20261026-remove-dev-surfaces` — Remove Dev Surfaces and Admin Dead Ends
- **Phase:** 1
- **Date:** 2026-10-26
- **Branch:** `chore/20261026-remove-dev-surfaces`
- **Base:** `b25dc1e7e3c3544ee4b660b3ad3fa11aadeab80f`
- **Head:** `d84f1e5`
- **Result:** verified

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| static | `pnpm type-check` | 0 | `tsc --noEmit` clean |
| static | `pnpm lint` | 0 | 163 files checked; 22 pre-existing warnings, 0 errors, 0 a11y diagnostics |
| static | `pnpm format:check` | 0 | Biome check clean |
| unit | `pnpm test` | 0 | 34 files, 88 tests passed |
| build | `pnpm build` | 0 | Client, SSR, and Nitro build succeeded in 29.88s |
| artifact | `grep -rl "demo/start\|SSR Demos\|Start Server Functions\|start.server-funcs" .output` | 0 | No matches |
| artifact | `find .output -iname "*demo*" -o -iname "*server-funcs*"` | 0 | No paths |
| scope | `git diff --name-only b25dc1e..HEAD` | 0 | Only the eight deleted files and `src/routeTree.gen.ts` |

The full phase verification command was run as written:

```text
pnpm type-check && pnpm lint && pnpm format:check && pnpm build
```

It exited `0`. `verify_phase` (`pnpm type-check && pnpm lint && pnpm format:check && pnpm test`)
also exited `0`.

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-1 | `src/routes/demo/` does not exist and `src/routeTree.gen.ts` contains no `/demo` route or `Demo*` import. | `test -d` → `ABSENT`; `grep -n "demo\|Demo" src/routeTree.gen.ts` → no matches. The permanent regression guard lands in Phase 3. | covered |
| AC-2 | A clean build contains no demo strings or chunks. | `.output` was removed before the build; string grep and filename scan returned nothing. | covered |
| AC-3 | The demo data module is gone and unreferenced. | `test -f` → `ABSENT`; `grep -rn "demo.punk-songs" src` → no matches. | covered |
| NFR-2 | The generated route tree is tool-produced, not hand-edited. | `src/routeTree.gen.ts` changed only as part of `pnpm build`; the diff removes 483 lines across nine files with no manual edits. | covered |
| NFR-1 | Dependencies unchanged. | `git diff --name-only b25dc1e..HEAD -- package.json pnpm-lock.yaml` → empty. | covered |
| NFR-3 | No Convex or auth change. | `git diff --name-only b25dc1e..HEAD -- convex` → empty. | covered |
| NFR-5 | No secrets or PII. | Diff contains only route deletions and generated-tree removals. | covered |

## Evidence paths

- `.conductor/evidence/20261026-remove-dev-surfaces/phase-1-artifacts.txt`
- `src/routeTree.gen.ts` diff
- `git show d84f1e5 --stat`

## Deviations

None. Every changed path is inside `Touches`.

## Notes

- No standalone `tsr` generator is installed, so the router plugin regenerated
  `src/routeTree.gen.ts` during `pnpm build`. Phase 4 runs the authoritative build on the
  integrated HEAD.
- Lint warnings remain at 22, all pre-existing and outside this track. Checked file count
  fell from 171 to 163 because eight files were deleted.
- The build output was removed before building, so the artifact scan cannot be satisfied
  by stale chunks.

## Primary verification

Run by the primary agent on `d84f1e5`:

| Command | Exit | Result |
| --- | --- | --- |
| `pnpm type-check && pnpm lint && pnpm format:check && pnpm build` | 0 | Clean; 22 pre-existing warnings |
| `pnpm type-check && pnpm lint && pnpm format:check && pnpm test` | 0 | 34 test files, 88 tests |
| `grep -rl "demo/start\|SSR Demos\|Start Server Functions\|start.server-funcs" .output` | 0 | No matches |
| `git diff --name-only b25dc1e..HEAD` | 0 | Exactly the expected nine paths |
