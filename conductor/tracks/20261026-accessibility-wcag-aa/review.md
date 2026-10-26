# Review: Accessibility WCAG 2.2 AA Burn-Down

- **Track:** `20261026-accessibility-wcag-aa`
- **Type:** `chore`
- **Branch:** `chore/20261026-accessibility-wcag-aa`
- **Range:** `2cc3505fa4d2fda7fd52fddb0d9b9f414a0b4f05..af86f9d0c6bf86ce0273d76a14d96295c039a27e`
- **Date:** 2026-10-26
- **Verdict:** `PASS` (after one fix round; all findings from rounds 1–2 resolved)

## Summary

The track is complete and ready to merge. All 30 planned tasks across 7 phases
plus the review-fix phase R1 are implemented with per-phase verification
evidence and primary-verification sections. The round-1 review blocked on one
High finding — the Phase 5 light-theme `--color-text-secondary` override was
not re-pinned in the `:root.dark` block, regressing every muted-text consumer
to ~3:1 for OS-light users who manually select dark — plus one Medium
(fixed-dark icon consumer missed by the re-point list) and one Low (unjustified
`as` casts in new tests). Phase R1 fixed all three; the round-2 re-review
confirmed resolution with no new code findings, leaving only a Low
doc-precision nit (cascade-mechanism wording), which was corrected in
commit `af86f9d`. The remaining known contrast debt (R1–R7) is explicitly
recorded as open, owner-approved debt — not silently accepted.

## Verification

All commands run fresh on the final HEAD by the primary, as separate commands.

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| typecheck | `pnpm type-check` | pass (exit 0) | verification/phase-7.md, phase-r1.md |
| lint | `pnpm lint` | pass (exit 0 — 22 warnings, 0 errors, 0 a11y diagnostics) | verification/phase-6.md, phase-r1.md |
| format | `pnpm format:check` | pass (exit 0) | verification/phase-r1.md |
| test | `pnpm test` | pass (exit 0 — 34 files, 88 tests) | verification/phase-6.md, phase-r1.md |
| coverage | `pnpm test:coverage` | pass (exit 0 — lines 18.87%, functions 14.04%; ratchet floor 3%) | verification/phase-6.md, phase-r1.md |
| build | `pnpm build` | pass (exit 0 — client + SSR + nitro) | verification/phase-7.md, phase-r1.md |

## Requirements

| ID | Implemented by | Verified by | Status |
| --- | --- | --- | --- |
| FR-1 | P3.T1–P3.T3 | phase-3.md classification table; mutation test (AC-3); `button.a11y.test.tsx` | covered |
| FR-2 | P2.T1–P2.T2 | phase-2.md; label-association assertions in 8 a11y test files | covered |
| FR-3 | P1.T4 | phase-1.md keyboard-activation tests (jsdom limitation recorded) | covered |
| FR-4 | P1.T3 | phase-1.md; `noSvgWithoutTitle` 0; SkillForm chevron test | covered |
| FR-5 | P1.T1 | phase-1.md; `useHtmlLang` 0 and `error` | covered |
| FR-6 | P1.T2 | phase-1.md login test (no autofocus, label reachable) | covered |
| FR-7 | P4.T1–P4.T2 | phase-4.md grep evidence (static standard; jsdom cannot evaluate CSS) | covered |
| FR-8 | P4.T3 | phase-4.md (7 files guarded, typing-effect preserved) | covered |
| FR-9 | P5.T1–P5.T3 + R1.T1/R1.T2 | phase-5.md pair tables (now all four theme states); R1–R7 recorded as open debt | covered (with accepted debt) |
| FR-10 | P2.T3–P2.T4 | phase-2.md icon-only inventory (9 rows), role="status" regions | covered |
| FR-11 | P6.T1 | `biome.json` diff; AC-2 gate green at `error` severity | covered |
| FR-12 | P6.T3 | 34 files / 88 tests, Testing Library only | covered |
| FR-13 | P7.T1–P7.T3 | phase-7.md; known-gaps closed, tech-stack lint row + open question 3, PROGRESS.md row | covered |
| NFR-1 | P3.T3 | submit-intent sites kept `type="submit"` (asserted in admin-resume test); value-preserving re-points | covered |
| NFR-2 | — | `package.json` untouched by the diff | covered |
| NFR-3 | R1.T1 | dark parity across all four theme states after the `:root.dark` re-pin | covered |
| NFR-4 | P1–P6 | warnings 99 → 22, all non-a11y; 0 a11y diagnostics | covered |
| NFR-5 | P6.T3 | 88 ≥ 46 tests; coverage 18.87% / 14.04% raised above ratchet | covered |
| NFR-6 | — | maxWorkers config unchanged; gate run as separate commands | covered |
| NFR-7 | — | no secrets in diff | covered |
| AC-1 | P6.T4 | biome check: 171 files, 0 errors, 22 warnings, 0 a11y diagnostics | covered |
| AC-2 | P6.T1 | gate exits 0 with seven rules at `error` | covered |
| AC-3 | P6.T2 | mutation capture in `.conductor/evidence/20261026-accessibility-wcag-aa/phase-6-captures.md`; mutation not in tree | covered |
| AC-4 | P4.T2 | grep evidence; remaining `outline: none` are comments only | covered |
| AC-5 | P4.T3 | grep-confirmed 7 files with `prefers-reduced-motion` | covered |
| AC-6 | P5.T1–P5.T4 + R1.T1 | both-theme tables + third theme state added in R1 | covered |
| AC-7 | P2.T3 | icon-only inventory with role-and-name query evidence | covered |
| AC-8 | P6.T3 | `pnpm test:coverage` exit 0 | covered |
| AC-9 | P7.T4 | all six commands exit 0 on HEAD | covered |
| AC-10 | P7.T1–P7.T2 | docs reflect closed debt; R1–R7 recorded as open | covered |

