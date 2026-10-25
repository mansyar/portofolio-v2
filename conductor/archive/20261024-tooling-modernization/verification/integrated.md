# Integrated Verification — `20261024-tooling-modernization`

Full verification strategy run on the completed branch, not per phase.

| Field | Value |
| --- | --- |
| Track | `20261024-tooling-modernization` — Tooling Modernization |
| Branch | `chore/20261024-tooling-modernization` |
| Base | `main` @ `de0e4b51f56e9c1aa3ee8e714ffc4d3b4978fc64` |
| Final commit | `743410b` |
| Date | 2026-10-25 |
| **Result** | **passed** |

## Layers

The project's verification strategy declares three layers: `static`, `unit`, `build`. All
three were run, plus the coverage gate that Phase 2 added.

| Layer | Command | Exit | Result |
| --- | --- | --- | --- |
| setup | `pnpm install --frozen-lockfile` | 0 | Lockfile up to date, no resolution step, 60ms, pnpm v12.4.1 |
| static | `pnpm type-check` (`tsc --noEmit`, TypeScript 7.0.2) | 0 | clean |
| static | `pnpm lint` (`biome check .`) | 0 | 149 files, **100 warnings, 0 errors** |
| static | `pnpm format:check` (`biome check .`) | 0 | 149 files, no fixes needed |
| unit | `pnpm test` (`vitest run`) | 0 | 12 files, 31 tests passed |
| unit | `pnpm test:coverage` (`vitest run --coverage`) | 0 | gate satisfied, see below |
| build | `pnpm build` (`vite build`) | 0 | client + SSR + nitro, `.output/nitro.json` generated |

## Coverage

| Metric | Measured | Ratchet floor | Status |
| --- | --- | --- | --- |
| Statements | 3.91% (82/2096) | - | - |
| Branches | 10.4% (133/1278) | - | - |
| Functions | 3.49% (23/659) | 3% | pass |
| Lines | 3.96% (79/1993) | 3% | pass |

Lines moved from 3.93% to 3.96% over the track - the Phase 4 dependency refresh removed a
handful of type-only lines from the denominator without removing tests. The floor was not
lowered at any point.

## Acceptance criteria

| AC | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| AC-1 | CI `node-version: 24` and Dockerfile `node:24-alpine` | Met | `deploy.yml:21`, `deploy.yml:67` both `node-version: 24`; `Dockerfile:1` `FROM node:24-alpine AS base`; `.nvmrc` = `24` |
| AC-2 | `packageManager: "pnpm@12.4.1"`, Dockerfile and CI at 12.4.1 | Met | `package.json:5`; `deploy.yml:18` and `:64` `version: 12.4.1`; `Dockerfile:8` `corepack prepare pnpm@12.4.1` |
| AC-3 | `"nitro": "3.0.1-alpha.1"` exactly | Met | `package.json`; no `"latest"` specifier remains anywhere in the manifest |
| AC-4 | Build-script approval configured, `pnpm install` exits 0 | Met | `pnpm-workspace.yaml` `allowBuilds: {esbuild: true, sharp: true}`; frozen install exit 0, no `ERR_PNPM_IGNORED_BUILDS` |
| AC-5 | All 31 tests pass on Vitest 5.0.5 | Met | `pnpm list vitest` -> 5.0.5; 12 files / 31 tests passed |
| AC-6 | `pnpm test:coverage` exits 0 at or above the ratchet floor, baseline recorded | Met | see Coverage table; baseline 3.93%/3.49% recorded in `verification/phase-2.md` |
| AC-7 | Test concurrency capped at 4 | Met | `vite.config.ts` `test.maxWorkers: 4`; bare `pnpm test` honours it |
| AC-8 | `pnpm lint` and `pnpm format:check` exit 0; ESLint and Prettier gone | Met | both exit 0; `eslint.config.js` and `.prettierrc` absent; no eslint/prettier devDependencies |
| AC-9 | `format:check` in the phase gate | Met | `workflow.md` `verify_phase` includes `pnpm format:check`; `format` key is `pnpm format:check` |
| AC-10 | Dependencies current within their majors, repo green | Met | 41 packages moved, 0 major changes, 5 held back with a recorded reason, full gate green |
| AC-11 | TypeScript `7.0.2`, `pnpm type-check` exits 0 | Met | `tsc --version` -> `7.0.2`; type-check exit 0 |
| AC-12 | `tech-stack.md` and `workflow.md` match reality; every Workflow Config command resolves | Met | all nine keys resolve to real scripts; `tech-stack.md` modernization table marked done |

## Toolchain end state

| Concern | Before | After |
| --- | --- | --- |
| Node | 20 (Dockerfile + CI), 24 local | **24** everywhere, declared in `.nvmrc`, CI, Dockerfile |
| pnpm | 10.1.0 Dockerfile, 10 CI, 12.4.1 local | **12.4.1** everywhere, pinned via `packageManager` |
| Lint | ESLint 9 flat config | **Biome 2.6.2** |
| Format | Prettier 3.7, no script, broken plugin reference | **Biome 2.6.2**, `format` + `format:check` |
| Tests | Vitest 3, no coverage | **Vitest 5.0.5** + `@vitest/coverage-v8` 5, ratcheting gate |
| Typecheck | `tsc` 5.7 | **TypeScript 7.0.2** native compiler |
| `nitro` | `"latest"` (resolved to a prerelease) | **`3.0.1-alpha.1`** exact |

## Known boundary

The TanStack Router family is held at its pre-track versions
(`react-start` 1.145.3, `react-router` 1.144.0, `router-plugin` 1.145.2,
`react-router-devtools` 1.144.0, `react-router-ssr-query` 1.144.0).

`@tanstack/react-start` 1.169 declares `vite: ">=8.0.0"` as a peer dependency, so the
newer router cannot run on Vite 7. Attempting it broke the build: the upgraded route
generator parses route ids statically and rejects
`createFileRoute("/feed.xml" as any)`, while removing the cast fails `tsc` because
`/feed.xml` is not in the generated route union. Reconciling that needs either an Escape
route refactor or the Vite 8 upgrade - both outside a within-major refresh.

The five specifiers are pinned to exact versions rather than carets, so a future
`pnpm update` cannot silently re-cross the boundary. Recorded as open question 5 in
`tech-stack.md`.

## Blocking defects

None.

## Notes

- `nitro@3.0.1-alpha.1` builds under Node 24. This was the spec's highest-risk open
  question and it is closed by a successful full production build.
- `convex/_generated/` and `src/routeTree.gen.ts` were never modified. The Convex bump
  (1.31.2 -> 1.48.0) needed no codegen.
- The 100 Biome warnings are pre-existing debt surfaced by the ESLint -> Biome move
  (mostly `useButtonType`, `noLabelWithoutControl`, `noArrayIndexKey`). They are warnings,
  not errors, and are recorded as open question 3 rather than silently silenced.
- `deps.optimizer.web` under Vitest 5 and Rollup `@__PURE__` warnings from `zod` 4.6.7 are
  pre-existing dependency noise, non-fatal, untouched.
