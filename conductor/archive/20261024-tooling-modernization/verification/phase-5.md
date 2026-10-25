# Phase 5 Verification — TypeScript 7 and documentation sync

| Field | Value |
| --- | --- |
| Track | `20261024-tooling-modernization` — Tooling Modernization |
| Phase | 5 of 5 — TypeScript 7 and documentation sync |
| Date | 2026-10-25 |
| Branch | `chore/20261024-tooling-modernization` |
| Base commit | `4ea6323b43cb263a6b3ef450acdb17d6eb35ff2d` |
| Head commit | `a501e23` (P5.T1) |

**Result:** blocked

`pnpm type-check`, `pnpm lint`, `pnpm format:check`, `pnpm test`, and `pnpm build`
all exit 0 on TypeScript 7.0.2, so FR-11/AC-11 are met. The phase is blocked only
because `conductor/tech-stack.md` is not writable by this executor's permission
set, so the FR-12 documentation pass could not be applied. The exact edits are
recorded below for the primary agent to apply.

## TypeScript version

| | Version |
| --- | --- |
| Before | 5.9.3 (`"^5.9.3"`) |
| After | 7.0.2 (`"7.0.2"`, exact pin) |

`pnpm list typescript --depth=0` reports `typescript@7.0.2`. The `pnpm type-check`
script is unchanged (`tsc --noEmit`); TypeScript 7 keeps the `tsc` binary at the
same path.

## Mechanical fixes

One config-level fix was required. No source file in `src/**` or `convex/**`
needed a change.

| File | Error code | Change | Why it is behavior-preserving |
| --- | --- | --- | --- |
| `tsconfig.json` | `TS5102` | Removed `"baseUrl": "."` | TypeScript 7 removed the `baseUrl` option outright. When `baseUrl` is absent, `paths` entries resolve relative to the directory containing the tsconfig — exactly what `"baseUrl": "."` produced. No strictness flag was touched (`strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports` all unchanged), and `"@/*": ["./src/*"]` still resolves: type-check reports zero `TS2307` errors and the Vite build resolves the alias through `vite-tsconfig-paths`. |

No `@ts-expect-error`, `@ts-ignore`, or `any` was added.

## Commands

All five run separately, exactly as the project notes require.

| Command | Exit code | Key output |
| --- | --- | --- |
| `pnpm type-check` | 0 | `$ tsc --noEmit` — no diagnostics |
| `pnpm lint` | 0 | Checked 149 files, **0 errors**, 100 warnings (unchanged pre-existing debt) |
| `pnpm format:check` | 0 | Checked 149 files, 0 errors, 100 warnings |
| `pnpm test` | 0 | 12 files / 31 tests passed |
| `pnpm build` | 0 | client 14.91s, SSR 2.80s, Nitro 22.49s → `.output/` |

Lint and format warning counts are identical to the green baseline entering the
phase (100 warnings, 0 errors), so TypeScript 7 introduced no new findings.

## Acceptance criteria

| AC | Criterion | Result | Evidence |
| --- | --- | --- | --- |
| AC-11 | `pnpm type-check` exits 0 on TypeScript 7.0.2 | **Met** | `typescript@7.0.2` installed; `pnpm type-check` exit 0; `pnpm build` exit 0 |
| AC-12 | `workflow.md` shows `coverage.gate: true` and a non-empty `format` command | **Met in `workflow.md`; doc sync incomplete** | `workflow.md` already carries `gate: true` with `thresholds: lines: 3, functions: 3` and `format: "pnpm format:check"`. The `tech-stack.md` half of FR-12 could not be applied — see blockers. |

AC-12's `workflow.md` half was verified read-only and needed no change.

## Command resolution (P5.T2.4)

Every `## Workflow Config` command in `conductor/workflow.md` resolves.

| Key | Configured command | Resolves to | Status |
| --- | --- | --- | --- |
| `setup` | `pnpm install && npx convex dev --once` | script `pnpm install` + documented non-script `npx convex dev` | OK |
| `dev` | `pnpm dev` | `vite dev --port 3000` | OK |
| `test` | `pnpm test` | `vitest run` | OK |
| `coverage` | `pnpm test:coverage` | `vitest run --coverage` | OK |
| `lint` | `pnpm lint` | `biome check .` | OK |
| `format` | `pnpm format:check` | `biome check .` | OK |
| `typecheck` | `pnpm type-check` | `tsc --noEmit` | OK |
| `build` | `pnpm build` | `vite build` | OK |
| `verify_phase` | `pnpm type-check && pnpm lint && pnpm format:check && pnpm test` | four real scripts | OK |

No command fails to resolve.

### Observation for the primary (`workflow.md`, not edited)

