# Phase 2 — Vitest 5, coverage, and worker cap

- **Track:** `20261024-tooling-modernization` — Tooling Modernization
- **Phase:** 2 — Vitest 5, coverage, and worker cap
- **Date:** 2026-10-25
- **Branch:** `chore/20261024-tooling-modernization`
- **Base commit:** `43b10a41cbe72b505b904d2c7f74926fb17ae9ad`
- **Head commit:** `9935328794aa43a82d7fc49841d86269680fc842`

## Result

`blocked`

The Vitest 5 upgrade, the coverage tooling and configuration, and the 4-worker cap
are all landed and green. The **coverage baseline could not be measured**: every
invocation of `pnpm test:coverage` returned `Permission denied: shell`, so P2.T4
and P2.T5 (measure the baseline, then decide the threshold) are unresolved and
**no `coverage.thresholds` block was written**. The primary agent must run the
command and hand back the numbers.

This is the escalation the brief asks for, not a silent pass: the gate is absent
from the config rather than guessed at.

## Commands

Verification ran as separate commands, per project convention.

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| install | `pnpm install` | 0 | `vitest 3.2.4 → 5.0.5`; lockfile regenerated |
| install | `pnpm install` | 0 | `+ @vitest/coverage-v8 5.0.5` |
| static | `pnpm type-check` | 0 | `tsc --noEmit`, no diagnostics (after the two mechanical fixes below) |
| static | `pnpm lint` | 0 | `eslint .`, no findings |
| unit | `pnpm test -- --maxWorkers=4` | 0 | Vitest v5.0.5 — 12 files, 31 tests, 5.72s |
| unit | `pnpm test -- --maxWorkers=1` | 0 | 12 files, 31 tests, 15.01s — confirms the suite is not order- or concurrency-dependent |
| unit | `pnpm test` (bare, cap from config) | 0 | Vitest v5.0.5 — 12 files, 31 tests, 10.59s |
| unit | `pnpm test:coverage` | — | **`Permission denied: shell`** — see `blockers` |

`pnpm test` is not a chained command here; the phase's `&&` form was run as its two
constituent commands.

## Coverage baseline

**Not measured.** `pnpm test:coverage` was denied by the permission layer before it
ran, so there are no lines, functions, statements, branches, or per-file numbers to
report. No threshold was set, and none was lowered — `vite.config.ts` contains no
`coverage.thresholds` key.

What *is* in place and type-checks:

```ts
coverage: {
  provider: 'v8',
  include: ['src', 'convex'],
  exclude: [
    ...coverageConfigDefaults.exclude,
    'convex/_generated/**',
    'src/routeTree.gen.ts',
  ],
},
```

`coverageConfigDefaults.exclude` is spread first so Vitest's own default excludes
(`node_modules`, `dist`, `coverage`, `**/*.d.ts`, `**/*.config.*`, and the rest) are
preserved rather than replaced — the brief's explicit instruction. The two additions
are exactly the two the spec names, FR-6. No file was added to `exclude` to move a
number.

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-5 | `pnpm test` reports 31 passing tests and Vitest 5.0.5 | Bare `pnpm test` → `RUN v5.0.5`, `Test Files 12 passed (12)`, `Tests 31 passed (31)`, exit 0 | pass |
| AC-6 | `pnpm test:coverage` exits 0 and reports at least 40% lines and 40% functions | Tooling and config landed, but the command was permission-denied, so neither the exit code nor the percentages are known and no threshold is set | **blocked** |
| AC-7 | A test run log shows at most 4 workers active | `vite.config.ts` sets `maxWorkers: 4` in `test`, and a bare `pnpm test` (no `--maxWorkers`) passes — the cap applies without a CLI flag. `pnpm type-check` validates the key against `InlineConfig` (`maxWorkers?: number \| string`) | pass |
| FR-5 | Vitest upgraded to 5.0.5; all 31 tests pass | `package.json` `"vitest": "^5.0.5"`, resolved 5.0.5; 31 tests pass | pass |
| FR-7 | Concurrency capped in config, not by flag | `maxWorkers: 4` in `test` | pass |
| — | No regression against the phase baseline | `pnpm type-check` 0, `pnpm lint` 0, `pnpm test` 31/12 — identical to the phase base | pass |

### Vitest 5 `clearMocks` default (P2.T1.3)

Verified rather than assumed. Both form tests already reset mocks themselves:

- `src/components/features/__tests__/UsesItemForm.test.tsx` line 23 — `vi.clearAllMocks()` in `beforeEach`
- `src/components/features/__tests__/ProjectForm.test.tsx` line 32 — `vi.clearAllMocks()` in `beforeEach`, plus `mockMutate.mockClear()` at line 38

Both suites pass under the new default. No assertion in either file depends on
mock state surviving between tests, which is what a `clearMocks` default change
would have broken. No change was needed.

## Evidence paths

- `conductor/tracks/20261024-tooling-modernization/verification/phase-2.md` (this file)
- Commits: `935218b` (Vitest 5.0.5), `9935328` (coverage tooling, `maxWorkers: 4`)

## Deviations

- **`vitest.setup.tsx` was edited, and it is outside `Touches`.** `pnpm type-check`
  failed with 36 `TS2339` errors — every `toBeInTheDocument`, `toHaveValue`,
  `toHaveTextContent`, and `toBeChecked` assertion in six test files. `import
  '@testing-library/jest-dom'` resolves to `types/index.d.ts`, which only pulls in
  the *jest* global augmentation; under Vitest 5 the chai `Assertion` type is no
  longer structurally compatible with jest's `Matchers`, so the matchers stop being
  visible to `tsc`. The one-line fix is `import '@testing-library/jest-dom/vitest'`,
  which augments `declare module 'vitest'` directly. This is a mechanical fix to the
  matcher type augmentation, not a behaviour change: the setup file's runtime
  behaviour is unchanged, and no test assertion was edited.
