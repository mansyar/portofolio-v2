# Tooling Modernization - Implementation Plan

> **Branch:** `chore/20261024-tooling-modernization`
> **Base:** `main` @ `de0e4b51f56e9c1aa3ee8e714ffc4d3b4978fc64`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.
>
> **Verification gate grows as tools come online.** Phases 1-2 run
> `pnpm type-check && pnpm lint && pnpm test`. From Phase 3 onward the gate is
> `pnpm type-check && pnpm lint && pnpm format:check && pnpm test`, because
> `format:check` does not exist before Biome lands.
>
> **Machine constraint:** this host runs four concurrent projects. Test runs must
> never exceed 4 workers (NFR-2).

## Phase 1: Runtime and dependency pinning

- **Goal:** Node 24 everywhere, pnpm 12.4.1 everywhere, `nitro` pinned, and `pnpm install` exits 0.
- **Depends on:** none
- **Covers:** FR-1, FR-2, FR-3, FR-4, AC-1, AC-2, AC-3, AC-4
- **Touches:** `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.nvmrc`, `.github/workflows/deploy.yml`, `docker/Dockerfile`, `conductor/tech-stack.md`, `conductor/workflow.md`
- **Verification:** `pnpm install --frozen-lockfile && pnpm type-check && pnpm lint && pnpm test`
- **Status:** verified

- [x] **P1.T1: Move CI and the Dockerfile to Node 24** - covers: FR-1
  - [x] Change `node-version: 20` to `24` in `.github/workflows/deploy.yml`
  - [x] Change `FROM node:20-alpine AS base` to `node:24-alpine` in `docker/Dockerfile`
  - [x] Add `.nvmrc` containing `24`
- [x] **P1.T2: Unify pnpm on 12.4.1** - covers: FR-2
  - [x] Add `"packageManager": "pnpm@12.4.1"` to `package.json`
  - [x] Change `pnpm/action-setup` version from `10` to `12.4.1` in CI
  - [x] Change `corepack prepare pnpm@10.1.0` to `pnpm@12.4.1` in the Dockerfile
- [x] **P1.T3: Pin nitro to an exact version** - covers: FR-3
  - [x] Change `"nitro": "latest"` to `"nitro": "3.0.1-alpha.1"`
- [x] **P1.T4: Record the build-script allowlist** - covers: FR-4
  - [x] Create `pnpm-workspace.yaml` with `allowBuilds` set to `true` for `esbuild` and `sharp`
  - [x] Confirm `pnpm install --frozen-lockfile` exits 0 with no `ERR_PNPM_IGNORED_BUILDS`
- [x] **P1.T5: Update context docs for Node 24 and pnpm 12.4.1** - covers: FR-12
  - [x] `conductor/tech-stack.md`: Languages/Runtimes and Tooling rows
  - [x] `conductor/workflow.md`: any Node or pnpm version references

**Result:** verified
**Checkpoint:** edc0ecf
**Evidence:** conductor/tracks/20261024-tooling-modernization/verification/phase-1.md

**Risk:** `nitro@3.0.1-alpha.1` under Node 24 is the unknown in this track. If the
build fails, fall back to pinning the stable `3.0.0` release and record the change.

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261024-tooling-modernization/verification/phase-1.md
-->

## Phase 2: Vitest 5, coverage, and worker cap

- **Goal:** Tests pass on Vitest 5, coverage is measured and gated at a ratcheting floor, and concurrency is capped at 4.
- **Depends on:** Phase 1
- **Covers:** FR-5, FR-6, FR-7, AC-5, AC-6, AC-7
- **Touches:** `package.json`, `pnpm-lock.yaml`, `vite.config.ts`, `vitest.setup.tsx`, `.gitignore`, `conductor/workflow.md`, `conductor/tech-stack.md`
- **Verification:** `pnpm test && pnpm test:coverage`
- **Status:** verified

- [x] **P2.T1: Upgrade Vitest from 3 to 5** - covers: FR-5
  - [x] Bump `vitest` to `^5.0.5`
  - [x] Resolve any config breakage; confirm all 31 tests still pass
  - [x] Confirm the new `clearMocks` default does not affect the form tests
- [x] **P2.T2: Add coverage tooling and the ratchet gate** - covers: FR-6
  - [x] Add `@vitest/coverage-v8@^5.0.5` and a `test:coverage` script
  - [x] Configure `coverage.include` as `["src", "convex"]` and exclude `convex/_generated/**` and `src/routeTree.gen.ts`
  - [x] Measure and record the baseline: 3.91% statements, 10.4% branches, 3.49% functions, 3.93% lines
  - [x] Set thresholds to 3% lines / 3% functions (ratchet at the measured floor, per user decision - the original 40% was unreachable without test expansion, which is out of scope)
- [x] **P2.T3: Cap test workers at 4** - covers: FR-7
  - [x] Set `maxWorkers: 4` in the Vitest config, so a bare `pnpm test` respects it without a CLI flag