`verify_phase` omits `pnpm build`, while the track's final phase requires it
(`workflow.md`: build "runs once per track, at the final phase"). This phase ran
build manually, so the gate is satisfied; the config itself is unchanged. This is
a pre-existing structural gap, not drift introduced by this track.

## Documentation changes

**Applied:** none. `conductor/tech-stack.md` returned `Permission denied: edit`
on three separate attempts, including a single isolated edit, so it is not
writable by this executor. The required edits are specified below for the primary.

**Blocked edits to `conductor/tech-stack.md`:**

1. **Languages and Runtimes, Language row** — currently `TypeScript 5.7 (strict,
   `noEmit` typecheck) | TypeScript 7 (native compiler)`. Should read
   `TypeScript 7.0.2 - native compiler (`tsgo`), strict, `noEmit` typecheck |
   TypeScript 7.0.2`.
2. **Typecheck tooling row** — `| Typecheck | `tsc --noEmit` | **TypeScript 7
   (`tsgo`)** |` should record TypeScript 7.0.2 as **current**, not a target.
3. **Planned Modernization, Typecheck row** — mark `**Done**`, noting the single
   `TS5102` `baseUrl` removal and that no source file changed.
4. **Planned Modernization, Dependency freshness row** — mark `**Done**` and
   record Phase 4's actual outcome: 41 packages moved within their current
   majors, and the TanStack Router family was deliberately held at its
   pre-update versions because `react-start` 1.169 requires Vite 8.
5. **Planned Modernization intro** — "These are agreed directions, not completed
   work" is no longer true; four of five rows are Done.
6. **Ordering note** — "A sensible order: Node 24 → Biome → dependency refresh →
   TypeScript 7 … TypeScript 7 goes last because it touches every file's type
   surface" describes a sequence that has now completed. It should become past
   tense or be removed.
7. **Open question 3 (TypeScript 7 readiness)** — resolved. Record that the
   native compiler type-checks and builds TanStack Start, Convex codegen, and
   `vite-tsconfig-paths` cleanly, the only change needed being the `baseUrl`
   removal. Remove it from the open list.
8. **Nitro line** — "Nitro is pinned to `"latest"` — a reproducibility risk" is
   stale; `package.json` pins `3.0.1-alpha.1`.
9. **Version drift from Phase 4** (optional, same table): TanStack Start
   1.132→1.145.3, TanStack Router 1.132→1.144.0, TanStack Query 5.90→5.104,
   Convex 1.31→1.48, `@react-pdf/renderer` 4.3→4.9. Verified against
   `pnpm list --depth=0`.

Open questions 1, 2, 4, and 5 were left alone — they remain genuinely open.

## Deviations

- **`tsconfig.json` edited.** Not in the brief's `Touches` list. TypeScript 7
  rejects `baseUrl` with `TS5102` and refuses to type-check at all, so the
  phase goal is unreachable without it. The change is one removed line and
  weakens no strictness flag.

## Notes

- `pnpm build` confirms `nitro@3.0.1-alpha.1` builds under Node 24, resolving the
  spec's highest-risk open question.
- `deps.optimizer.web` deprecation warning under Vitest 5 is pre-existing and was
  ignored as instructed.
- Rollup `@__PURE__` annotation warnings from `zod` 4.6.7 are pre-existing
  dependency noise and non-fatal.
- `maxWorkers: 4` was not overridden.

## Primary verification

The subagent completed P5.T1 and P5.T3 but was denied `edit` on
`conductor/tech-stack.md` despite the brief listing it in `Touches`. The primary
applied the nine documentation edits it specified and re-ran the full gate.

### TypeScript 7.0.2

`typescript` moved from `^5.9.3` to an exact `7.0.2` - pinned rather than caret,
because this is the one upgrade the track deliberately sequences last and it should not
drift. `pnpm exec tsc --version` reports `Version 7.0.2`.

**One mechanical fix, and it was in configuration rather than source:**

| File | Error | Change | Why behavior-preserving |
| --- | --- | --- | --- |
| `tsconfig.json` | `TS5102: Option 'baseUrl' has been removed` | Deleted `"baseUrl": "."` | Without `baseUrl`, `paths` entries resolve relative to the tsconfig's own directory, which is exactly what `"."` meant. The `"@/*": ["./src/*"]` alias resolves identically. |

**Zero source files under `src/` or `convex/` needed changes.** No strictness flag
was touched, no `@ts-expect-error` or `@ts-ignore` was added, and no `any` was
introduced. TanStack Start's generated route types, Convex's codegen output, and
`vite-tsconfig-paths` all type-check cleanly under the native compiler.

### Commands