- **`vite.config.ts` now imports `defineConfig` from `vitest/config` instead of
  `vite`, and the `/// <reference types="vitest" />` triple-slash directive is
  gone.** Vitest 5 no longer ships a global augmentation of `vite`'s `UserConfig`,
  so `test` was rejected with `TS2769: 'test' does not exist in type
  'UserConfigExport'`. Typing the config through `vitest/config` is the supported
  route and is a type-only change — the emitted config object is identical.

## Notes

- **Worker cap discipline held throughout.** Every exploratory run used
  `--maxWorkers=4` or `--maxWorkers=1`; after P2.T3 landed, bare `pnpm test`
  resolved the cap from config. No run exceeded 4 workers.
- **`deps.optimizer.web` now logs a deprecation warning** on every run
  (`use deps.optimizer.client instead`). It is still a valid key and the brief says
  to leave it alone, so it was left alone. It is a warning, not a failure, and it
  does not affect the exit code.
- **The `Isolate 12 workers spawned` line in Vitest 5's summary is per-file worker
  spawning over the life of the run, not concurrency.** It reads alarmingly against
  AC-7 but reports 12 sequential per-file workers for 12 files; `maxWorkers: 4`
  governs how many run at once.
- **Report files now land in `.vitest/`**, per the Vitest 5 artifact-directory
  change. Nothing in the repo referenced the old locations.
- **`coverage/` is already gitignored** (`.gitignore` line 55), so a successful
  coverage run leaves nothing untracked. **`.vitest/` is not** — Vitest 5's new
  artifact directory would show up as untracked once a run writes to it. Nothing was
  committed from it here (the coverage run never executed), but it belongs in
  `.gitignore` alongside `coverage/`.
- **P2.T4 was not attempted**, per the brief. `conductor/workflow.md` still carries
  `coverage.gate: false`.

## Primary verification

The subagent completed P2.T1 and P2.T3 and configured coverage, but pnpm test:coverage
was refused by its permission layer, so the coverage baseline was never measured and no
threshold was set. The primary ran the measurement, applied the threshold, and re-ran
every check.

### Measured coverage baseline

First run with no thresholds configured, Vitest 5.0.5, v8 provider, scope `src` +
`convex`:

| Metric | Coverage | Covered / Total |
| --- | --- | --- |
| Statements | **3.91%** | 82 / 2096 |
| Branches | **10.4%** | 133 / 1278 |
| Functions | **3.49%** | 23 / 659 |
| Lines | **3.93%** | 78 / 1983 |

Only four files have meaningful coverage: `seo.tsx` (100% lines),
`UmamiScript.tsx` (100%), `blog-card.tsx` (100%), `project-card.tsx` (100%),
`ProjectForm.tsx` (69.69%), `UsesItemForm.tsx` (76.19%), `terminal-window.tsx`
(33.33%). Every route, every Convex module, and most UI components are at 0%.

**This contradicted the spec.** FR-6 asked for a 40% gate; reaching 40% means covering
roughly 700 additional lines, which is exactly the "expanding test coverage" the spec
lists under Out of Scope. The two could not both hold.

**Resolution (user decision):** the gate became a **ratchet at the measured floor**
rather than a target. FR-6, AC-6, the goals metric, the in-scope bullet, and the
edge-case entry were all amended in `spec.md` to say so. The gate now blocks
regressions immediately, which is its real job, without demanding a test suite this
track was never scoped to write.

### Threshold applied

`vite.config.ts` now sets `coverage.thresholds: { lines: 3, functions: 3 }` — just
below the measured 3.93 / 3.49 so it passes today but fails on any regression.

### Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| unit | `pnpm test` | 0 | 12 files, 31 tests, bare invocation, 4-worker cap from config |
| coverage | `pnpm test:coverage` | 0 | 12 files, 31 tests, thresholds satisfied |
| static | `pnpm type-check` | 0 | clean |
| static | `pnpm lint` | 0 | clean |

### Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-5 | All 31 tests pass on Vitest 5.0.5 | `pnpm test` exit 0, 12 files / 31 tests | Met |
| AC-6 | `test:coverage` exits 0 at or above the ratchet floor, baseline recorded | 3.93% lines / 3.49% functions measured and recorded above; threshold 3/3; exit 0 | Met (as amended) |
| AC-7 | Test run never exceeds 4 workers | `maxWorkers: 4` in config; bare `pnpm test` passes with no flag | Met |

### Documentation (P2.T4), applied by the primary

- `conductor/workflow.md` — `coverage.gate` flipped to `true` with explicit
  `lines: 3` / `functions: 3` thresholds; the "Coverage gate is intentionally off"
  section replaced with "Coverage gate is a ratchet"; the pass-criteria line now treats
  coverage as required; the stale `NOT YET DEFINED` comment on the coverage command
  removed.
- `conductor/tech-stack.md` — Tooling table updated to Vitest 5 / coverage-v8 /
  `maxWorkers: 4`; Coverage policy rewritten around the ratchet; the open question
  about the 40% placeholder updated to the new floor.
- `.gitignore` — added `.vitest/` beside `coverage/`, since Vitest 5 writes
  artifacts to a new directory.

**Result: verified.**
