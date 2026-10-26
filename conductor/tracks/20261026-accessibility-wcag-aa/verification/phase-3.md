# Phase 3 Verification — Button type sweep

- **Track:** 20261026-accessibility-wcag-aa — Accessibility WCAG 2.2 AA Burn-Down
- **Phase:** 3 of 7
- **Date:** 2026-10-26
- **Branch:** `chore/20261026-accessibility-wcag-aa`
- **Phase base commit:** `f13161392934a7ad9140d1ba4df10bd76b393d00`
- **Result:** PASS — `useButtonType` 39 → 0; total warnings 61 → 22 (all remaining are out-of-scope rules); type-check / lint / format:check / test all pass; 78 tests passing (72 → 78).

## Commands

| Command | Result |
|---|---|
| `pnpm type-check` | PASS (exit 0) |
| `pnpm lint` | PASS (exit 0, 22 warnings, 0 errors — warnings-only exit is the project's baseline posture) |
| `pnpm format:check` | PASS (exit 0, 22 warnings, no format findings) |
| `pnpm test` | PASS — 30 files, **78 tests** (floor 46; count rose from 72) |
| `pnpm exec biome check . --reporter=summary` | Evidence captured (exits non-zero while violations exist — see footnote) |

> Footnote: the summary reporter exits non-zero while any violations exist. Per project workflow the gate exit codes are read from the four commands above; the summary run is evidence-only.

## Per-rule warning counts (before → after)

| Rule | Before | After |
|---|---|---|
| `lint/a11y/useButtonType` | 39 | **0** |
| `lint/a11y/*` (all other targeted rules, from Phases 1–2) | 0 | 0 |
| `lint/suspicious/noArrayIndexKey` (out of scope) | 16 | 16 |
| `lint/complexity/useOptionalChain` (out of scope) | 3 | 3 |
| `lint/style/noNonNullAssertion` (out of scope) | 3 | 3 |
| **Total warnings** | **61** | **22** |

No-new-warnings rule: satisfied — total fell 61 → 22, accessibility findings fell monotonically 39 → 0, and no file gained a new warning. NFR-4 end state (≤ 22, none accessibility) reached.

## Tasks

| Task | Status | Commit |
|---|---|---|
| P3.T1 — classify all 39 call sites | Done (table below) | `a68310a` |
| P3.T2 — default the shared primitive | Done (table below) | `a68310a` |
| P3.T3 — apply `type` to literal buttons | Done | `a68310a` |
| P3.T4 — re-verify + this file | Done | *(this commit)* |

## Classification table — all 39 `useButtonType` sites (P3.T1)

Line numbers are from the phase-base biome diagnostic listing (pre-edit). Every site's intent was determined from its markup: an enclosing `<form>` with no own `onClick` ⇒ **submit**; any own `onClick` action or formless context ⇒ **button**.

**Submit-intent sites (3) — received `type="submit"`, all inside forms that rely on them to submit:**

| # | File | Line | Evidence of submit intent | Applied |
|---|---|---|---|---|
| 22 | `src/routes/admin/resume/index.tsx` | 315 | "Save Profile" — **no `onClick`**, `disabled={isSubmitting}`, inside `<form onSubmit={handleSubmit}>` (form opens :112, closes :321); the form previously relied on implicit submit | `type="submit"` |
| 26 | `src/routes/admin/resume/index.tsx` | 569 | "Add Education" — **no `onClick`**, last element inside `<form>` with inline `onSubmit` (`create(formData)`, form opens :532, closes :570); relied on implicit submit | `type="submit"` |
| 28 | `src/routes/admin/resume/index.tsx` | 665 | "Add Cert" — **no `onClick`**, last element inside `<form>` with inline `onSubmit` (form opens :620, closes :666); relied on implicit submit | `type="submit"` |

**Plain-action sites (36) — received `type="button"`; none is a form's submit control:**

| # | File | Line | Action evidence | Applied |
|---|---|---|---|---|
| 1 | `src/components/features/AnalyticsWidget.tsx` | 99 | Range tab buttons in `(["today","7d","30d"]).map`, `onClick={() => setRange(r)}` | `type="button"` |
| 2 | `src/components/features/AnalyticsWidget.tsx` | 111 | Refresh, `onClick={fetchStats}`, `aria-label="Refresh analytics"` | `type="button"` |
| 3 | `src/components/features/DownloadResumeButton.tsx` | 77 | `onClick={handleDownload}` | `type="button"` |
| 4 | `src/components/features/ShareButtons.tsx` | 60 | Copy link, `onClick={copyToClipboard}` | `type="button"` |
| 5 | `src/components/layout/AdminHeader.tsx` | 15 | Hamburger, `onClick={onToggleSidebar}` | `type="button"` |
| 6 | `src/components/layout/AdminSidebar.tsx` | 70 | Sign Out, `onClick={signOut}` | `type="button"` |
| 7 | `src/components/ui/BulkActionBar.tsx` | 35 | Mapped bulk actions, `onClick={action.onClick}` | `type="button"` |
| 8 | `src/components/ui/BulkActionBar.tsx` | 51 | Clear selection, `onClick={onClear}` | `type="button"` |
| 9 | `src/routes/admin/blog/categories.tsx` | 150 | Row delete (Trash2), `async onClick` with `window.confirm`; list section is **outside** the create `<form>` (:64 closes :118) | `type="button"` |
| 10 | `src/routes/admin/blog/index.tsx` | 169 | Status toggle badge, `onClick={handleToggle}` | `type="button"` |
| 11 | `src/routes/admin/blog/index.tsx` | 201 | Row delete, `onClick={handleDelete}` | `type="button"` |
| 12 | `src/routes/admin/blog/tags.tsx` | 131 | Tag delete, `async onClick` with `window.confirm`; **outside** the create `<form>` (:59 closes :118) | `type="button"` |
| 13 | `src/routes/admin/media/index.tsx` | 87 | Copy URL, `onClick={() => copyToClipboard(file.url!)}` | `type="button"` |
| 14 | `src/routes/admin/media/index.tsx` | 106 | Delete, `onClick={handleDelete}` | `type="button"` |
| 15 | `src/routes/admin/messages/index.tsx` | 122 | Mark read/unread, `onClick={handleToggleRead}` (+ `stopPropagation`) | `type="button"` |
| 16 | `src/routes/admin/messages/index.tsx` | 132 | Delete, `onClick` (+ `stopPropagation`) | `type="button"` |
| 17 | `src/routes/admin/messages/index.tsx` | 143 | Expand chevron — no own `onClick`; click **bubbles** to the row's `onClick={toggleExpand}` (:99). `type="button"` preserves bubbling; no form on page | `type="button"` |
| 18 | `src/routes/admin/projects/$id.tsx` | 27 | Go Back, `onClick={() => history.back()}` | `type="button"` |
| 19 | `src/routes/admin/projects/index.tsx` | 231 | Visibility toggle badge, `onClick` | `type="button"` |
| 20 | `src/routes/admin/projects/index.tsx` | 260 | Row `[del]`, `onClick` | `type="button"` |
| 21 | `src/routes/admin/resume/index.tsx` | 40 | Tab buttons in `tabs.map`, `onClick={() => setActiveTab(...)}` | `type="button"` |
| 23 | `src/routes/admin/resume/index.tsx` | 383 | `[edit]`, `onClick` sets `editingId` + form data; experience table is **outside** form :112–:321 | `type="button"` |
| 24 | `src/routes/admin/resume/index.tsx` | 399 | `[del]`, `onClick` with `confirm` → `remove` | `type="button"` |
| 25 | `src/routes/admin/resume/index.tsx` | 520 | Education `[del]`, `onClick={() => remove(...)}`; **outside** form :532–:570 | `type="button"` |
| 27 | `src/routes/admin/resume/index.tsx` | 608 | Certification `[del]`, `onClick={() => remove(...)}`; **outside** form :620–:666 | `type="button"` |
| 29 | `src/routes/admin/settings/index.tsx` | 70 | APPLY_CHANGES, `onClick={handleSave}`, `disabled={setBulk.isPending}`; no `<form>` in file | `type="button"` |
| 30 | `src/routes/admin/settings/index.tsx` | 83 | Tab GENERAL, `onClick={() => setActiveTab("general")}` | `type="button"` |
| 31 | `src/routes/admin/settings/index.tsx` | 96 | Tab SEO_DEFAULTS, `onClick={() => setActiveTab("seo")}` | `type="button"` |
| 32 | `src/routes/admin/settings/index.tsx` | 109 | Tab SOCIAL_LINKS, `onClick={() => setActiveTab("social")}` | `type="button"` |
| 33 | `src/routes/admin/skills/$id.tsx` | 27 | Go Back, `onClick={() => history.back()}` | `type="button"` |
| 34 | `src/routes/admin/skills/index.tsx` | 195 | Visibility toggle badge, `onClick={() => handleToggleVisibility(...)}` | `type="button"` |
| 35 | `src/routes/admin/skills/index.tsx` | 211 | Row `[del]`, `onClick={() => handleDelete(...)}` | `type="button"` |
| 36 | `src/routes/admin/uses/$id.tsx` | 27 | Go Back, `onClick={() => history.back()}` | `type="button"` |
| 37 | `src/routes/admin/uses/index.tsx` | 181 | Visibility toggle badge, `onClick` | `type="button"` |
| 38 | `src/routes/admin/uses/index.tsx` | 197 | Row `[del]`, `onClick` | `type="button"` |
| 39 | `src/routes/demo/start.server-funcs.tsx` | 98 | Add todo, `onClick={submitTodo}`, `disabled` when input empty; **no `<form>` in file** (input's Enter key is handled via `onKeyDown`) | `type="button"` |

Sites carrying `<button` in grep but **already typed** before this phase (not flagged by `useButtonType`, unchanged): `admin.tsx:62`, `admin/login.tsx:130` (`type="submit"` in the login form), `NewsletterForm.tsx:75` (`type="submit"`), `BlogPostForm.tsx` 202/292/309/321, `RichTextEditor.tsx` (all 15), `ProjectForm.tsx:461` (`type="submit"`, 454 typed), `SkillForm.tsx:296` (`type="submit"`, 289 typed), `UsesItemForm.tsx:256` (`type="submit"`, 246 typed), `resume/index.tsx` 246/255/281/290/468 (`type="submit"`)/472.

**No classification was ambiguous after markup inspection** — no site required a blocked report. `src/routes/projects.$slug.tsx` is listed in Touches but contains **no literal `<button>`** (it uses the `<Button>` primitive inside link wrappers); its single warning (`noArrayIndexKey` :196) is out of scope, so the file needed no edit.

## P3.T2 — shared primitive default

`src/components/ui/button.tsx` now destructures `type = "button"` as the prop default and renders `<button type={type} ...>`; an explicit `type="submit"` call site (e.g. `contact.tsx:227`) passes through unchanged, and variant/size behaviour is untouched.

**Recorded limitation (per plan):** a primitive default does **not** satisfy `useButtonType` at literal `<button>` call sites — the rule flags literal JSX `<button>` elements, which do not inherit the component default. The primitive default prevents *future* primitive misuse; it is **not** a substitute for P3.T3, which typed all 39 literal sites.

## FR-12 button-primitive Testing Library assertions

New file `src/components/ui/__tests__/button.a11y.test.tsx` (6 tests, Testing Library + jsdom + `fireEvent` per the established pattern):

- **default type:** a `<Button>` in a form has `type="button"` and clicking it does **not** submit the form (submit handler spy not called).
- **explicit submit:** `<Button type="submit">` keeps `type="submit"` and clicking it **does** submit the enclosing form (handler called once) — the NFR-1 behaviour-preservation check for a submit-intent button.
- **variant/size preserved:** `variant="secondary"` / `size="lg"` still render `btn-secondary` / `btn-lg` classes alongside the type default.
- **accessible name + action:** the button's accessible name resolves from text content (`getByRole("button", { name })`) and the `onClick` handler fires.
- **submit classification tests:** a markup mirror of the classified pattern — a `type="submit"` button submits its form on click; a plain-action `type="button"` button fires its own action and does **not** submit.

## Acceptance criteria

| Criterion (spec) | Status |
|---|---|
| FR-1: every `<button>` in `src/**/*.tsx` declares explicit `type`; `useButtonType` = 0 | ✅ 39/39 typed, rule at 0 |
| FR-1: submit only where the button submits an enclosing form | ✅ 3 submit / 36 button, per table |
| FR-12: Testing Library assertions for role, accessible name, `type` | ✅ `button.a11y.test.tsx` |
| NFR-1: no behaviour change | ✅ submit-intent sites kept submit; plain actions unaffected; bubble-driven chevron preserved |
| NFR-2: no new dependencies | ✅ |
| NFR-4: totals ≤ 22, none accessibility | ✅ 22, all out-of-scope rules |
| NFR-5: test count ≥ 46, must not fall | ✅ 78 |

## Evidence paths

- `.conductor/evidence/20261026-accessibility-wcag-aa/phase-3-biome-summary.txt` — summary-reporter output after the sweep (useButtonType absent; 22 warnings)
- `conductor/tracks/20261026-accessibility-wcag-aa/verification/phase-3.md` — this file

## Deviations

1. `src/routes/admin/projects/index.tsx`, `src/routes/admin/blog/index.tsx`, `src/routes/admin/messages/index.tsx`, `src/routes/admin/media/index.tsx`, `src/routes/admin/index.tsx`, `src/routes/admin/skills/index.tsx`, `src/routes/admin/uses/index.tsx` are individual files under the `src/routes/admin/**` glob in the Touches list — no scope expansion; noted for traceability.
2. `src/routes/projects.$slug.tsx` (listed in Touches) required no edit — it contains no literal `<button>` element.
3. None beyond the above; `plan.md`/`spec.md`/`metadata.json` untouched.

## Primary verification

*(To be completed by the orchestrator after phase review.)*

## Notes for the primary

- Test count is now 78 (was 72): +6 from the new button-primitive/classification file; no existing test was modified or removed.
- The three `type="submit"` sites are all in `admin/resume/index.tsx` — the profile Save button and the two inline "Add" forms that previously relied on implicit submit. Their Enter-key submit behaviour is unchanged.
- Remaining 22 warnings are exactly the out-of-scope rules named in the brief: `noArrayIndexKey` (16), `useOptionalChain` (3), `noNonNullAssertion` (3).