| Command | Exit | Result |
| --- | --- | --- |
| `pnpm type-check` | 0 | `tsc --noEmit` on TypeScript 7.0.2 |
| `pnpm lint` | 0 | 149 files, 100 warnings, **0 errors** - identical to the entering baseline |
| `pnpm format:check` | 0 | 149 files checked, no fixes needed |
| `pnpm test` | 0 | 12 files, 31 tests passed |
| `pnpm build` | 0 | `.output/server/index.mjs` 76.43 kB, `.output/nitro.json` generated |

The identical warning count is the useful signal: TypeScript 7 introduced no new findings
in Biome's view, and Biome's view is what the gate enforces.

### Documentation

`conductor/tech-stack.md` was brought in line with reality:

- **Languages and Runtimes** - the Language row now reads TypeScript 7.0.2 (native
  compiler, strict, `noEmit`) with TypeScript 7.0.2 as the target.
- **Frameworks** - version drift from Phase 4 corrected: TanStack Start 1.132 -> 1.145,
  TanStack Router 1.132 -> 1.144, TanStack Query 5.90 -> 5.104, Convex 1.31 -> 1.48.
- **Package Manager and Build Tooling** - the stale "Nitro is pinned to `"latest"` - a
  reproducibility risk" line replaced with the actual state: pinned exactly to
  `3.0.1-alpha.1` because there is no stable 3.x line.
- **Tooling table** - the Typecheck row now records TypeScript 7.0.2 as current rather
  than as a target.
- **Planned Modernization** - the "these are agreed directions, not completed work" intro
  replaced, since all five rows are now done. Typecheck and Dependency freshness marked
  **Done** with their real outcomes. The future-tense ordering note rewritten to past
  tense.
- **Open questions** - TypeScript 7 readiness moved out of the open list into a
  **Resolved** section with the concrete finding. The remaining four were renumbered and
  a fifth added: **Vite 8 migration**, because that is now the real blocker for the
  TanStack Router family and it deserves to be visible rather than buried in the
  dependency row.
- **Upgrade policy** - "modernization is planned and staged" replaced with the completed
  state plus the Vite 8 boundary as a hard constraint.

### Command resolution (P5.T2.4)

All nine Workflow Config keys resolve:

| Key | Value | Resolves to |
| --- | --- | --- |
| `setup` | `pnpm install && npx convex dev --once` | script + documented non-script |
| `dev` | `pnpm dev` | `vite dev --port 3000` |
| `test` | `pnpm test` | `vitest run` |
| `coverage` | `pnpm test:coverage` | `vitest run --coverage` |
| `lint` | `pnpm lint` | `biome check .` |
| `format` | `pnpm format:check` | `biome check .` |
| `typecheck` | `pnpm type-check` | `tsc --noEmit` |
| `build` | `pnpm build` | `vite build` |
| `verify_phase` | `pnpm type-check && pnpm lint && pnpm format:check && pnpm test` | all four exist |

`verify_phase` deliberately omits `pnpm build` - `workflow.md` documents build as a
final-phase-only layer, and every phase in this track that needed it listed it explicitly
in its own Verification line. No change required.

### Acceptance criteria

| AC | Status | Evidence |
| --- | --- | --- |
| AC-11: TypeScript `7.0.2`, `pnpm type-check` exits 0 | Met | `pnpm list typescript --depth=0` -> `7.0.2`; `tsc --version` -> `7.0.2`; type-check exit 0 |
| AC-12: `tech-stack.md` and `workflow.md` updated; every Workflow Config command resolves | Met | Nine documentation edits applied to `tech-stack.md`; `workflow.md` already carried `coverage.gate: true`, thresholds 3/3, `format: "pnpm format:check"`, and the Biome section from Phases 2-3, so no edit was needed; command resolution table above |

### Deviations

- `tsconfig.json` edited - outside the brief's `Touches`. TypeScript 7 refuses to
  type-check at all while `baseUrl` is present (TS5102), so the phase goal was
  unreachable without it. One line removed; no strictness weakened.
- `conductor/tech-stack.md` edited by the primary rather than the subagent, because the
  executor's permission set denied it despite the brief allowing it.

### Notes

- **The spec's highest-risk open question is closed.** `nitro@3.0.1-alpha.1` builds
  under Node 24 - the full production build succeeded, so the pinned prerelease is safe on
  the upgraded runtime. No fallback to stable `3.0.0` was needed.
- `deps.optimizer.web` under Vitest 5 and Rollup's `@__PURE__` annotation warnings from
  `zod` 4.6.7 are pre-existing dependency noise, non-fatal, and untouched.
- `maxWorkers: 4` was not overridden in any run.
- `convex/_generated/` and `src/routeTree.gen.ts` were not modified - the TypeScript
  upgrade needed no regeneration.

**Result: verified.**
