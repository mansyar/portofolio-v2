# Tooling Modernization - Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

Bring the toolchain to a single, pinned, modern baseline: Node 24, pnpm 12.4.1,
Biome replacing ESLint + Prettier, Vitest 5 with coverage and a ratcheting gate, a pinned
`nitro`, and TypeScript 7. No product behavior changes.

## Problem / Motivation

| Problem | Consequence |
| --- | --- |
| CI and Dockerfile run Node 20 | Node 20 is past end of life, and it blocks the Vitest 5 upgrade, which requires Node `^22.12.0 \|\| ^24.0.0` |
| `nitro: "latest"` | Resolves to a prerelease (`3.0.1-alpha.1` installed today). A fresh install can pull a different alpha, in a repository that auto-deploys on merge. |
| pnpm is 12.4.1 locally, 10 in CI, 10.1.0 in the Dockerfile | Lockfile resolution and install behavior can differ per environment |
| ESLint and Prettier both configured | `.prettierrc` references `prettier-plugin-tailwindcss`, which is not installed, so Prettier cannot run at all and there is no formatting command |
| No coverage tooling | `workflow.md` carries `coverage.gate: false`; no track can fail on coverage |
| `pnpm install` exits 1 | pnpm 12 blocks the `esbuild` and `sharp` postinstall scripts; CI installs would fail |

## Goals & Success Metrics

- **Goal:** one pinned version per tool, one formatter and linter, coverage measured
  and gated.
- **Metric:** `pnpm install` exits 0; all 31 tests pass on Vitest 5; coverage measured
  and gated at a floor no lower than the recorded baseline; `pnpm lint` and
  `pnpm format:check` pass under
  Biome; CI green including the Docker build stage; no `"latest"` version spec
  remains in `package.json`.

## Scope

### In Scope

- Node 24 in CI and the Dockerfile
- pnpm 12.4.1 unified across local, CI, and Docker
- `nitro` pinned to an exact version
- Build-script allowlist so `pnpm install` exits 0
- Vitest 5, `@vitest/coverage-v8` 5, and a ratcheting coverage gate
- Test concurrency capped at 4 workers
- Biome replacing ESLint and Prettier, with `lint`, `format`, and `format:check`
- Dependency refresh within current majors
- TypeScript 7
- `conductor/tech-stack.md` and `conductor/workflow.md` updated to match

### Out of Scope

