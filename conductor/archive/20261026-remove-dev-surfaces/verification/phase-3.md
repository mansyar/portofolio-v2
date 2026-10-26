# Phase 3 — Regression tests

- **Track:** `20261026-remove-dev-surfaces` — Remove Dev Surfaces and Admin Dead Ends
- **Phase:** 3
- **Date:** 2026-10-26
- **Branch:** `chore/20261026-remove-dev-surfaces`
- **Base:** `21c25f6f7f3cabe38fa6a4b2228903d2d53765bf`
- **Head:** `f75e1c9`
- **Result:** verified

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| static | `pnpm type-check` | 0 | `tsc --noEmit` clean |
| static | `pnpm lint` | 0 | 165 files; 22 pre-existing warnings, 0 errors |
| static | `pnpm format:check` | 0 | Biome check clean after formatting the new test |
| unit | `pnpm exec vitest run src/routes/__tests__/route-surface.test.ts src/routes/__tests__/admin-dashboard.test.tsx` | 0 | 2 files, 7 tests passed |
| unit | `pnpm test` | 0 | 36 files, 95 tests passed |
| mutation | Reintroduced `/demo/probe`, then the route-surface test | 1 (expected) | Guard failed on the probe; probe removed |
| mutation | Retargeted View All to `/admin/projects`, then the dashboard test | 1 (expected) | Test failed on the wrong href; link restored, `git diff` clean |

The phase verification command was run as written:

```text
pnpm exec vitest run src/routes/__tests__/route-surface.test.ts src/routes/__tests__/admin-dashboard.test.tsx
```

It exited `0`. `verify_phase` (`pnpm type-check && pnpm lint && pnpm format:check && pnpm test`)
also exited `0`.

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-1 | No demo directory, data module, generated route, or route declaration. | `route-surface.test.ts`: 4 tests covering directory absence, data-module absence, generated-tree scan, and route-source scan. | covered |
| AC-4 | Dashboard links target `/admin/messages` and `/admin/blog/new`. | `admin-dashboard.test.tsx`: two role-and-name assertions against the rendered `href`. | covered |
| AC-5 | No invented system metrics render. | `admin-dashboard.test.tsx`: asserts the absence of `99.9%`, `456mb`, `CPU:`, `Memory:`, `Disk:`, and `System Status`. | covered |
| AC-7 | Tests fail when the removed surface or a link target returns, and all gates pass on HEAD. | Both mutation runs exited `1` for the intended reason; the probes were reverted (`git diff --exit-code` clean); the full suite and static gate pass. | covered |
| NFR-4 | No new accessibility findings. | Biome's seven a11y rules remain at `error` and report no diagnostics; the dashboard links are anchors asserted by role. | covered |
| NFR-5 | No secrets or PII. | The new tests use fixed literal fixtures only. | covered |

## Evidence paths

- `.conductor/evidence/20261026-remove-dev-surfaces/phase-3-mutation-1.txt`
- `.conductor/evidence/20261026-remove-dev-surfaces/phase-3-mutation-2.txt`
- `src/routes/__tests__/route-surface.test.ts`
- `src/routes/__tests__/admin-dashboard.test.tsx`

## Deviations

None. Both new files are inside `Touches`.

## Notes

- The dashboard test imports `../admin/index` explicitly. `../admin` resolves to the
  layout route `src/routes/admin.tsx`, not the dashboard at `src/routes/admin/index.tsx`;
  the first run failed with an undefined component until the path was corrected.
- The route-surface guard scans route source files rather than only the generated tree,
  so a reintroduced `/demo` declaration fails before regeneration. That is what makes the
  mutation check meaningful.
- The test fixture mocks `convex/react` and the generated `api` module; it requires no
  live Convex deployment.
- Full suite count rose from 88 to 95 tests across 36 files.

## Primary verification

Run by the primary agent on `f75e1c9`:

| Command | Exit | Result |
| --- | --- | --- |
| `pnpm type-check && pnpm lint && pnpm format:check` | 0 | Clean; 22 pre-existing warnings |
| `pnpm exec vitest run src/routes/__tests__/route-surface.test.ts src/routes/__tests__/admin-dashboard.test.tsx` | 0 | 7 tests |
| `pnpm test` | 0 | 36 files, 95 tests |
| `git diff --exit-code -- src/routes/admin/index.tsx` after mutation restore | 0 | No diff |
