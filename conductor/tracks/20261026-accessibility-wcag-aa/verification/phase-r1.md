# Phase R1 Verification — Review fixes (round 1)

- **Track:** 20261026-accessibility-wcag-aa — Accessibility WCAG 2.2 AA Burn-Down
- **Phase:** R1 (review-fix phase, round 1)
- **Date:** 2026-10-26
- **Branch:** `chore/20261026-accessibility-wcag-aa`
- **Phase base commit:** `849adb6c78310a24bea7c7b46003c6035bf073db`
- **Result:** PASS — all three round-1 findings (F1 high, F2 medium, F3 low) resolved; full
  six-command gate green; warning baseline unchanged at 22 (0 errors, 0 accessibility
  diagnostics); 34 test files / 88 tests; no behavioural or rendering change in any
  already-verified theme state.

## Commands (gate as six separate commands)

| Command | Result |
|---|---|
| `pnpm type-check` | PASS (exit 0) |
| `pnpm lint` | PASS (exit 0, 22 warnings, 0 errors — baseline unchanged; noArrayIndexKey 16, useOptionalChain 3, noNonNullAssertion 3; accessibility rules 0) |
| `pnpm format:check` | PASS (exit 0, 22 warnings, no format findings) |
| `pnpm test` | PASS — 34 files, 88 tests |
| `pnpm test:coverage` | PASS — statements 18.41%, branches 26.6%, functions 14.04%, lines 18.87% (≥ ratchet floor) |
| `pnpm build` | PASS — client + SSR + Nitro built (pre-existing "route file does not contain any route piece" notices for `src/routes/__tests__` and chunk-size notes are unchanged baseline noise) |

## R1.T1 — F1 (high): re-pin the dark secondary in `:root.dark`

**Finding:** under an OS light preference with a manually selected dark theme, the
`@media (prefers-color-scheme: light)` block — equal specificity to `:root.dark`, and the only
rule that re-declared `--color-text-secondary` — supplied the light value `#6e675f` inside the
dark theme: ~3.15:1 on `#300a24` and ~2.94:1 on `#3d0a2e`, both below AA. The `:root.dark`
block exists precisely to defeat that media rule, as its other three re-declarations show, but
it omitted the secondary.

**Fix (`src/styles/variables.css`):**
- `--color-text-secondary-dark: #aea79f;` defined beside the existing
  `--color-text-secondary-light` definition.
- `:root.dark` now re-declares `--color-text-secondary: var(--color-text-secondary-dark);`
  with a FR-9 rationale comment, mirroring its existing bg/text/surface re-declarations.
- The Phase 5 contrast table in `verification/phase-5.md` is extended with the third theme
  state (new subsection "Third theme state — manual dark under an OS light preference
  (added by Phase R1, F1)"): before ≈3.15 / ≈2.94 (FAIL) → after 7.39 / 6.89 (PASS, the dark
  values from the Phase 5 dark-theme table).

**Constraint check (no regression in the other states):** OS-dark default resolves to the base
`#aea79f` (untouched); `:root.light` re-declares the light value on top of the media rule
regardless (untouched); OS-light default is unchanged. Only the OS-light + manual-dark state
changes — back to the pre-track dark values, as required.

## R1.T2 — F2 (medium): pin the fixed-dark icon consumer

**Finding:** `ProfileSection.tsx` line 16 renders the Terminal icon on the fixed-dark
`--color-surface-dark` pane but used the theme-flipping `--color-text-secondary` — the same
class of bug Phase 5 fixed for `terminal-window.tsx` and `admin.tsx`; in light mode the theme
value becomes `#6e675f` on `#300a24`.

**Fix (`src/components/features/about/ProfileSection.tsx`):** the icon wrapper's class changed
from `text-(--color-text-secondary)` to `text-(--color-warm-grey)`, with an FR-9 rationale
comment in the same pattern as `terminal-window.tsx` (fixed-dark surface, so the theme-driven
secondary is wrong; `#aea79f` is value-identical to the dark secondary, so dark rendering is
unchanged; icon only, opacity .5 context). Lines 25/30/83/95 are untouched — they are
theme-driven muted text and stay on `--color-text-secondary`.

## R1.T3 — F3 (low): justify the `as` casts in tests

