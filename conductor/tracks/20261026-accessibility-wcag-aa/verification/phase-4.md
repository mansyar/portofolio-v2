# Phase 4 Verification — Focus visibility and reduced motion

- **Track:** 20261026-accessibility-wcag-aa — Accessibility WCAG 2.2 AA Burn-Down
- **Phase:** 4 of 7
- **Date:** 2026-10-26
- **Branch:** `chore/20261026-accessibility-wcag-aa`
- **Phase base commit:** `0b902bfd757eec069abdf15e4571bcc56f721a8c`
- **Result:** PASS — focus-ring token pair added and applied to all interactive primitives; all four `outline: none` sites replaced; `prefers-reduced-motion: reduce` guards present in all seven animation-declaring files; gate passes (22 warnings, unchanged).

## Methodological statement (required)

**jsdom cannot evaluate CSS.** The checks below are static grep/source evidence of
the presence of `:focus-visible` rules and `prefers-reduced-motion` guards, not
runtime proof of rendered focus visibility or motion behavior. Per the spec's
constraints, no runtime CSS test is attempted.

## Commands

| Command | Result |
|---|---|
| `pnpm type-check` | PASS (exit 0) |
| `pnpm lint` | PASS (exit 0, 22 warnings, 0 errors — baseline unchanged) |
| `pnpm format:check` | PASS (exit 0, 22 warnings, no format findings) |
| `pnpm test` | PASS — 30 files, 78 tests (floor 46) |

## P4.T1 — Focus-ring tokens (FR-7)

Token pair added to `src/styles/variables.css` inside `:root`:

