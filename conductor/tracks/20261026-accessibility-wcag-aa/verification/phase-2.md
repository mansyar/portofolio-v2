# Phase 2 Verification — Labels and accessible names

- **Track:** 20261026-accessibility-wcag-aa — Accessibility WCAG 2.2 AA Burn-Down
- **Phase:** 2 of 7
- **Date:** 2026-10-26
- **Branch:** `chore/20261026-accessibility-wcag-aa`
- **Base commit:** `9cb74de1b746f98ff2fcb61104aaebdcc0c73bf1` (Phase 1 head)
- **Result:** ✅ verified — `noLabelWithoutControl` 31 → **0**; total warnings 92 → **61** (exactly the expected 92 − 31); all other rules unchanged; gate green; 72/72 tests pass.

## Commands

| Layer | Command | Exit | Summary |
|---|---|---|---|
| Types | `pnpm type-check` | 0 | `tsc --noEmit` clean |
| Lint | `pnpm lint` | 0 | 61 warnings, 0 errors |
| Format | `pnpm format:check` | 0 | no format diffs, 166 files checked |
| Tests | `pnpm test` | 0 | 29 files, 72 tests passed |
| Evidence | `pnpm exec biome check . --reporter=summary` | 1* | summary snapshot at `.conductor/evidence/20261026-accessibility-wcag-aa/phase-2-biome-summary.txt` |

\* The summary reporter exits non-zero while any violation exists (pre-existing out-of-scope warnings remain by plan design); the four gate commands above are the gate.

The gate is chained in the plan but was executed as **four separate commands** per project rules.

## Per-rule counts (before → after)

| Rule | Before | After | Note |
|---|---|---|---|
| `noLabelWithoutControl` | 31 | **0** | Phase 2 target — all 31 findings resolved |
| `useButtonType` | 39 | 39 | Out of scope (Phase 3) — untouched |
| `noArrayIndexKey` | 16 | 16 | Out of scope (Phase 6) — untouched |
| `useOptionalChain` | 3 | 3 | Out of scope — untouched |
| `noNonNullAssertion` | 3 | 3 | Out of scope — untouched |
| Phase-1 five a11y rules (`noStaticElementInteractions`, `useKeyWithClickEvents`, `noSvgWithoutTitle`, `noAutofocus`, `useHtmlLang`) | 0 | 0 | No regression |
| `useSemanticElements` (error) | 0 | 0 | See deviation 3 |
| **Total warnings** | **92** | **61** | Matches expected end state 92 − 31 |

No new warnings anywhere (no-new-warnings rule holds; a11y count fell monotonically 31 → 0).

## Tasks

| Task | What was done | Commit |
|---|---|---|
| P2.T1 | Admin form labels associated via `htmlFor`/`id`: resume profile 8 fields + Summary (`resume-profile-*`), settings 6 fields (`settings-*`), login 2 (`login-email`, `login-password`), category/tag create forms (`category-*`, `tag-*`). `Input` primitive generates a `useId()` id (callers may override via `id` prop) and wires `htmlFor`; the decorative `>` prompt span is marked `aria-hidden="true"`. | `7fe0f0e` |
| P2.T2 | `BlogPostForm` 6 labels wired (`blogpost-*`). `RichTextEditor`: visible label rendered as `<span id>` and referenced from the Tiptap contenteditable via `aria-labelledby` (see Tiptap note below). | `7fe0f0e` |
| P2.T3 | Icon-only controls named with `aria-label` (inventory below). | `2cb2e43` |
| P2.T4 | Bulk-selection count, "Active Now" analytics count and the blog filter result count get `role="status"` (polite); never `assertive`. Toasts verified against sonner's built-in live regions (no change). | `2cb2e43` |
| P2.T5 | 9 new/extended test files; recorded evidence here. Tests 52 → **72** (floor 46), files 20 → 29. | `c34e791` |

### Tiptap note (P2.T2, required recording)

