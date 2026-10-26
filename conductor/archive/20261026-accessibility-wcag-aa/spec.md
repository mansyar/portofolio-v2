# Accessibility WCAG 2.2 AA Burn-Down - Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

Make the existing UI honour the WCAG 2.2 Level AA commitment already declared in
`conductor/product-guidelines.md` ("This is a commitment, not an aspiration"), then
convert that commitment into an enforced gate by promoting the seven demoted
accessibility Biome rules back to `error`.

No product behaviour changes: no new pages, no redesign, no schema work.

## Problem / Motivation

Track `20261024-tooling-modernization` demoted seven a11y Biome rules to `warn`
because fixing them was "an accessibility work item", and recorded the debt rather
than hiding it. That item is now the largest documented quality gap in the
repository.

Measured on `main` at `2cc3505`:

| Rule | Diagnostics |
| --- | --- |
| `lint/a11y/useButtonType` | 39 |
| `lint/a11y/noLabelWithoutControl` | 31 |
| `lint/a11y/noStaticElementInteractions` | 2 |
| `lint/a11y/useKeyWithClickEvents` | 2 |
| `lint/a11y/noSvgWithoutTitle` | 1 |
| `lint/a11y/noAutofocus` | 1 |
| `lint/a11y/useHtmlLang` | 1 |
| **a11y total** | **77 of 99 warnings** |

Three further documented gaps are invisible to Biome and still fully open, all named
in the `product-guidelines.md` known-gaps table:

| Gap | Measured state |
| --- | --- |
| No `:focus-visible` rules | `0` occurrences across every `src/**/*.css` file |
| Reduced motion honoured in one file only | `1` file (`typing-effect.css`), while `7` files declare `@keyframes` or `animation:` |
| Minimal ARIA labelling | `1` `aria-label` in the whole TSX tree |

There are also four `outline: none` declarations, each currently removing focus
visibility without a replacement:

- `src/components/editor/RichTextEditor.css:84`
- `src/components/features/NewsletterForm.css:45`
- `src/components/ui/input.css:44`
- `src/styles/admin.css:109` (declared `!important`)

The impact is direct rather than theoretical. The primary product goal is
credibility with recruiters, the admin CMS has 31 labels that are not associated
with their control, and `--color-text-secondary` (`#aea79f`) on the light surface
(`#f5f5f5`) does not meet the 4.5:1 body-text ratio the guidelines require. An
inaccessible portfolio actively harms the product it exists to promote.

## Goals & Success Metrics

- **Goal:** Zero findings for every accessibility rule, with all seven at `error`
  so the debt cannot regrow.
  **Metric:** `npx biome check . --reporter=summary` reports zero diagnostics for
  the seven rules; `pnpm lint` exits `0` and fails when a fix is removed
  (mutation-tested).
- **Goal:** The three non-lint gaps close to the same standard.
  **Metric:** `:focus-visible` present for every interactive primitive;
  `prefers-reduced-motion` present in all seven animation-declaring files; every
  icon-only control resolves an accessible name.
- **Goal:** Both themes pass AA contrast.
  **Metric:** A recorded token-pair table with computed ratios meeting 4.5:1 for
  body text and 3:1 for large text and UI boundaries.
- **Goal:** No regression in product behaviour or test health.
  **Metric:** The suite stays at or above 46 passing tests, coverage stays at or
  above the 3% ratchet, and `pnpm build` succeeds.

## Scope

### In Scope

- All 77 accessibility lint findings, rule by rule.
- `:focus-visible` styling for every interactive primitive in both themes,
  replacing the four `outline: none` declarations.
- `prefers-reduced-motion: reduce` guards in all seven animation-declaring CSS
  files.
- Accessible names for icon-only controls, and live-region semantics for dynamic
  regions (bulk-selection count, analytics ping, filter counts, toasts).
- A token-level contrast audit of both themes, with the failing pair corrected.
- Promotion of the seven a11y rules from `warn` to `error` in `biome.json`.
- Testing Library regression assertions for the components touched.
- Documentation sync: the known-gaps table, `tech-stack.md` open question 3, and
  the `docs/PROGRESS.md` changelog.

### Out of Scope

