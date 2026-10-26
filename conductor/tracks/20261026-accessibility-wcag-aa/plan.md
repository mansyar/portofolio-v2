# Accessibility WCAG 2.2 AA Burn-Down - Implementation Plan

> **Branch:** `chore/20261026-accessibility-wcag-aa`
> **Base:** `main` @ `2cc3505fa4d2fda7fd52fddb0d9b9f414a0b4f05`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.
>
> **Baseline, measured on `main`:** 99 warnings — 77 accessibility
> (`useButtonType` 39, `noLabelWithoutControl` 31, `noStaticElementInteractions` 2,
> `useKeyWithClickEvents` 2, `noSvgWithoutTitle` 1, `noAutofocus` 1, `useHtmlLang`
> 1) and 22 non-accessibility. Also 0 `:focus-visible`, 1 reduced-motion guard
> across 7 animation-declaring files, 1 `aria-label` in the whole TSX tree,
> 4 `outline: none` sites, and 21 literal hex values in component CSS.
>
> **Verification gate:** `pnpm type-check && pnpm lint && pnpm format:check && pnpm test`
> every phase; `pnpm build` additionally in Phase 7.
>
> **No-new-warnings rule:** until Phase 6, `pnpm lint` must not gain a warning. The
> accessibility warning count must fall monotonically, and `npx biome check .
> --reporter=summary` is recorded in every phase's evidence.
>
> **Machine constraint:** `maxWorkers: 4` (NFR-6). This host runs four concurrent
> projects.

## Phase 1: Single-instance lint findings

- **Goal:** The five rules with one or two occurrences are clean, and `health.tsx`
  serves a document with a declared language.
- **Depends on:** none
- **Covers:** FR-3, FR-4, FR-5, FR-6, AC-1 (partial)
- **Touches:** `src/routes/health.tsx`, `src/routes/admin.tsx`,
  `src/routes/admin/login.tsx`, `src/routes/admin/messages/index.tsx`,
  `src/components/features/SkillForm.tsx`
- **Verification:** the gate, plus `useHtmlLang`, `noAutofocus`,
  `noSvgWithoutTitle`, `noStaticElementInteractions` and `useKeyWithClickEvents`
  each report zero diagnostics
- **Status:** pending

- [ ] **P1.T1: Add `lang` to the standalone health document** - covers: FR-5
  - [ ] Add `lang="en"` to the `<html>` element in `health.tsx`
  - [ ] Confirm `/health` still returns `OK` and the Docker healthcheck contract is unchanged
- [ ] **P1.T2: Replace the `autoFocus` on the admin login form** - covers: FR-6
  - [ ] Remove `autoFocus`; if the flow depends on it, focus the email field with a ref instead, and record which path was taken
  - [ ] Test: the email input is reachable and labelled without relying on autofocus
- [ ] **P1.T3: Give the `SkillForm` icon SVG an accessible treatment** - covers: FR-4
  - [ ] Decide decorative vs meaningful, then `aria-hidden="true"` or `<title>` plus `role="img"`
- [ ] **P1.T4: Make the two static-element click targets real controls** - covers: FR-3
  - [ ] `src/routes/admin.tsx` and `src/routes/admin/messages/index.tsx`: convert to `<button>` or `<a>`, or add `role`, `tabIndex` and a keyboard handler where the element must stay generic
  - [ ] Test: each converted target is reachable by role and activates with Enter and Space
- [ ] **P1.T5: Re-verify the phase** - covers: AC-1
  - [ ] Record the per-rule diagnostic count before and after
  - [ ] Write `conductor/tracks/20261026-accessibility-wcag-aa/verification/phase-1.md`

## Phase 2: Labels and accessible names

- **Goal:** All 31 unassociated labels are associated with their control, and every
  icon-only or dynamic control has an accessible name.