Tiptap's editable region is a `<div contenteditable>` — not a labelable form element — so a native
`<label>` cannot be programmatically associated with it. The visible label text is kept and rendered
as `<span id={labelId} className="rich-text-editor-label">` (class-based CSS, styling unchanged), and
`editorProps.attributes` carries `"aria-labelledby": labelId` when a `label` prop is given, so the
contenteditable resolves the accessible name "Content". Asserted by
`src/components/editor/__tests__/rich-text-editor.a11y.test.tsx`
(`getByRole("textbox", { name: "Content" })`).

## Icon-only control inventory (AC-7) — role-and-name query results

Every entry below is asserted in tests via a role-and-name query (`getByRole(<role>, { name })`).

| # | Component | Control | Name mechanism | Accessible name | Test |
|---|---|---|---|---|---|
| 1 | `AdminHeader` | Menu (hamburger) button | `aria-label` (+ pre-existing title behavior) | "Toggle navigation sidebar" | `admin-header.a11y.test.tsx` |
| 2 | `BulkActionBar` | Clear selection (X) button | `aria-label` (title kept for tooltip) | "Clear selection" | `bulk-action-bar.a11y.test.tsx` |
| 3 | `BulkActionBar` | Bulk action buttons (icon + `<span class="hidden sm:inline">`) | visible text at ≥sm; `title` supplies the name when text is CSS-hidden on mobile | same string as visible label | `bulk-action-bar.a11y.test.tsx` |
| 4 | `AnalyticsWidget` | Refresh button | `aria-label` (title kept for tooltip) | "Refresh analytics" | `analytics-widget.a11y.test.tsx` |
| 5 | `ShareButtons` | Twitter link | `aria-label` (title kept) | "Share on Twitter" | `share-buttons.a11y.test.tsx` |
| 6 | `ShareButtons` | LinkedIn link | `aria-label` (title kept) | "Share on LinkedIn" | `share-buttons.a11y.test.tsx` |
| 7 | `ShareButtons` | Copy-link button | `aria-label` (title kept) | "Copy link" | `share-buttons.a11y.test.tsx` |
| 8 | `RichTextEditor` | 14 toolbar buttons | pre-existing `title` attributes | "Heading 1/2/3", "Bold", "Italic", "Inline Code", "Bullet List", "Ordered List", "Blockquote", "Code Block", "Add Link", "Add Image", "Undo", "Redo" | `rich-text-editor.a11y.test.tsx` |
| 9 | `Input` primitive | prompt glyph `>` span | `aria-hidden="true"` — decorative, excluded from the name | n/a (input name comes solely from its `<label>`) | `input.a11y.test.tsx` |

`AdminSidebar` contains **no icon-only controls** — every nav link and the Sign Out button carry
visible text labels; inspected, no change required.

## Dynamic regions (P2.T4 decisions)

| Region | File | Decision | Why |
|---|---|---|---|
| Bulk-selection count ("N items selected") | `src/components/ui/BulkActionBar.tsx` | `role="status"` on the count span | implicit `aria-live="polite"` + atomic; selection changes announce without interrupting |
| Analytics "Active Now" count (60 s refresh) | `src/components/features/AnalyticsWidget.tsx` | `role="status"` on the count container | periodic numeric update; polite, never assertive |
| Blog filter result count ("Status: N posts found.") | `src/routes/admin/blog/index.tsx` | `role="status"` on the `<p>` | count updates when the status filter changes |
| Toasts | `src/components/ui/toast-provider.tsx` (sonner `Toaster`) | **No change** — verified by inspection: sonner renders an `aria-live="polite"` viewport and `role="status"` toasts out of the box | file is outside Touches and the library already provides the required semantics |

All counts use polite regions; **none use `assertive`** (asserted in tests: `not.toHaveAttribute("aria-live", "assertive")`).

## Label-association decisions (P2.T1 edge case)

- Static single-instance forms use stable literal ids (`settings-siteTitle`, `login-email`, `category-name`, `blogpost-title`, …).
- The resume Services/Interests editors map over plain strings with **no record identity**, so there is no record id to derive ids from (the "ids from record ids, never array indices" rule is satisfied prospectively — no repeating row in this phase carries a record id). One `<label>` cannot associate with N inputs, so the group heading remains as visible text (`<span className="input-label">`) and each input gets `aria-label="Service N"` / `"Interest N"` (N = visible position, matching what the user sees). A `role="group"` wrapper was attempted and removed — see deviation 3.

