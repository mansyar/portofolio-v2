# Phase R1 — Review Fixes

Track: `20261024-tooling-modernization`
Date: 2026-10-25
Branch: `chore/20261024-tooling-modernization`

Review verdict: **PASS WITH FINDINGS** — 10 findings, none blocking. All ten addressed.

## Findings and resolutions

| ID | Sev | Finding | Resolution |
| --- | --- | --- | --- |
| F1 | Medium | FR-12 and the track index still promised a 40% coverage gate after FR-6/AC-6 were amended to a ratchet | FR-12 now reads "at the ratchet floor (3% lines, 3% functions)"; `index.md` says "a ratcheting coverage floor" |
| F2 | Medium | `security.noDangerouslySetInnerHtml` was demoted to `warn`, so a future unsanitized raw-HTML path would pass CI | Rule restored to `"error"`; the one legitimate site (`src/routes/blog.$slug.tsx`) carries an attribute-position `biome-ignore` naming `sanitizeHtml`/DOMPurify |
| F3 | Medium | Seven a11y rules demoted to `warn` (77 findings) while `product-guidelines.md` documented only three known gaps | Added a fourth "Known gaps" row naming the 45 interaction/button/svg/lang/autofocus findings, their evidence, their impact, and a pointer to `tech-stack.md` open question 3 |
| F4 | Medium | `.agent/workflows/check.md` and `setup.md` still prescribed `prettier --check`, `prettier --write`, `lint --fix`, `eslint --fix`, and ESLint/Prettier editor integration | Rewritten to `pnpm lint` / `pnpm format` / `pnpm format:check`; lint-staged now uses `biome check --write` for code globs only; VS Code block points at `biomejs.biome` and `source.fixAll.biome`; `setup.md` installs `@biomejs/biome` and configures `biome.json` |
| F5 | Medium | Phase-executor allowlist granted `pnpm update`/`pnpm update *`/`pnpm install *`, contradicting its own "do not upgrade dependencies" rule | `pnpm update` and `pnpm update *` removed; `pnpm install *` narrowed to bare `pnpm install` plus `pnpm install --frozen-lockfile` |
| F6 | Medium | `docs/PRD.md` was re-emitted whole — 1146/1145 for a 4-line content change, destroying `git blame` | Rebuilt from the base blob with the four content lines applied and LF endings preserved: diff is now **4/3** |
| F7 | Low | Three different gate definitions (`verify_phase`, "Before Committing", README) | "Before Committing" now matches `verify_phase`; README now uses `&&` and includes `pnpm build` |
| F8 | Low | AC-7 demanded a worker-count log; evidence was the `maxWorkers: 4` config entry | AC-7 amended to FR-7's config-based phrasing |
| F9 | Low | `typescript.md` still cited Prettier and `@typescript-eslint/no-unused-vars` | Now cites Biome and `correctness.noUnusedFunctionParameters` |
| F10 | Low | "Single package, no workspace" contradicted the new `pnpm-workspace.yaml` | Constraint amended: the file carries `allowBuilds` only and declares no `packages:` |

## Commands

| Command | Exit | Key output |
| --- | --- | --- |
| `pnpm type-check` | 0 | clean on TypeScript 7.0.2 |
| `pnpm lint` | 0 | 149 files, 99 warnings, 0 errors |
| `pnpm format:check` | 0 | 149 files, 99 warnings, 0 errors |
| `pnpm test` | 0 | 12 files, 31 tests |
| `pnpm build` | 0 | `.output/nitro.json` generated |

Warning count fell from 100 to 99 because `noDangerouslySetInnerHtml` became an error and its single site is suppressed — not because a finding was hidden.

## Notes

- F2 required an attribute-position `biome-ignore` comment. A JSX-expression comment (`{/* ... */}`) above the element does not suppress a lint rule on a JSX attribute; the comment must sit inside the element's attribute list, immediately before `dangerouslySetInnerHTML`.
- F6 was a line-ending defect, not a formatting one: `biome.json` scopes Biome to `js/jsx/ts/tsx`, so `docs/PRD.md` was never touched by the formatter. The doc-sync write re-encoded CRLF. `core.autocrlf` is `false`, so the churn was committed as-is.
- No finding required a source-behaviour change. The only `src/` edit in this phase is the suppression comment.

## Follow-up: line endings (post-review)

The first PR run of CI failed pnpm lint with 10 formatter errors that did not reproduce locally. Root cause: repository blobs were LF, the Windows working tree was CRLF, and `biome.json` pinned `lineEnding: "crlf"` - so the format gate passed on Windows and failed on Linux. The F6 fix treated the symptom (`docs/PRD.md` churn) without fixing the cause.

Resolved in this track rather than deferred:

- Added `.gitattributes` with `* text=auto eol=lf` plus binary markers, so the object store, every checkout, and CI agree byte for byte.
- Changed `formatter.lineEnding` from `"crlf"` to `"lf"`.
- Renormalized the index (147 files, line-endings only, zero content diff) and converted the working tree in place (183 files).
- Verified: `pnpm format:check`, `pnpm lint`, `pnpm type-check`, `pnpm test` (31/31) all green locally, and the GitHub Actions `test` job passes in CI.

Also fixed in the same pass: `deploy.yml` gained a `pull_request` trigger for `main` and the `test` job now runs `pnpm format:check` and `pnpm build`. `build-and-push` and `deploy` are gated with `if: github.event_name == 'push'` so a PR validates without shipping. Previously the workflow only ran on push to `main`, which made the "CI must pass before merge" rule unenforceable.

**Result: verified.**
