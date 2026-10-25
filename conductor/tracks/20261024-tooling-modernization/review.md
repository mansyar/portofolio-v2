# Track Review — Tooling Modernization

Track: `20261024-tooling-modernization`
Reviewed: 2026-10-25
Base: `de0e4b51f56e9c1aa3ee8e714ffc4d3b4978fc64`
Head at review: `e93a1e9`
Reviewer: `conductor-reviewer` subagent

## Verdict

**PASS WITH FINDINGS** — the track meets its contract; ten findings were raised, none
blocking. All ten were resolved in Phase R1.

## What was verified independently

- `pnpm type-check` clean on TypeScript 7.0.2, with the `tsc` bin resolving to the native
  compiler rather than a shim.
- `pnpm lint` and `pnpm format:check` both exit 0 — 149 files, 100 warnings, 0 errors.
- `pnpm test` — 31 tests across 12 files on Vitest 5.0.5.
- `noExplicitAny` still at `"error"`.
- All four `biome-ignore` sites legitimate: two runtime-generated route casts, the
  TanStack Router `Wrap` factory, and one rendered-text line.
- Lockfile consistent: 55 importer specifiers against 37 dependencies + 17 devDependencies
  + `packageManager`.
- The TanStack hold-back rationale is accurate — `react-start` 1.169.4 declares
  `vite: ">=8.0.0"`, 1.145.3 declares `vite: ">=7.0.0"`.
- No major version changed anywhere.
- `tsconfig.json` lost only `baseUrl`; every strictness flag intact.
- Generated files untouched by the diff and excluded from both Biome and coverage.
- The 140-file reformat is behaviour-preserving per the AST-equivalence proof.

## Findings

| ID | Sev | Area | Resolution |
| --- | --- | --- | --- |
| F1 | Medium | Coverage-gate amendment incomplete (FR-12 and track index still said 40%) | Fixed |
| F2 | Medium | Security rule demoted to `warn` | Fixed — restored to `error` with one targeted suppression |
| F3 | Medium | a11y demotions exceeded the documented known gaps | Fixed — fourth known-gap row added |
| F4 | Medium | `.agent/workflows/` still prescribed ESLint/Prettier commands | Fixed |
| F5 | Medium | Phase-executor allowlist permitted dependency mutation | Fixed — narrowed |
| F6 | Medium | `docs/PRD.md` re-emitted whole (1146/1145 for a 4-line change) | Fixed — diff now 4/3 |
| F7 | Low | Three inconsistent gate definitions | Fixed |
| F8 | Low | AC-7 demanded evidence the phase did not produce | Fixed — amended to the config-based criterion |
| F9 | Low | Style guide cited retired tools | Fixed |
| F10 | Low | "No workspace" constraint contradicted `pnpm-workspace.yaml` | Fixed — constraint clarified |

## Requirements coverage

All twelve functional requirements and all five non-functional requirements are covered.
NFR-4 (CI green including the Docker build) is not locally verifiable — the Docker stage
runs only in GitHub Actions, and the spec names CI as the authority for it.

## Doc sync

`README.md`, `docs/PRD.md`, `conductor/tech-stack.md`, `conductor/workflow.md`, and
`conductor/product-guidelines.md` were synchronised with the new toolchain. Doc sync
recorded as **complete** in `metadata.json`.

## Notes carried forward

- The 99 remaining Biome warnings are pre-existing debt, now recorded in both
  `product-guidelines.md` (a11y subset) and `tech-stack.md` open question 3 (promotion
  order). They are not hidden — they are visible on every run.
- The TanStack Router family is pinned to exact versions at its pre-track values, so a
  future `pnpm update` cannot silently re-cross the Vite 8 boundary.
- Vite 8 migration is recorded as open question 5 in `tech-stack.md`.