- Product features or behavior changes of any kind
- Dependency major bumps that change runtime behavior (React, TanStack, Convex)
- The accessibility gaps recorded in `product-guidelines.md`
- Expanding test coverage (this track gates coverage, it does not write tests)
- Rewriting `docs/PRD.md` or `docs/PROGRESS.md`

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | CI uses `node-version: 24`; Dockerfile uses `node:24-alpine` | must |
| FR-2 | `packageManager: "pnpm@12.4.1"`; Dockerfile `corepack prepare pnpm@12.4.1`; CI `pnpm/action-setup` at `12.4.1` | must |
| FR-3 | `nitro` pinned to exactly `3.0.1-alpha.1` — no range, no `latest` | must |
| FR-4 | Build-script approval recorded in `pnpm-workspace.yaml` via `allowBuilds` for `esbuild` and `sharp`; `pnpm install` exits 0 | must |
| FR-5 | Vitest upgraded to `5.0.5`; all 31 existing tests pass | must |
| FR-6 | `@vitest/coverage-v8@5.0.5` plus a `test:coverage` script, covering `src/` and `convex/` while excluding `convex/_generated/**` and `src/routeTree.gen.ts`. The gate is a **ratcheting floor**, not a 40% target: it starts just below the measured baseline (3% lines, 3% functions) so it blocks regressions, and is raised whenever a track adds tests. Never lowered to make a phase pass. *(Amended during Phase 2: the original 40% target was unreachable — measured baseline was 3.93% lines / 3.49% functions — and reaching it would have required the test expansion this spec puts out of scope.)* | must |
| FR-7 | Test concurrency capped at 4 workers, enforced in config so bare `pnpm test` respects it | must |
| FR-8 | Biome replaces ESLint and Prettier: `eslint.config.js` and `.prettierrc` deleted, eslint and prettier devDependencies removed, `lint` runs Biome, `format` and `format:check` added | must |
| FR-9 | `format:check` added to the phase verification gate in `conductor/workflow.md` | must |
| FR-10 | Remaining dependencies refreshed to latest compatible within their current majors | should |
| FR-11 | TypeScript upgraded to `7.0.2`; `pnpm type-check` exits 0 | must |
| FR-12 | `conductor/tech-stack.md` and `conductor/workflow.md` updated: Node 24, pnpm 12.4.1, Biome, TypeScript 7, `coverage.gate: true` at 40, a real `format` command | must |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | Zero product behavior change — no route, component, Convex function, or schema is modified for behavior |
| NFR-2 | Verification must not saturate the host: at most 4 test workers, because this machine runs four concurrent projects |
| NFR-3 | Every phase leaves the repository independently green and revertable |
| NFR-4 | Full CI must pass, including the Docker build stage |
| NFR-5 | No new `any`, no new accessibility regression, no committed secrets |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | `node-version: 20` and `node:20` no longer appear in `.github/workflows/deploy.yml` or `docker/Dockerfile` | FR-1 |
| AC-2 | `packageManager` is `pnpm@12.4.1`, and no `pnpm@10` remains in the Dockerfile or CI | FR-2 |
| AC-3 | `package.json` declares `"nitro": "3.0.1-alpha.1"` exactly | FR-3 |
| AC-4 | `pnpm install --frozen-lockfile` exits 0 with no ignored-builds error | FR-4 |
| AC-5 | `pnpm test` reports 31 passing tests and Vitest 5.0.5 | FR-5 |
| AC-6 | `pnpm test:coverage` exits 0 and reports coverage at or above the configured ratchet floor (3% lines, 3% functions), with the measured baseline recorded as evidence | FR-6 |
| AC-7 | A test run log shows at most 4 workers active | FR-7 |
| AC-8 | `pnpm lint` and `pnpm format:check` exit 0, and `eslint.config.js` and `.prettierrc` are absent | FR-8 |
| AC-9 | `workflow.md` `verify_phase` contains a format check | FR-9 |
| AC-10 | No dependency that could be updated within its current major was left behind without a recorded reason | FR-10 |
| AC-11 | `pnpm type-check` exits 0 on TypeScript 7.0.2 | FR-11 |
| AC-12 | `workflow.md` shows `coverage.gate: true` and a non-empty `format` command | FR-12 |

## Edge Cases

- **Biome reports violations ESLint allowed.** Fix them mechanically. If a rule change
  would alter code meaning, stop and report rather than silently disabling the rule.
- **Coverage lands below the gate.** This actually happened: the baseline was 3.93%
  lines / 3.49% functions, far below the original 40% target. Resolved by converting
  the gate into a ratchet at the measured floor rather than adding tests, since test
  expansion is out of scope for this track. Never add hollow tests, and never lower the
  gate below the recorded baseline to make a phase pass.
- **Vitest 5 enables `clearMocks` by default.** Both form tests already call
  `vi.clearAllMocks()` in `beforeEach`, so no impact is expected — verify it.
- **TypeScript 7 rejects a dependency's type definitions.** A small mechanical fix is
  allowed and must be recorded in the phase result.
- **`nitro@3.0.1-alpha.1` fails to build under Node 24.** This is the highest-risk
  interaction in the track. The build phase must catch it; the fallback is pinning
  the stable `3.0.0` release.
- **The Docker build cannot be verified locally.** CI is the authority for that
  stage; a phase may not claim it verified locally.

## Dependencies

- **Tracks:** none
- **External:** npm registry, GitHub Actions, Docker Hub (`DOCKERHUB_TOKEN`), and the
  Coolify webhook. Verification requires no live Convex instance.

## Open Questions & Assumptions

- **Question:** Does `nitro@3.0.1-alpha.1` build correctly under Node 24? Unknown until
  Phase 1 runs the build.
- **Assumption:** `@vitest/coverage-v8@5.0.5` peer-locks to `vitest@5.0.5` exactly, so
  both must move in the same phase.
- **Assumption:** Biome can express the existing `@typescript-eslint/no-explicit-any:
  error` and `no-unused-vars` with `argsIgnorePattern: ^_` intent. If not, the closest
  equivalent is used and recorded.
- **Assumption:** the dependency refresh (FR-10) stays within current majors, so it
  cannot introduce breaking changes.

## References

- `conductor/tech-stack.md` — Planned Modernization table
- `conductor/workflow.md` — Workflow Config and Verification Strategy
- [Vitest 5 migration guide](https://vitest.dev/guide/migration/)
- `docs/PRD.md` — Technical Stack