- **Depends on:** Phase 1
- **Covers:** FR-2, FR-10, AC-7
- **Touches:** `src/routes/admin/resume/index.tsx` (11),
  `src/routes/admin/settings/index.tsx` (6),
  `src/components/features/BlogPostForm.tsx` (6),
  `src/routes/admin/blog/categories.tsx` (2),
  `src/routes/admin/blog/tags.tsx` (2), `src/routes/admin/login.tsx` (2),
  `src/components/editor/RichTextEditor.tsx` (1), `src/components/ui/input.tsx` (1),
  `src/components/ui/input.css`, `src/components/layout/AdminSidebar.tsx`,
  `src/components/layout/AdminHeader.tsx`,
  `src/components/features/AnalyticsWidget.tsx`,
  `src/components/ui/BulkActionBar.tsx`, `src/components/features/ShareButtons.tsx`,
  tests under `src/components/**/__tests__/`
- **Verification:** the gate, plus `noLabelWithoutControl` reports zero diagnostics
  and the icon-only control list is enumerated
- **Status:** pending

- [ ] **P2.T1: Associate the admin form labels** - covers: FR-2
  - [ ] Derive stable `id`s from record ids — never array indices — and wire `htmlFor` in the resume, settings, blog category/tag, and login forms
  - [ ] Confirm the prompt-input primitive's label relationship is a real association, not implied by the `>` glyph
- [ ] **P2.T2: Associate the feature-form labels** - covers: FR-2
  - [ ] `BlogPostForm` (6 findings) and `RichTextEditor` (1)
  - [ ] Where Tiptap cannot host a native `<label>`, use `aria-labelledby` against the visible label text and record why
- [ ] **P2.T3: Name the icon-only controls** - covers: FR-10
  - [ ] Inventory every icon-only button in `AdminSidebar`, `AdminHeader`, `BulkActionBar`, `AnalyticsWidget` and `ShareButtons`; add `aria-label` to each
  - [ ] Test: each named control resolves an accessible name by role and name query
- [ ] **P2.T4: Mark the dynamic regions** - covers: FR-10
  - [ ] Bulk-selection count, analytics ping, filter result counts and toasts get `role="status"` or `aria-live`; counts never use `assertive`
- [ ] **P2.T5: Re-verify the phase** - covers: AC-7
  - [ ] Record `noLabelWithoutControl` = 0 and the enumerated accessible-name list
  - [ ] Write `verification/phase-2.md`

## Phase 3: Button type sweep

- **Goal:** All 39 `<button>` elements declare an intent-correct `type`, with no
  form behaviour changed.
- **Depends on:** Phase 2
- **Covers:** FR-1, FR-12 (button primitive)
- **Touches:** `src/components/ui/button.tsx`,
  `src/components/ui/BulkActionBar.tsx`,
  `src/components/features/AnalyticsWidget.tsx`,
  `src/components/features/DownloadResumeButton.tsx`,
  `src/components/features/ShareButtons.tsx`,
  `src/components/layout/AdminHeader.tsx`,
  `src/components/layout/AdminSidebar.tsx`, `src/routes/admin/**` (9 files),
  `src/routes/demo/start.server-funcs.tsx`, `src/routes/projects.$slug.tsx`
- **Verification:** the gate, plus `useButtonType` reports zero diagnostics and the
  submit-classification table is attached to the evidence
- **Status:** pending

- [ ] **P3.T1: Classify every call site before editing** - covers: FR-1
  - [ ] Produce a table of all 39 sites: file, line, and intended `type`; flag every site inside a `<form>` where submitting is the intent
  - [ ] Report `blocked` for any site whose intent cannot be determined from its markup rather than guessing
- [ ] **P3.T2: Default the shared primitive** - covers: FR-1
  - [ ] `button.tsx` defaults `type="button"` while still allowing an explicit `type="submit"`
  - [ ] Record that a primitive default does not satisfy the rule at literal `<button>` call sites, so it is not a substitute for P3.T3