## Findings

### Critical

- <none>

### High

- **F1 — manual dark theme under OS light preference regressed to sub-AA** *(RESOLVED in R1)*
  - **File:** `src/styles/variables.css:116`
  - **What:** The Phase 5 light-theme `--color-text-secondary` override was not re-pinned in the `:root.dark` block, which re-declares the other three theme tokens to defeat the OS-preference media rule.
  - **Why:** OS-light users who manually select dark got `#6e675f` (~3.15:1 on `#300a24`, ~2.94:1 on `#3d0a2e`) instead of `#aea79f` (7.39/6.89:1) — a new sub-AA state across all public-page muted text.
  - **Fix:** `--color-text-secondary-dark: #aea79f` defined and re-declared in `:root.dark`; phase-5.md contrast table extended with the third theme state. Commit `8867a01`; confirmed resolved by round-2 re-review (specificity 0,2,0 beats the media block's 0,1,0; other states byte-unchanged).

### Medium

- **F2 — fixed-dark `text-secondary` consumer outside the re-point list** *(RESOLVED in R1)*
  - **File:** `src/components/features/about/ProfileSection.tsx:16`
  - **What:** `text-(--color-text-secondary)` on a fixed `bg-(--color-surface-dark)` overlay, missed by the Phase 5 re-points.
  - **Why:** Light-theme icon rendered ~2.94:1 on the fixed dark surface (was 6.89:1), below the 3:1 non-text minimum.
  - **Fix:** Re-pointed to `text-(--color-warm-grey)` (value-identical to the dark secondary) with rationale comment. Commit `1c7451a`; confirmed resolved.

### Low

- **F3 — `as` casts without required justification comments** *(RESOLVED in R1)*
  - **File:** `src/components/layout/__tests__/admin-sidebar.a11y.test.tsx:20` and 12 other test files
  - **What:** `as unknown as {...}` casts on mocked hooks lacked the justification comment `conductor/code_styleguides/project.md` requires.
  - **Why:** Style rule binds for changed lines.
  - **Fix:** Justification comments added at all 26 cast sites across 13 test files (rewriting to `vi.mocked(...)` was not type-checkable for the partial-object mocks). Commit `c1c4daf`; confirmed resolved.
- **N1 — cascade-mechanism wording misstates the fix** *(RESOLVED post-review)*
  - **File:** `src/styles/variables.css:121` (+ prose in `verification/phase-5.md`, `verification/phase-r1.md`)
  - **What:** The comment/prose described the fix as an "equal-specificity trick / source order defeats the media rule"; actually `:root.dark` (0,2,0) wins on higher specificity over the media rule's `:root` (0,1,0).
  - **Why:** The misstatement could mislead a future maintainer into an order-based "simplification" that reintroduces the leak.
  - **Fix:** Reworded in all three locations. Commit `af86f9d`.

## Overrides

- <none>

## Plan compliance

All 7 planned phases and all 30 planned tasks are implemented, each with a
per-phase verification file and a primary-verification section. The review-fix
phase R1 (added by this review) is likewise complete. Recorded deviations
(tests under `src/routes/__tests__/`, `export` keywords for testability,
`admin/blog/index.tsx` `role="status"`, Phase 5 value-preserving re-points and
the admin dark pin) were examined by the reviewer and accepted as required to
prevent new failures; no task was marked complete without verification.

## Out of scope

- Pre-existing light-mode `.btn-secondary` hover (near-black text on `#300a24`, ~1.06:1) — same class as what the admin pin fixed, but outside this diff's scope.
- Undefined tokens referenced but never declared (`--color-surface-brighter`, `--color-surface-darker`, `--color-terminal-bg`, `--color-text-muted`) — pre-existing latent issues recorded in phase-5.md.
- `hljs` palette and Twitter/LinkedIn brand hex — documented spec exceptions.
- `key={index}` in resume services/interests and the 22 remaining non-a11y lint warnings — explicitly out of scope for this track.

## Debt

- **R1–R7 residual sub-AA contrast pairs** — seven pairs from the Phase 5 audit
  (light-theme orange/cyan/green small text, white-on-orange buttons, terminal
  red, placeholder opacity, admin badge-success) remain below AA by explicit
  owner decision; R2/R3 have mechanical token-level fixes available later, the
  rest need brand-colour decisions. Recorded in the known-gaps table of
  `conductor/product-guidelines.md` and detailed in
  `conductor/tracks/20261026-accessibility-wcag-aa/verification/phase-5.md` (P5.T4).
  Tracking issue: created after review (see history).

## Doc sync

`updated` — `conductor/product-guidelines.md` (known-gaps table closed + open
debt row), `conductor/tech-stack.md` (lint row synced; open question 3 resolved),
`docs/PROGRESS.md` (changelog row) were updated in Phase 7 and the review-fix
round; `conductor/workflow.md` checked accurate as-is.

## History

| Round | Verdict | Critical | High | Medium | Low | Fixed |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | BLOCK | 0 | 1 | 1 | 1 | 3/3 (Phase R1, commits `8867a01`, `1c7451a`, `c1c4daf`) |
| 2 | PASS WITH FINDINGS | 0 | 0 | 0 | 1 | 1/1 (N1, commit `af86f9d`) |
