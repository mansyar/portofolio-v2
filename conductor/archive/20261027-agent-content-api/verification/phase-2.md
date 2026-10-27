# Phase 2 — Markdown pipeline

- **Track:** 20261027-agent-content-api — Blog Content API for Agent Authoring
- **Phase:** 2
- **Date:** 2026-10-27
- **Branch:** feat/20261027-agent-content-api
- **Base commit:** `d160a31770506f6736e557739e5b3bb95cabccd6`
- **Head commit:** `c188bd7`
- **Result:** verified

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| static | `pnpm type-check` | 0 | `tsc --noEmit` clean with the new `marked` types |
| static | `pnpm lint` | 0 | Biome clean for the changed files |
| static | `pnpm format:check` | 0 | Biome formatter clean |
| unit | `pnpm test` | 0 | 55 files, 217 tests passed (205 before this phase) |
| unit | `pnpm vitest run convex/__tests__/markdown.test.ts` | 0 | 12 tests passed |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-5 | Markdown headings, bold, lists, links, and fenced code are stored as allowlisted tags; raw `<script>` and `javascript:` links do not survive | `markdown.test.ts` → "renders headings, emphasis, and lists as allowlisted tags" (asserts every emitted tag is in the render allowlist), "keeps the language class on fenced code", "escapes raw HTML instead of storing it", "strips unsafe link and image destinations", "does not leave event attributes behind" | met |

## Requirements covered

| ID | How |
| --- | --- |
| FR-3 | `convertMarkdown` renders through a restricted `marked` renderer: `html` tokens are escaped by `escapeHtml`, `walkTokens` blanks any destination failing `isSafeUrl`, and `del` is emitted as `s`. The output contains only tags from the render allowlist, asserted tag-by-tag in the test. |

## Evidence paths

- `convex/lib/markdown.ts`
- `convex/__tests__/markdown.test.ts`
- `package.json`, `pnpm-lock.yaml` (`marked` 16.4.2)
- `conductor/tracks/20261027-agent-content-api/verification/phase-2.md`

## Deviations

None. The diff is confined to the four paths in `Touches`.

## Notes

- **Dependency.** `marked` 16.4.2 is pinned by range and recorded in the lockfile.
  It is pure JavaScript with no Node built-ins, which is why it can run inside a
  Convex HTTP action; the check was made before choosing the approach, and it is
  the reason FR-3 was amended during planning.
- **Why not DOMPurify.** `isomorphic-dompurify` needs `jsdom`, and Convex HTTP
  routes have no Node APIs. The stored HTML is therefore safe by construction
  rather than by filtering, and `sanitizeHtml` still runs at render as the final
  boundary.
- **Reading time duplication.** `readingTimeFor` mirrors `calculateReadingTime`
  in `convex/blog.ts` (200 words per minute over tag-stripped text) because
  `blog.ts` is outside this phase's `Touches`. Phase 3 stores the value computed
  here, so both admin and API posts are measured the same way.
- **Strikethrough.** `marked` emits `<del>`, which the render allowlist strips.
  The converter rewrites the tag to `<s>` so formatting survives rendering; the
  rewrite is a literal tag substitution on output the restricted renderer
  produced, not a sanitizer.
- The allowlist in the test mirrors `src/lib/sanitize.ts` rather than importing
  it, because `src/` is outside `Touches`. Drift between the two would show up as
  a render-time stripping, so the risk is visible rather than silent.

## Primary verification

| Command | Exit | Result |
| --- | --- | --- |
| `pnpm type-check && pnpm lint && pnpm format:check && pnpm test` | 0 | Re-run independently after the phase commit: 217/217 tests passed, static layers clean |

Working tree clean after the phase commit; the diff for `d160a31..HEAD` is
exactly the four declared `Touches` paths.