- [ ] **P3.T3: Apply `type` to the remaining literal buttons** - covers: FR-1
  - [ ] Work the classification table; no submit-intent site receives `type="button"`
  - [ ] Test: a submit-intent button submits its form and a plain action button does not
- [ ] **P3.T4: Re-verify the phase** - covers: FR-1
  - [ ] Record `useButtonType` = 0 and the classification table
  - [ ] Write `verification/phase-3.md`

## Phase 4: Focus visibility and reduced motion

- **Goal:** Every interactive element shows a visible focus ring in both themes, and
  every animation honours `prefers-reduced-motion`.
- **Depends on:** Phase 3
- **Covers:** FR-7, FR-8, AC-4, AC-5
- **Touches:** `src/styles/variables.css`, `src/styles/globals.css`,
  `src/styles/admin.css`, `src/components/ui/button.css`,
  `src/components/ui/input.css`, `src/components/editor/RichTextEditor.css`,
  `src/components/features/NewsletterForm.css`,
  `src/components/features/AnalyticsWidget.css`,
  `src/components/layout/Footer.css`, `src/components/ui/BulkActionBar.css`,
  `src/components/ui/typing-effect.css`
- **Verification:** the gate, plus grep evidence for `:focus-visible` and
  `prefers-reduced-motion`
- **Status:** pending

- [ ] **P4.T1: Add the focus-ring tokens** - covers: FR-7
  - [ ] Define a focus-ring token pair in `variables.css` that clears 3:1 against both surfaces
  - [ ] Use the token in every rule; introduce no raw hex in component CSS
- [ ] **P4.T2: Replace each `outline: none` with a real focus treatment** - covers: FR-7
  - [ ] Four sites today: `RichTextEditor.css:84`, `NewsletterForm.css:45`, `input.css:44`, `admin.css:109` — identify what the `!important` declaration was suppressing before replacing it
  - [ ] Add `:focus-visible` rules for the button, input, select, textarea, link, navigation-item and table-row-action primitives
- [ ] **P4.T3: Guard every animation** - covers: FR-8
  - [ ] Add a `prefers-reduced-motion: reduce` block to all seven animation-declaring files; the typing effect keeps its existing behaviour and is not duplicated
  - [ ] Record per animation whether it is disabled or reduced, and why
- [ ] **P4.T4: Re-verify the phase** - covers: AC-4, AC-5
  - [ ] Grep evidence per file, stating explicitly that jsdom cannot evaluate CSS and this is static evidence rather than runtime proof
  - [ ] Write `verification/phase-4.md`

## Phase 5: Contrast audit and token corrections

- **Goal:** Every token pair in use meets AA in both themes, with the measured ratios
  recorded.
- **Depends on:** Phase 4
- **Covers:** FR-9, AC-6
- **Touches:** `src/styles/variables.css`, `src/styles/globals.css`, plus any
  component CSS whose literal value must become a token
- **Verification:** the gate, plus the contrast table and a re-measurement of every
  changed pair
- **Status:** pending

- [ ] **P5.T1: Build the pair inventory** - covers: FR-9
  - [ ] Enumerate every foreground/background token pair actually used in dark and light, with computed contrast ratios
- [ ] **P5.T2: Fix the failing pairs at token level** - covers: FR-9
  - [ ] The known failure is `--color-text-secondary` (`#aea79f`) on the light surface (`#f5f5f5`); add a light-theme override rather than changing the shared value, so amber-on-aubergine stays intact
  - [ ] Re-measure and record before and after
- [ ] **P5.T3: Classify the 21 literal hex values** - covers: FR-9
  - [ ] Document the `hljs-*` syntax-highlighting palette and the brand colours (Twitter, LinkedIn) as legitimate exceptions; convert anything else with a token equivalent
  - [ ] Do not invent tokens with no second consumer purely to eliminate a literal