- `--focus-ring-color: var(--color-ubuntu-orange);` (#e95420)
- `--focus-ring-offset: 2px;`

**Contrast documentation (NFR-3, dark first):** the chosen ring color clears 3:1
against every surface used in both themes (computed WCAG relative-luminance ratios):

| Surface | Theme | Ratio vs #e95420 |
|---|---|---|
| `#300a24` (terminal bg dark) | dark | 4.8:1 |
| `#3d0a2e` (surface dark) | dark | 4.5:1 |
| `#2c001e` (aubergine footer) | dark | 5.1:1 |
| `#ffffff` (terminal bg light) | light | 3.7:1 |
| `#f5f5f5` (surface light) | light | 3.3:1 |

All values ≥ 3:1 (UI-component boundary minimum). No new raw hex was introduced in
any component CSS; every new rule references `var(--focus-ring-color)` and
`var(--focus-ring-offset)`. The only raw hex values in the codebase remain in
`variables.css` (their pre-existing location) and untouched legacy literals.

## P4.T2 — `outline: none` replacement and primitive focus rules (FR-7)

All four suppression sites were removed and replaced. Suppression analysis:

| Site | What the suppression removed | Replacement |
|---|---|---|
| `RichTextEditor.css` (`.ProseMirror, .editor-content`) | browser default focus outline on the contenteditable; wrapper `:focus-within` border was the only indicator | `.ProseMirror:focus-visible, .editor-content:focus-visible` token ring, inset (`calc(var(--focus-ring-offset) * -1)`) because parent `.rich-text-editor` uses `overflow: hidden` and would clip an outward ring |
| `NewsletterForm.css` (`.newsletter-inline-input`) | browser default focus outline on the email input; group `:focus-within` border was the only indicator | `.newsletter-inline-input:focus-visible` token ring (text inputs always match `:focus-visible` when focused) |
| `input.css` (`.input`) | browser default focus outline; wrapper `:focus-within` border+shadow was the indicator | `.input:focus-visible` token ring (also covers `<textarea class="input">` usages) |
| `admin.css` (`.terminal-input`) | `outline: none !important` suppressed the browser default focus outline; the adjacent `box-shadow: none !important` suppressed inherited/global focus box-shadows and is retained for that purpose | `.terminal-input:focus-visible` token ring; base `outline: none !important` removed |

Grep of all `src/**/*.css` for the literal declaration `outline: none` now matches
only explanatory comments recording the removal — zero active `outline: none`
declarations remain in CSS.

`:focus-visible` rules added per primitive:

| Primitive | Rule | File |
|---|---|---|
| button | `.btn:focus-visible` | `src/components/ui/button.css` |
| button (toolbar) | `.toolbar-btn:focus-visible` | `src/components/editor/RichTextEditor.css` |
| button (bulk actions) | `.bulk-action-button:focus-visible`, `.bulk-clear-button:focus-visible` | `src/components/ui/BulkActionBar.css` |
| button (newsletter submit) | `.newsletter-inline-submit:focus-visible` | `src/components/features/NewsletterForm.css` |
| button/link (table-row-action) | `.admin-table :is(button, a):focus-visible` (row actions are unclassed bare buttons/links, so scoped via table ancestor) | `src/styles/admin.css` |
| input / textarea | `.input:focus-visible` + global `textarea:focus-visible` | `src/components/ui/input.css`, `src/styles/globals.css` |
| select | global `select:focus-visible` (overrides Tailwind layered utilities such as `outline-none` / `focus:outline-hidden`, which sit in `@layer utilities` while these rules are unlayered) | `src/styles/globals.css` |
| link | global `a:focus-visible` (covers `.footer__link` and all anchors) | `src/styles/globals.css` |
| navigation-item | `.nav-link:focus-visible` | `src/styles/admin.css` |
| contenteditable editor | `.ProseMirror:focus-visible, .editor-content:focus-visible` | `src/components/editor/RichTextEditor.css` |

Grep for `:focus-visible` across `src/**/*.css` returns active rules in 8 files:
`globals.css` (4 selectors), `admin.css` (3), `RichTextEditor.css` (2),
`button.css` (1), `input.css` (1), `NewsletterForm.css` (2),
`BulkActionBar.css` (2), plus mention in `Footer.css` comment.

## P4.T3 — Reduced-motion guards (FR-8)

Grep verified the animation-declaring file count is exactly **7**, matching the
plan: `variables.css`, `globals.css`, `input.css`, `Footer.css`,
`AnalyticsWidget.css`, `BulkActionBar.css`, `typing-effect.css`.

Per-animation decision (disabled vs reduced):

| File | Animation | Decision | Rationale |
|---|---|---|---|
| `variables.css` | `scanline` (infinite background scan) | disabled | purely decorative infinite motion, no information |
| `variables.css` | `fade-in` (entrance, applied via `animate-fade-in`) | disabled | decorative entrance; element appears at rest |
| `globals.css` | `blink` (keyframes consumed in input.css and Footer.css) | guarded by global catch-all | catch-all forces any remaining animation/transition (incl. Tailwind `animate-spin`) effectively instantaneous; defense-in-depth |
| `input.css` | `blink` on `.input-prompt` caret | disabled | decorative terminal caret; steady caret preserves the terminal look |
| `Footer.css` | `blink` on `.footer__status-dot` | disabled | dot stays steadily visible, preserving the status signal |
| `AnalyticsWidget.css` | `fadeIn` entrance | disabled | decorative one-shot movement |
| `AnalyticsWidget.css` | `ping` infinite pulse | disabled | decorative infinite pulse |
| `AnalyticsWidget.css` | `animate-spin` (Tailwind, on loading icon) | disabled | loading state remains communicated by the disabled button |
| `BulkActionBar.css` | `slide-up` entrance | disabled | bar appears in place at final `translate(-50%, 0)` position |
| `typing-effect.css` | `typing-reveal` + `blink` | **pre-existing, unchanged** | file already contains `@media print, (prefers-reduced-motion: reduce)` guard (line 54) showing text instantly and hiding the cursor; behaviour preserved, not duplicated |

No animation was left unguarded; no typing-effect logic was re-implemented.

## P4.T4 — Static evidence summary (AC-4, AC-5)

- **AC-4:** `:focus-visible` present per interactive primitive file (table above);
  no active `outline: none` remains in any `src/**/*.css` file (all 4 former sites
  replaced; literal string survives only inside explanatory comments documenting
  the removal).
- **AC-5:** `prefers-reduced-motion: reduce` grep-confirmed in all 7
  animation-declaring files: `globals.css:16`, `variables.css:74`,
  `BulkActionBar.css:117`, `input.css:69`, `AnalyticsWidget.css:44`,
  `typing-effect.css:54` (pre-existing), `Footer.css:67`.
- Raw grep output saved to `.conductor/evidence/20261026-accessibility-wcag-aa/phase-4-grep.txt`.

## Constraints check

| Constraint | Status |
|---|---|
| No edits to `plan.md`, `spec.md`, `metadata.json` | ✅ |
| Stayed inside Touches | ✅ (no out-of-Touches file edited; the select coverage gap in `SkillForm.tsx` was resolved via unlayered CSS cascade precedence instead of a TSX edit) |
| No new dependencies | ✅ |
| Gate as four separate commands | ✅ |
| No-new-warnings (≤ 22, a11y = 0) | ✅ exactly 22, all out-of-scope rules (`noArrayIndexKey` 16, `useOptionalChain` 3, `noNonNullAssertion` 3) |
| Dark-first theme parity | ✅ token documented against both themes' surfaces |
| No behaviour regression | ✅ CSS-only; non-focus appearance untouched; base geometry (padding, transform) preserved |
| Static evidence saved | ✅ this file + raw grep capture |

## Tasks

| Task | Status |
|---|---|
| P4.T1 — focus-ring tokens | Done |
| P4.T2 — replace `outline: none` + primitive `:focus-visible` rules | Done |
| P4.T3 — reduced-motion guards in all 7 files | Done |
| P4.T4 — verification + this file | Done |

## Notes for the primary

- The 22-warning baseline is unchanged and all warnings remain out-of-scope rules.
- `typing-effect.css` was verified as already guarded and was left untouched.
- The generic focus rules in `globals.css` are unlayered and therefore override
  layered Tailwind `outline-none`-style utilities; the contact-page textarea keeps
  its bespoke `focus-visible:ring-1` treatment and additionally receives the
  token outline — both are token-driven orange, so no conflicting indicator.
- Test count remains 78; no tests were modified.

## Primary verification

- **Date:** 2026-10-26 — run independently by the Conductor orchestrator (not the implementing agent).
- Worktree clean before verification; git log 0b902bf..HEAD shows exactly the two reported commits (56cc3b8, 1285689); 11 changed files match the report.
- Gate re-run as four separate commands on the final code state: pnpm type-check exit 0 · pnpm lint exit 0 (22 warnings, 0 errors, unchanged baseline; accessibility rules still 0) · pnpm format:check exit 0 · pnpm test exit 0 (30 files, 78 tests).
- Static re-checks: all remaining outline: none occurrences in src/**/*.css are explanatory comments (four documented replacement sites — RichTextEditor.css, dmin.css, input.css, NewsletterForm.css); no active suppression remains. prefers-reduced-motion present in exactly 7 CSS files; :focus-visible present in 8 CSS files including the new global baseline in globals.css.
- Focus-ring token defined in ariables.css with documented per-surface contrast ratios (all ≥ 3:1); no raw hex introduced in component CSS per report.
- jsdom cannot evaluate CSS; the evidence is static grep evidence as stated in this file — consistent with the plan's P4.T4 requirement.
- **Primary verdict: PASS.**