## Acceptance criteria

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| FR-2 | Every form control associated with its visible label via `htmlFor`/`id` | 31 label findings resolved (rule table above); `getByLabelText` assertions in 6 test files | ✅ |
| FR-10 | Every icon-only control resolves an accessible name; dynamic regions polite | Inventory (9 rows) + dynamic-region table; `role="status"` on counts | ✅ |
| FR-12 | Testing Library assertions for names/roles/label association | 9 test files, role-and-name queries throughout | ✅ |
| NFR-1 | No behavior change | Attribute/markup-only changes (`aria-*`, `htmlFor`, `id`, `<label>`→`<span>` where a label could not associate); no logic touched | ✅ |
| NFR-2 | No new dependencies | `package.json` unchanged | ✅ |
| NFR-5 | Suite ≥ 46 tests, count must not fall | 52 → 72 tests | ✅ |
| NFR-6 | `maxWorkers 4` | Vitest config untouched | ✅ |
| AC-7 | Icon-only controls enumerated with accessible names, list longer than one entry | Inventory: 8 named controls + 14 editor toolbar buttons | ✅ |
| Constraint 6 | `noLabelWithoutControl` = 0, other Phase-1 a11y rules stay 0 | Rule table above | ✅ |
| Constraint 5 | Total 92 − 31 = 61, no new warnings | Rule table + summary evidence | ✅ |

## Evidence paths

- `conductor/tracks/20261026-accessibility-wcag-aa/verification/phase-2.md` (this file)
- `.conductor/evidence/20261026-accessibility-wcag-aa/phase-2-biome-summary.txt` (summary reporter snapshot, Phase 2 end state)

## Deviations

1. **`src/routes/admin/blog/index.tsx`** (outside Touches) — P2.T4 requires "filter result counts" to be marked; the blog status-filter count lives here. Smallest possible change: `role="status"` on the count `<p>`. Required by the task; recorded per the Conductor rule.
2. **Exports for testability** in `src/routes/admin/settings/index.tsx` (`AdminSettings`), `src/routes/admin/blog/categories.tsx` (`CategoriesAdmin`), `src/routes/admin/blog/tags.tsx` (`TagsAdmin`) — follows the Phase 1 precedent (route components exported so Testing Library can render them); modules otherwise unchanged.
3. **`role="group"` removed from the resume Services/Interests wrappers.** An initial implementation wrapped both lists in `<div role="group" aria-label="…">`; Biome's `useSemanticElements` rule rejects `role="group"` on `<div>` as an **error** (not a warning), which would break the gate. The wrappers were removed; the visible span headings + per-input `aria-label`s remain (no regression — final lint shows `useSemanticElements` = 0).
4. **`src/components/ui/input.css`** — inspected, **no change required**: the label association is markup-level (`htmlFor`/`id`); the prompt glyph exclusion is the `aria-hidden` attribute on the span.
5. **`src/components/features/__tests__/blog-post-form.a11y.test.tsx` mocks `RichTextEditor`** (it is `lazy`-loaded). The real editor's label association is asserted end-to-end in `rich-text-editor.a11y.test.tsx`, so the Content field (6th BlogPostForm finding) is covered without duplicating Tiptap rendering in two suites.

## Notes for the primary

- Expected end state reached exactly: **61 warnings** (92 − 31), `noLabelWithoutControl` = 0, all other rule counts byte-identical to Phase 1.
- Test suite grew 52 → 72 tests across 20 → 29 files; all pass. Phase 1's keyboard-activation helper and mock conventions were reused (module-boundary `vi.mock`, no `user-event`).
- `pnpm format` (write mode) was used during the phase to converge formatting on edited files; final `pnpm format:check` is clean.
- Remaining work matches the plan: Phase 3 (`useButtonType` 39), Phase 4 (focus/reduced-motion), Phase 5 (contrast tokens), Phase 6 (promote rules to error + mutation test), Phase 7 (docs + full gate + build).
- Sidebar unread badge is a numeric suffix inside the link text ("Messages 3") and reads naturally; it is not one of the P2.T4-enumerated regions and was left untouched.
