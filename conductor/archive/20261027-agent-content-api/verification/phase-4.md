# Phase 4 — Partial update, publish, unpublish

- **Track:** 20261027-agent-content-api — Blog Content API for Agent Authoring
- **Phase:** 4
- **Date:** 2026-10-27
- **Branch:** feat/20261027-agent-content-api
- **Base commit:** `457d40e`
- **Head commit:** `4cb5d42`
- **Result:** verified

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| static | `pnpm type-check` | 0 | `tsc --noEmit` clean |
| static | `pnpm lint` | 0 | Biome clean for the changed files |
| static | `pnpm format:check` | 0 | Biome formatter clean |
| unit | `pnpm test` | 0 | 57 files, 250 tests passed (235 before this phase) |
| unit | `pnpm vitest run convex/__tests__/contentApi.update.test.ts convex/__tests__/contentApi.create.test.ts` | 0 | 33 tests passed |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-6 | Patching only the title leaves body, tags, category, and cover image unchanged | `contentApi.update.test.ts` → "changes only the fields it was sent" compares every untouched field before and after and asserts `updated: ["title"]` | met |
| AC-7 | Patching the body recomputes `readingTime` from the new HTML | "re-converts the body and recomputes reading time" asserts the stored HTML and `readingTime` of 4 for 602 words | met |
| AC-11 | Publishing twice returns success twice and stamps `publishedAt` exactly once | "is idempotent and stamps publishedAt exactly once" asserts `changed: false` on the second call, an identical timestamp, and one `publish` audit row | met |
| AC-12 | Unpublishing returns the post to draft, hides it from public queries, and keeps its `publishedAt` | "unpublishes, hides the post, and keeps its publishedAt" asserts `listPublished.total === 0`, `bySlug` null, and the retained date | met |

## Requirements covered

| ID | How |
| --- | --- |
| FR-5 | `PATCH /content/blog/:slug` builds a patch from the fields present; an absent key is never treated as a clear; a changed body is re-converted and re-metered; 404 on an unknown slug, 400 when nothing would change |
| FR-6 | `POST /content/blog/:slug/publish` and `/unpublish` are idempotent, preserve `publishedAt` across unpublish and republish, and audit each real transition with the matching action |

## Evidence paths

- `convex/contentApi.ts` (`update`, `setPublished`, shared taxonomy and budget helpers)
- `convex/http.ts` (`PATCH` and `POST …/publish|unpublish` routes, `parseContentPath`)
- `convex/__tests__/contentApi.update.test.ts`
- `conductor/tracks/20261027-agent-content-api/verification/phase-4.md`

## Deviations

None. The diff is confined to the three paths in `Touches`; generated types did
not change in this phase because the `contentApi` module already existed.

## Notes

- **A real bug the tests caught.** `readStringList` returned `[]` for an absent
  `tags` key, so a PATCH that never mentioned tags replaced the tag set with an
  empty one — exactly the collateral loss AC-6 exists to prevent. The helper now
  returns `undefined` when the key is absent, and the create route maps that to
  `[]` explicitly.
- **Slug is immutable through the API.** The slug identifies the post in the
  URL, so sending a new one is not supported; a rename is a create plus a human
  cleanup. This keeps the update path free of redirect bookkeeping.
- **Body and reading time travel together.** `update` takes an optional
  `body` object containing both HTML and reading time, so a body can never be
  stored with a stale measurement.
- **Idempotent transitions skip metering.** Asking for the state a post already
  holds returns `changed: false` without consuming write budget or writing an
  audit row, because nothing changed and the log should say so.
- **`publishedAt` is stable.** Publish stamps it only when absent, so an
  unpublish followed by a republish keeps the original date.

## Primary verification

| Command | Exit | Result |
| --- | --- | --- |
| `pnpm type-check && pnpm lint && pnpm format:check && pnpm test` | 0 | Re-run independently after the phase commit: 250/250 tests passed, static layers clean |

Working tree clean after the phase commit; the diff for `457d40e..HEAD` is
exactly the three declared `Touches` paths.