- [ ] **P5.T4: Re-verify the phase** - covers: AC-6
  - [ ] Record the table and the exception list
  - [ ] Write `verification/phase-5.md`

## Phase 6: Promote the rules and lock the regression

- **Goal:** The seven accessibility rules are errors, the accessibility diagnostic
  count is zero, and removing a fix fails the build.
- **Depends on:** Phase 5
- **Covers:** FR-11, FR-12, AC-1, AC-2, AC-3, AC-8
- **Touches:** `biome.json`, `conductor/tech-stack.md`, tests under
  `src/components/**/__tests__/`
- **Verification:** `pnpm type-check && pnpm lint && pnpm format:check && pnpm test && pnpm test:coverage`
- **Status:** pending

- [ ] **P6.T1: Flip the seven rules to `error`** - covers: FR-11
  - [ ] `noLabelWithoutControl`, `useButtonType`, `noStaticElementInteractions`, `useKeyWithClickEvents`, `noAutofocus`, `noSvgWithoutTitle`, `useHtmlLang`
  - [ ] Confirm the 22 non-accessibility warnings are untouched and still `warn`
- [ ] **P6.T2: Mutation-test the gate** - covers: AC-3
  - [ ] Remove a `type` attribute and an `htmlFor` in a scratch edit, confirm `pnpm lint` exits non-zero, then revert
  - [ ] Record the failing output as evidence
- [ ] **P6.T3: Consolidate the regression tests** - covers: FR-12, AC-8
  - [ ] Ensure every primitive and admin component touched has accessible-name, role, `type` and label-association assertions, using Testing Library only
  - [ ] Coverage stays at or above the 3% ratchet, and rises if the new tests lift it
- [ ] **P6.T4: Re-verify the phase** - covers: AC-1, AC-2
  - [ ] Record `biome check` output: 0 accessibility diagnostics, at most 22 warnings total
  - [ ] Write `verification/phase-6.md`

## Phase 7: Documentation sync and final verification

- **Goal:** The recorded debt is closed in the docs and the whole gate including
  `pnpm build` is green.
- **Depends on:** Phase 6
- **Covers:** FR-13, NFR-1, NFR-2, NFR-3, NFR-5, NFR-7, AC-9, AC-10
- **Touches:** `conductor/product-guidelines.md`, `conductor/tech-stack.md`,
  `conductor/workflow.md`, `docs/PROGRESS.md`, `README.md` (only if a command
  changed)
- **Verification:** `pnpm type-check && pnpm lint && pnpm format:check && pnpm test && pnpm test:coverage && pnpm build`
- **Status:** pending

- [ ] **P7.T1: Close the known-gaps table** - covers: FR-13
  - [ ] Close all four rows with evidence, or annotate what remains and why
- [ ] **P7.T2: Resolve the tech-stack open questions** - covers: FR-13
  - [ ] Answer open question 3: which rules were promoted, in what order, and what remains `warn`
  - [ ] Confirm the lint row no longer describes pre-existing accessibility debt as open
- [ ] **P7.T3: Changelog and workflow** - covers: FR-13
  - [ ] Add the `docs/PROGRESS.md` changelog row
  - [ ] Update the `conductor/workflow.md` quality-gate line about accessibility gaps if it is now inaccurate
- [ ] **P7.T4: Full verification and evidence** - covers: AC-8, AC-9, AC-10
  - [ ] Run the complete gate and record every exit code plus the final diagnostic counts
  - [ ] Write `verification/phase-7.md`

**Risk:** P3.T1's submit-classification table is the safety net for the only change
in this track that can silently break a user flow. Any site whose intent cannot be
determined from its markup is reported `blocked` rather than guessed.

<!--
The primary appends after acceptance:
**Result:** verified
**Checkpoint:** <short-sha>
**Evidence:** conductor/tracks/20261026-accessibility-wcag-aa/verification/phase-<n>.md
-->