**Finding:** the round-1 review flagged `as unknown as {...}` casts used to reach
`mockReturnValue` on `vi.mocked` hooks without the justification comment required by
`conductor/code_styleguides/project.md` ("No non-null assertions or `as` casts without a
comment explaining why the compiler cannot know").

**Resolution — option (a), justification comments (not (b)):** the mocks return partial
objects (e.g. `{ signOut: vi.fn() }`, `{ navigate: vi.fn() }`) that are structurally
incompatible with the real hook return types (TanStack's full `Router` object, Convex's
mutation result), so `vi.mocked(useX).mockReturnValue(...)` would not type-check against the
mock shape; per the brief, (b) fights the mock shape, so (a) was applied everywhere.

**Sites fixed (grep `as unknown as` over `src/**/__tests__/` — 26 casts across 13 files):**

| File | Sites |
|---|---|
| `src/components/layout/__tests__/admin-sidebar.a11y.test.tsx` | 2 (useAuth, useQuery) |
| `src/components/layout/__tests__/admin-header.a11y.test.tsx` | 1 (useAuth) |
| `src/routes/__tests__/messages-inbox.a11y.test.tsx` | 2 (useQuery, useMutation) |
| `src/routes/__tests__/admin-blog.a11y.test.tsx` | 3 (route `.component` + useQuery, useMutation) |
| `src/routes/__tests__/login.a11y.test.tsx` | 2 (useAuth, useRouter) |
| `src/routes/__tests__/admin-settings.a11y.test.tsx` | 1 (useQuery) |
| `src/routes/__tests__/admin-resume.a11y.test.tsx` | 3 (route `.component` + useQuery, useMutation) |
| `src/routes/__tests__/admin-layout.a11y.test.tsx` | 3 (useConvexAuth, useRouter, useRouterState) |
| `src/routes/__tests__/admin-blog-taxonomy.a11y.test.tsx` | 2 (useQuery, useMutation) |
| `src/components/features/__tests__/analytics-widget.a11y.test.tsx` | 1 (useAction) |
| `src/components/features/__tests__/blog-post-form.a11y.test.tsx` | 2 (useQuery, useRouter) |
| `src/components/features/__tests__/UsesItemForm.test.tsx` | 2 (inline useRouter, useMutation) |
| `src/components/features/__tests__/ProjectForm.test.tsx` | 1 (inline useRouter) |
| `src/components/features/__tests__/skill-form.a11y.test.tsx` | 1 (useRouter) |

Comment text (hook casts): "as-cast justified: vi.mock swaps the hook for an untyped vi.fn(),
structurally incompatible with the hook's signature — the cast reaches mockReturnValue."
Route-component casts (2 sites) get a separate justification: TanStack's `createFileRoute()`
return type does not expose `.component`. One comment covers each contiguous group of
identical casts. Test behaviour is unchanged — comments only.

## R1.T4 — verification (this file)

All six commands above exit 0. Dark-theme rendering is unchanged by construction: the shared
`--color-text-secondary` value (`#aea79f`) is byte-identical, and the new `:root.dark`
re-declaration resolves to exactly the value that state already received.

## Constraints check

| Constraint | Status |
|---|---|
| No edits to `plan.md`, `spec.md`, `metadata.json` | ✅ |
| Stayed inside Touches | ✅ (variables.css, ProfileSection.tsx, `__tests__` files, phase-5.md, this file) |
| No new dependencies / dev server / push / merge / amend | ✅ |
| Gate as six separate commands | ✅ all exit 0, first attempt except `pnpm lint` (1 Biome format finding in the new JSX comment — indentation fixed, then pass on retry 1 of 2) |
| Warnings ≤ 22, 0 errors, 0 a11y diagnostics | ✅ exactly 22, unchanged |
| 34 files / 88 tests | ✅ |
| No rendering change in OS-dark, `:root.light`, OS-light default | ✅ see R1.T1 constraint check |
| Max 2 retries per command | ✅ |

## Notes for the primary

- F1/F2/F3 all resolved; the third theme state is now recorded in the Phase 5 evidence so the
  track's contrast ledger covers all four theme states.
- The 22-warning baseline is unchanged; no production CSS/TSX beyond the two named files;
  test changes are comment-only (no behaviour change, confirmed by the unchanged 88-test pass).
- Build output shows pre-existing notices (test files inside `src/routes/__tests__` picked up
  by the route scanner, chunk-size notes) — unchanged from before this phase, not caused by it.
