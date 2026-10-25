# Phase 1 — Runtime and dependency pinning

- **Track:** `20261024-tooling-modernization` — Tooling Modernization
- **Phase:** 1 — Runtime and dependency pinning
- **Date:** 2026-10-25
- **Branch:** `chore/20261024-tooling-modernization`
- **Base commit:** `5b923c10ac8ac4ccd1e8a5d4fb44a97ce402d7a7`
- **Head commit:** `2fc213f8111ece566a8669b42d1e94f1b7295d8d`

## Result

`blocked`

The runtime and dependency work is complete and green. Task P1.T5 (FR-12, the
`conductor/tech-stack.md` and `conductor/workflow.md` documentation sync) could not be
performed: every `edit` and `write` call against those two files returned
`Permission denied: edit`. The primary agent must apply those edits.

## Commands

Verification ran as four separate commands, per project convention.

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| install | `pnpm install` | 0 | Regenerated `pnpm-lock.yaml` for the pinned `nitro` specifier and `packageManager`; `sharp` postinstall ran under the new `allowBuilds` list |
| install | `pnpm install --frozen-lockfile` | 0 | "Lockfile is up to date, resolution step is skipped / Done in 59ms using pnpm v12.4.1" — no `ERR_PNPM_IGNORED_BUILDS`, no `ERR_PNPM_PACKAGE_MANAGER_REMOVE_MODULES_DIR` |
| static | `pnpm type-check` | 0 | `tsc --noEmit`, no diagnostics |
| static | `pnpm lint` | 0 | `eslint .`, no findings |
| unit | `pnpm test` | 0 | Vitest v3.2.4 — 12 test files passed, 31 tests passed, 4.64s |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-1 | No `node-version: 20` in `.github/workflows/deploy.yml`, no `node:20` in `docker/Dockerfile` | `grep` on deploy.yml returns only `node-version: 24` at lines 21 and 67 (test and deploy jobs); Dockerfile line 1 is `FROM node:24-alpine AS base` | pass |
| AC-2 | `packageManager` is `pnpm@12.4.1`; no `pnpm@10` in Dockerfile or CI | `package.json` line 5 `"packageManager": "pnpm@12.4.1"`; Dockerfile line 8 `corepack prepare pnpm@12.4.1 --activate`; deploy.yml lines 18 and 64 `version: 12.4.1` | pass |
| AC-3 | `nitro` pinned to an exact version | `package.json` line 39 `"nitro": "3.0.1-alpha.1"` — no caret, tilde, or range. Lockfile importer entry records `specifier: 3.0.1-alpha.1` with the same resolved `version`, so the pin locked in the version that `latest` had already been resolving to | pass |
| AC-4 | `pnpm install --frozen-lockfile` exits 0 with no ignored-builds error | Exit 0 with the frozen lockfile; output contains no `ERR_PNPM_IGNORED_BUILDS`. `pnpm-workspace.yaml` carries `allowBuilds: {esbuild: true, sharp: true}`, the pnpm 12 replacement for `pnpm.onlyBuiltDependencies` | pass |
| AC-1..AC-4 | No regression against the phase baseline | `pnpm type-check`, `pnpm lint`, and `pnpm test` all exit 0; 31 tests across 12 files, matching the pre-phase baseline exactly | pass |
| FR-12 (doc portion) | `tech-stack.md` and `workflow.md` describe Node 24 and pnpm 12.4.1 as current | Not applied — see `blockers` in the phase report | **blocked** |

## Evidence paths

- `conductor/tracks/20261024-tooling-modernization/verification/phase-1.md` (this file)
- Commits: `51ab999` (Node 24 + pnpm 12.4.1 in CI and Docker, `.nvmrc`), `2fc213f` (nitro pin, `packageManager`, `allowBuilds`, lockfile)

## Deviations

- **`docker/Dockerfile` and `.github/workflows/deploy.yml` were rewritten in full rather
  than patched.** Both files are stored CRLF in the git index while the working tree is
  LF and the repository has no `.gitattributes`. The first targeted edits rewrote every
  line, producing a 125-insertion/124-deletion diff for a four-line content change.
  Rewriting each file with LF content brought the diff to the actual change size
  (`--numstat` against the phase base: 4/4 for deploy.yml, 2/2 for Dockerfile). No
  content outside the Node and pnpm pins changed.
- **`.nvmrc` and `pnpm-workspace.yaml` are new files at the repository root.** Both are
  inside the phase's `Touches` list.

## Notes

- **The Docker image build is not verified locally.** The Dockerfile change is confirmed
  by static inspection only; per the track spec, CI is the authority for the image build,
  so this phase makes no claim that the image builds or boots.
- **`pnpm test` ran at the tool's default concurrency.** The 4-worker cap is FR-7 and
  lands in Phase 2, which owns `vite.config.ts`. The suite completed in 4.64s with no
  worker-related contention.
- **Two stray untracked files remain in the repository root:** `parent-deploy.txt` and
  `parent-dockerfile.txt`. They were created with `git show <base>:<path> > <file>` as
  comparison baselines for the line-ending investigation above. Every deletion attempt
  (`rm`, `del`, `move`, `Remove-Item`, and moving them out of the tree) was refused with
  `Permission denied: shell`, so they could not be removed. They are untracked and were
  deliberately left out of both commits; the primary should delete them.
- The `nitro@3.0.1-alpha.1` pin was not exercised by a build in this phase — `pnpm build`
  belongs to Phase 4's gate. The version is the one already installed and working on this
  machine's Node 24.16.0.

## Primary verification

Run independently by the primary agent after the phase subagent reported, because the
subagent's permission set denies `edit` on `conductor/**` and therefore could not
complete P1.T5. The primary applied the documentation edits and re-ran every check.

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| install | `pnpm install --frozen-lockfile` | 0 | Lockfile up to date, resolution skipped, no `ERR_PNPM_IGNORED_BUILDS`, pnpm v12.4.1 |
| static | `pnpm type-check` | 0 | `tsc --noEmit` clean |
| static | `pnpm lint` | 0 | `eslint .` clean |
| unit | `pnpm exec vitest run --maxWorkers=4` | 0 | 12 files, 31 tests passed, 6.03s |

Static acceptance checks:

- No `node-version: 20`, `node:20`, `pnpm@10`, or `version: 10` remains in
  `.github/workflows/deploy.yml` or `docker/Dockerfile`.
- `package.json` line 5 is `"packageManager": "pnpm@12.4.1"` and line 39 is
  `"nitro": "3.0.1-alpha.1"` (exact, no range).
- `.nvmrc` is the three bytes `50 52 10` — `24` plus a trailing newline.
- `pnpm-workspace.yaml` contains only the `allowBuilds` map for `esbuild` and `sharp`.

Documentation (P1.T5), applied by the primary:

- `conductor/tech-stack.md` — Server runtime and Package manager rows now state the
  pinned versions; the "runtime drift is an accepted gap" paragraph replaced with a
  statement that runtime is pinned consistently; Runtime and Reproducibility rows of the
  modernization table marked **Done**; the "intended production runtime" assumption
  corrected.
- `conductor/workflow.md` — guiding principle 2 no longer lists Node 24 as pending work.

Housekeeping:

- Two untracked diagnostic files (`parent-deploy.txt`, `parent-dockerfile.txt`) that
  the subagent could not delete were removed by the primary.

**Result: verified.** Every executable check passes, all four acceptance criteria for this
phase are met, and the two tasks the subagent could not complete were finished by the
primary.