- `noArrayIndexKey` (16), `noNonNullAssertion` (3) and `useOptionalChain` (3).
  These remain warnings and are tracked separately; they are not accessibility
  findings.
- Internationalisation, `lang` switching, or any i18n infrastructure.
- A visual redesign. Contrast corrections may change token values but must
  preserve the terminal identity.
- `axe-core`, `vitest-axe`, or any other new dependency; E2E, visual-regression,
  or screenshot-diff tooling.
- Component refactors or file reorganisations that no finding requires.
- A manual screen-reader audit. No assistive technology is available in this
  environment, so the non-lint gaps are evidenced by static and computed proof and
  labelled as such.
- Any change to `convex/`, the schema, or server behaviour.

## Functional Requirements

- **FR-1** Every `<button>` in `src/**/*.tsx` declares an explicit `type` matching
  its intent: `submit` only where it submits an enclosing form, `button`
  everywhere else. `useButtonType` reports zero findings.
- **FR-2** Every form control is associated with a visible `<label>` through
  `htmlFor`/`id` (or by nesting). `aria-label` remains a fallback for icon-only
  controls, never a substitute for a visible label. `noLabelWithoutControl`
  reports zero findings.
- **FR-3** Click handlers on non-interactive elements are replaced by semantic
  elements, or gain `role`, `tabIndex`, and a keyboard handler when the element
  must remain generic. `noStaticElementInteractions` and `useKeyWithClickEvents`
  report zero findings.
- **FR-4** Decorative inline SVGs carry `aria-hidden="true"`; meaningful ones carry
  a `<title>` and `role="img"`. `noSvgWithoutTitle` reports zero findings.
- **FR-5** The standalone document in `src/routes/health.tsx` declares `lang="en"`.
  `useHtmlLang` reports zero findings.
- **FR-6** `autoFocus` is removed from the admin login form; focus is managed
  deliberately via a ref where the flow needs it, or not at all.
  `noAutofocus` reports zero findings.
- **FR-7** `:focus-visible` styling exists for button, input, select, textarea,
  link, navigation item and table-row action primitives, in both themes, driven by
  tokens, with a visible offset. No `outline: none` remains without a replacement
  focus treatment.
- **FR-8** Every `@keyframes` or `animation:` declaration is guarded by
  `prefers-reduced-motion: reduce`. All seven files are covered; the existing
  typing-effect behaviour is preserved, not duplicated.
- **FR-9** Every foreground/background token pair in use meets WCAG AA in both
  themes. The known failure (`--color-text-secondary` on the light surface) is
  corrected with a light-theme override so the dark-theme amber-on-aubergine
  pairing is unchanged.
- **FR-10** Every icon-only control resolves an accessible name, and every dynamic
  region exposes `role="status"` or an appropriate `aria-live` value. Counts never
  use `assertive`.
- **FR-11** All seven accessibility rules are `error` in `biome.json`, so
  `pnpm lint` rejects any new violation.
- **FR-12** Testing Library assertions cover accessible name, role, `type`, and
  label association for each primitive and admin component changed. No new
  dependency is introduced.
- **FR-13** `product-guidelines.md` reflects the closed gaps, `tech-stack.md` open
  question 3 is resolved, and `docs/PROGRESS.md` records the work.

## Non-Functional Requirements

- **NFR-1** No product behaviour change: identical routes, copy, data, and
  interaction outcomes.
- **NFR-2** No new runtime or dev dependency; no dependency upgrades. The
  TanStack, Convex, and Vite pins are untouched.
- **NFR-3** Theme parity: every fix verified in dark and light, dark first.
- **NFR-4** Totals fall from 99 warnings to at most 22, and none of the remaining
  22 are accessibility findings.
- **NFR-5** The suite stays at or above 46 passing tests; coverage stays at or
  above the 3% ratchet and is raised if the new tests lift it.
- **NFR-6** `maxWorkers: 4` is respected; test commands never exceed four workers.
- **NFR-7** No secrets, credentials, or PII are introduced.

## Acceptance Criteria

- **AC-1** `npx biome check . --reporter=summary` reports zero diagnostics for all
  seven accessibility rules.
