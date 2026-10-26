# Phase 1 — One title owner

- **Track:** `20261026-seo-head-ownership`
- **Phase:** 1 — One title owner
- **Date:** 2026-10-26
- **Branch:** `fix/20261026-seo-head-ownership`
- **Base:** `7d2709f` (phase base)
- **Head:** `15dc4d0`
- **Result:** verified

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| unit (red) | `pnpm exec vitest run src/components/__tests__/seo.test.tsx src/routes/__tests__/seo-surface.test.tsx` | 1 | 3 failed: root head declared a title, route titles embedded the owner name, `/admin` had no title |
| unit | same | 0 | 7 passed |
| static | `pnpm type-check` | 0 | clean |
| static | `pnpm lint` | 0 | 21 pre-existing warnings, 0 errors |
| static | `pnpm format:check` | 0 | clean |
| unit (suite) | `pnpm test` | 0 | 46 files, 137 tests (was 45 / 134) |

Raw output: `.conductor/evidence/20261026-seo-head-ownership/phase-1-red-run.txt`,
`phase-1-gate.txt`, `phase-1-static.txt`.

## Red run

Against the pre-fix tree the new guard failed for the three intended reasons:

- `declares no title in the root route head` — `__root.tsx` still had a `title:` entry.
- `never embeds the owner name in a route title` — seven routes matched
  `Muhammad Ansyar Rafi Putra` inside a `title` prop.
- `gives the admin tree one route-level title` — `/admin` had no `head` at all.

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-1 | A rendered page contains exactly one `<title>` | `composes the title once, from a bare page title` asserts `document.querySelectorAll("title")` is length 1; SSR count re-checked in Phase 3 | met |
| AC-2 | `About Me \| Muhammad Ansyar Rafi Putra \| Portfolio` — owner name once | Seo test pins the composition (`About Me \| Test Site`); the guard forbids the owner name in route titles | met |
| AC-3 | Source guard fails on a root title or an owner-name route title | `seo-surface.test.tsx`, red before the fix | met |
| AC-6 | Admin page has exactly one title | `gives the admin tree one route-level title` | met (admin); 404 asserted in Phase 3 |

## Files changed

- `src/lib/site.ts` — new `DEFAULT_SITE_NAME`, shared by `Seo`, the admin route, and 404.
- `src/components/seo.tsx` — falls back to the shared constant instead of a local literal.
- `src/routes/__root.tsx` — root `head` keeps charset/viewport and no longer declares a title.
- Seven route files — bare page titles (`About Me`, `Blog`, `Contact`, `Projects`,
  `Skills & Tech Stack`, `Uses`, `Unsubscribe`).
- `src/routes/admin.tsx` — route-level `Admin | <site name>` title.
- `src/components/NotFound.tsx` — renders `Seo` with `Page not found`.
- `src/components/__tests__/seo.test.tsx` — exact title and single-title assertions.
- `src/routes/__tests__/seo-surface.test.tsx` — new source guard and admin head assertion.

## Deviations

None. Every file is inside the phase's `Touches`.

## Notes

- `Seo` remains the only owner of public page titles; the admin tree does not render it, which
  is why its title lives on the route instead of in each page.
- The error boundary deliberately gets no title: it can render inside the admin tree, whose
  title is route-level, and a second tag there would recreate this phase's defect. Recorded in
  the spec as an accepted limitation.
- The suite grew by one file and three tests: the new source guard.

## Primary verification

Re-ran the phase verification on `15dc4d0`:

```
$ pnpm exec vitest run src/components/__tests__/seo.test.tsx src/routes/__tests__/seo-surface.test.tsx
 ✓ src/components/__tests__/seo.test.tsx (4 tests)
 ✓ src/routes/__tests__/seo-surface.test.tsx (3 tests)
 Test Files  2 passed (2)
      Tests  7 passed (7)
exit 0
```

`git status --porcelain` was empty after the commit.