- [x] **P2.T4: Enable the coverage gate in workflow.md** - covers: FR-12
  - [x] Set `coverage.gate: true` and record the 3% ratchet thresholds

**Result:** verified
**Checkpoint:** 0b74322
**Evidence:** conductor/tracks/20261024-tooling-modernization/verification/phase-2.md

**Deviation:** the 40% gate in FR-6 was unachievable — measured coverage was 3.93% lines /
3.49% functions. FR-6, AC-6, the goals metric, and the in-scope bullet were amended to a
ratcheting floor at the measured baseline. Also `vitest.setup.tsx` was edited (outside
`Touches`) to import `@testing-library/jest-dom/vitest`, a type-only fix required by
Vitest 5.

## Phase 3: Biome replaces ESLint and Prettier

- **Goal:** One formatter and linter, with `pnpm lint` and `pnpm format:check` both passing.
- **Depends on:** Phase 2
- **Covers:** FR-8, FR-9, AC-8, AC-9
- **Touches:** `package.json`, `pnpm-lock.yaml`, `biome.json`, `eslint.config.js`, `.prettierrc`, `src/**`, `convex/**`, `conductor/workflow.md`, `conductor/code_styleguides/project.md`
- **Verification:** `pnpm type-check && pnpm lint && pnpm format:check && pnpm test`
- **Status:** pending

- [ ] **P3.T1: Install and configure Biome** - covers: FR-8
  - [ ] Add `@biomejs/biome@^2.6.2`
  - [ ] Create `biome.json` preserving current intent: double quotes, 2-space indent, width 100, semicolons, `noExplicitAny` as an error, unused variables as a warning with leading-underscore arguments exempt
  - [ ] Ignore `dist`, `.output`, `.tanstack`, `node_modules`, `convex/_generated`, and `src/routeTree.gen.ts`
- [ ] **P3.T2: Rewire scripts and remove the old tooling** - covers: FR-8
  - [ ] `lint` runs Biome check, `format` runs Biome check with write, and `format:check` runs Biome check
  - [ ] Delete `eslint.config.js` and `.prettierrc`
  - [ ] Remove eslint and prettier devDependencies, including the unresolvable `prettier-plugin-tailwindcss` reference
- [ ] **P3.T3: Apply formatting and resolve lint findings** - covers: FR-8
  - [ ] Run the formatter and review the diff for semantic changes
- [ ] **P3.T4: Add the format check to the verification gate** - covers: FR-9
  - [ ] Set `verify_phase` to include `pnpm format:check`
  - [ ] Fill the `format` command key in the Workflow Config block
  - [ ] Update `conductor/code_styleguides/project.md` to name Biome as the enforcing tool

## Phase 4: Dependency refresh

- **Goal:** Remaining dependencies current within their majors, repository still green.
- **Depends on:** Phase 3
- **Covers:** FR-10, AC-10
- **Touches:** `package.json`, `pnpm-lock.yaml`
- **Verification:** `pnpm type-check && pnpm lint && pnpm format:check && pnpm test && pnpm build`
- **Status:** pending

- [ ] **P4.T1: Update dependencies within current majors** - covers: FR-10
  - [ ] Run a within-major update; confirm no major version changed
- [ ] **P4.T2: Record what was deliberately held back** - covers: FR-10
  - [ ] List every package left at its current version with the reason

## Phase 5: TypeScript 7 and documentation sync

- **Goal:** TypeScript 7.0.2 type-checks clean, and the context docs match reality.
- **Depends on:** Phase 4
- **Covers:** FR-11, FR-12, AC-11, AC-12
- **Touches:** `package.json`, `pnpm-lock.yaml`, `src/**`, `convex/**`, `conductor/tech-stack.md`
- **Verification:** `pnpm type-check && pnpm lint && pnpm format:check && pnpm test && pnpm build`
- **Status:** pending

- [ ] **P5.T1: Upgrade to TypeScript 7.0.2** - covers: FR-11
  - [ ] Bump `typescript` to `7.0.2`
  - [ ] Run the type check and fix errors mechanically, recording each fix
- [ ] **P5.T2: Final documentation consistency pass** - covers: FR-12
  - [ ] `conductor/tech-stack.md`: mark the modernization table done, update versions, resolve the open questions
  - [ ] Confirm every Workflow Config command resolves to a real script
- [ ] **P5.T3: Full verification and evidence** - covers: AC-11, AC-12
  - [ ] Run the complete gate including `pnpm build`
  - [ ] Record evidence for every acceptance criterion

<!--
Review fixes are appended by `conductor-review` as:

## Phase R1: Review Fixes

- **Goal:** Resolve review findings ...
- **Depends on:** Phase 5
- **Covers:** review findings
- **Touches:** ...
- **Verification:** ...
- **Status:** pending

- [ ] **R1.T1: Resolve <finding ID>** - covers: <finding ID>
-->