- **AC-2** `pnpm lint` exits `0` with those seven rules at `error`, and the
  `biome.json` block is recorded in the evidence.
- **AC-3** Removing a `type` attribute and an `htmlFor` in a scratch edit makes
  `pnpm lint` exit non-zero; the output is recorded and the edit reverted.
- **AC-4** grep evidence lists `:focus-visible` per interactive primitive file, and
  no `outline: none` remains without an adjacent replacement.
- **AC-5** grep evidence lists `prefers-reduced-motion` in all seven
  animation-declaring files, with the disabled-versus-reduced decision recorded per
  animation.
- **AC-6** A token-pair contrast table with computed ratios is recorded for both
  themes; the failing pair is fixed and re-measured.
- **AC-7** Every icon-only control is enumerated with its accessible name; the list
  is longer than one entry and each is justified.
- **AC-8** At least 46 tests pass, including the new accessibility assertions, and
  `pnpm test:coverage` exits `0`.
- **AC-9** The full gate passes:
  `pnpm type-check && pnpm lint && pnpm format:check && pnpm test && pnpm test:coverage && pnpm build`.
- **AC-10** `conductor/product-guidelines.md`, `conductor/tech-stack.md` and
  `docs/PROGRESS.md` reflect the closed debt.

## Edge Cases

- **A submit button classified as `type="button"`** silently breaks its form. Every
  call site is classified before editing, and any site whose intent cannot be
  determined from its markup is reported `blocked` rather than guessed.
- **Repeating rows** need unique label `id`s. Ids derive from record ids, never
  from array indices.
- **Tiptap cannot host a native `<label>`** around its contenteditable surface.
  Where a native association is impossible, `aria-labelledby` pointing at the
  visible label text is used and the reason is recorded.
- **`admin.css:109` declares `outline: none !important`.** Whatever it suppressed
  must be identified before the replacement lands, or the rule will be defeated.
- **jsdom cannot evaluate CSS.** FR-7, FR-8 and FR-9 are evidenced by static grep
  plus a computed token table, and the evidence states that limitation instead of
  claiming runtime proof.
- **Third-party colours.** The `hljs-*` syntax-highlighting palette and brand
  colours (Twitter, LinkedIn) are legitimate literal hex values; they are
  documented as exceptions rather than converted to tokens that have no other
  consumer.

## Dependencies

- No new package. Biome 2.6 already ships every rule in scope.
- `@testing-library/react` and `@testing-library/jest-dom` are already installed
  and are the only test tooling used.
- The 3% coverage ratchet in `conductor/workflow.md` applies unchanged, and is
  raised rather than lowered if the new tests move it.

## Open Questions & Assumptions

**Decided during specification**

- *Scope depth.* The track covers the lint findings, the three non-lint gaps, and a
  contrast audit — not the lint findings alone. The non-lint gaps are the larger
  real-world accessibility holes and are already documented commitments.
- *Regression tooling.* Testing Library assertions only. Biome's promoted rules
  carry the lint-level CI gate, and adding an accessibility-rule engine is a stack
  change this track does not need to make.
- *Contrast correction strategy.* A light-theme override for
  `--color-text-secondary`, not a change to the shared token, so the dark theme's
  palette is preserved.
- *Rule promotion timing.* Promoted in the second-to-last phase, after every fix has
  landed, so the verification gate stays green throughout — the same ratchet
  discipline used for coverage.

**Assumptions**

- The 22 remaining non-a11y warnings are acceptable to leave in place; they are
  style and assertion-contract items with no user-facing effect.
- No screen reader or automated runtime a11y engine is available in this
  environment, so static and computed evidence is the agreed standard of proof for
  CSS-level requirements.

## References

- `conductor/product-guidelines.md` — Accessibility Requirements and the
  known-gaps table.
- `conductor/code_styleguides/project.md` — "Accessibility (enforced, not
  aspirational)".
- `conductor/tech-stack.md` — open question 3, lint debt and promotion order.
- `conductor/workflow.md` — verification layers, quality gates, coverage ratchet.
- `conductor/archive/20261024-tooling-modernization/verification/review-fixes.md`
  — the record of the demotion this track reverses.
