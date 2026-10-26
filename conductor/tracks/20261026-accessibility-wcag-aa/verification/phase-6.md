# Phase 6 Verification — Promote the rules and lock the regression

- **Track:** 20261026-accessibility-wcag-aa — Accessibility WCAG 2.2 AA Burn-Down
- **Phase:** 6 of 7
- **Date:** 2026-10-26
- **Branch:** `chore/20261026-accessibility-wcag-aa`
- **Phase base commit:** `71002127a5386236fc0c6aba6dc681a14fa30a07`
- **Result:** PASS — the seven accessibility rules are `error` in `biome.json`,
  `pnpm lint` exits 0 with exactly the 22 pre-existing non-a11y warnings, the
  mutation test proves a removed fix fails the gate, and the a11y assertion
  suite grew from 78 to 88 tests with coverage above the ratchet.
  **One blocker:** the `conductor/tech-stack.md` severity-sync edit was denied by
  the session permissions layer (see Blockers).

## Commands

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm type-check` | exit 0 | clean |
| `pnpm lint` | exit 0 | 22 warnings, 0 errors; seven a11y rules at `error` and silent |
| `pnpm format:check` | exit 0 | no format diagnostics |
| `pnpm test` | exit 0 | 34 files, 88 tests (floor 46) |
| `pnpm test:coverage` | exit 0 | lines 18.87% / functions 14.04% (ratchet floor 3%) |

## Tasks

| Task | Status | Covers |
| --- | --- | --- |
| P6.T1 Flip the seven rules to `error` | Done | FR-11 |
| P6.T2 Mutation-test the gate | Done | AC-3 |
| P6.T3 Consolidate the regression tests | Done | FR-12, AC-8 |
| P6.T4 Re-verify the phase | Done | AC-1, AC-2 |

## P6.T1 — Rules promoted to `error` (FR-11)

`biome.json` `linter.rules.a11y` block after the change (recorded per AC-2):

```json
"a11y": {
  "noLabelWithoutControl": "error",
  "useButtonType": "error",
  "noStaticElementInteractions": "error",
  "useKeyWithClickEvents": "error",
  "noAutofocus": "error",
  "noSvgWithoutTitle": "error",
  "useHtmlLang": "error"
}
```

Untouched rules confirmed still `warn` (the 22-warning baseline): `noArrayIndexKey` 16
(`suspicious`), `useOptionalChain` 3 (`complexity`), `noNonNullAssertion` 3 (`style`).
A full `pnpm lint` run immediately after the flip reported **0 errors / 22 warnings**,
so the Phases 1–5 fixes already satisfy the promoted severities.

## P6.T2 — Mutation test (AC-3)

Scratch edit: removed `type="button"` from `DownloadResumeButton.tsx` and
`htmlFor="name"` from `SkillForm.tsx`. `pnpm lint` exited **1** with
`lint/a11y/useButtonType` (DownloadResumeButton.tsx:77:5) and
`lint/a11y/noLabelWithoutControl` (SkillForm.tsx:116:13) as errors — removing a
fix fails the build. The mutations were reverted immediately (never committed);
`git status --short` afterwards showed only the intentional `biome.json` change.
Raw captured output: `.conductor/evidence/20261026-accessibility-wcag-aa/phase-6-captures.md`.

## P6.T3 — Regression tests consolidated (FR-12, AC-8)

The Phases 1–3 a11y suites already cover accessible-name, role, `type` and
label-association assertions for: the `Button` and `Input` primitives,
`BulkActionBar`, `AdminHeader`, `AnalyticsWidget`, `BlogPostForm`,
`ShareButtons`, `RichTextEditor`, and the login / admin-settings /
admin-blog-taxonomy / admin-layout / messages-inbox routes. Phase 6 extended
coverage to the touched components that had no a11y assertions, using Testing
Library only (no new dependency):

| New/extended file | Assertions |
| --- | --- |
| `src/routes/__tests__/admin-resume.a11y.test.tsx` (new) | tab buttons resolved names + `type="button"`; `Full Name`/`Title`/`Email`/`Summary` label associations (`resume-profile-*` ids); dynamic `Service 1` / `Interest 1` aria-labels; `Save Profile` is `type="submit"`; `Download PDF` is `type="button"` |
| `src/routes/__tests__/admin-blog.a11y.test.tsx` (new) | post count exposed as `role="status"` region ("1 posts found."); publish-toggle and `Delete Post` row buttons reachable by name with `type="button"` |
| `src/components/features/__tests__/skill-form.a11y.test.tsx` (new) | `Name`/`Icon` label associations, `Category` combobox named by label; decorative select chevron kept `aria-hidden="true"` |
| `src/components/layout/__tests__/admin-sidebar.a11y.test.tsx` (new) | nav links resolved by name (`Dashboard`, `Messages`, `Settings`); sign-out control resolved by name with `type="button"` |

Suite: 30 files / 78 tests before Phase 6 → **34 files / 88 tests** after.
Coverage: lines 18.87%, functions 14.04% — both above the 3% ratchet floor and
raised by the new tests (SkillForm 43%→, AdminSidebar 83%, admin/resume route 20%,
admin/blog index 45% are now measured).

Components touched in Phases 1–5 that received only mechanical `type` additions
(the three `$id` "Go Back" buttons, `media`/`projects`/`skills`/`uses` list-page
action buttons) are enforced structurally by the promoted `useButtonType` rule —
that is the gate P6.T2 proved — and the pattern they follow is asserted directly
in the blog-admin test, which covers the richest instance of that identical
pattern.

## P6.T4 — Final verification (AC-1, AC-2)

`pnpm lint` (Biome 2.6) final state: **171 files checked, 0 errors, 22 warnings**.
Zero diagnostics for all seven promoted accessibility rules (AC-1); the gate is
green with those rules at `error` (AC-2). Full per-command results in the
captures file.

## Constraints

| Constraint | Status |
| --- | --- |
| No edits to `plan.md`, `spec.md`, `metadata.json` | ✅ |
| Stayed inside Touches (`biome.json`, tests under `__tests__`, `conductor/tech-stack.md`) | ⚠️ tech-stack.md edit denied by permissions (see Blockers); all other Touches honoured |
| No new dependencies (NFR-2) | ✅ |
| Gate as five separate commands | ✅ |
| No-new-warnings: exactly 22, all non-a11y; 0 a11y diagnostics | ✅ |
| Mutation test reverted before final gate; clean tree | ✅ |
| Max 2 retries per verification command | ✅ (1 format fix on a new test file; 1 missing `beforeEach` import fix) |

## Blockers

- `conductor/tech-stack.md` row sync (FR-13 constraint 10): the `edit` tool
  returned `permission denied` for this file, so the Lint row still reads
  "pre-existing a11y and style debt = warnings". The intended minimal edit is
  recorded in `deviations`-adjacent form here: update the `Lint` row to state
  that the seven a11y rules are now `error` (promoted by this track) and that
  `noArrayIndexKey` / `useOptionalChain` / `noNonNullAssertion` remain `warn`.
  Open question 3 remains intentionally open for Phase 7 (P7.T2).

## Notes for the primary

- All four tasks are done and verified; the only outstanding item is the
  two-line `conductor/tech-stack.md` severity sync, which needs the primary's
  permissions (or Phase 7 can fold it into P7.T2, which covers the same row).
- Phase 6 does not touch colour tokens; the Phase 5 owner decision on the
  residual sub-AA pairs (R1–R7 debt) is respected.
- No `pnpm build` was run — that belongs to Phase 7's final gate per the brief.
