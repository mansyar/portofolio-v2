# Blog Discovery Correctness — Implementation Plan

> **Branch:** `fix/20261026-blog-discovery-correctness`
> **Base:** `main` @ `048e99fc1e090e583c416269f8085008bbfe665b`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.

## Phase 1: Server-side listing contract

- **Goal:** `blog.listPublished` returns the correct page of published posts for a page
  number and an optional category or tag slug, and reports the filtered total; a test proves
  the current handler fails it.
- **Depends on:** none
- **Covers:** FR-1, FR-2, FR-3, FR-4, FR-5, FR-6, NFR-2, NFR-3
- **Touches:** `convex/blog.ts`, `convex/__tests__/blog.listPublished.test.ts`
- **Verification:** `pnpm exec vitest run convex/__tests__/blog.listPublished.test.ts`
- **Status:** verified

- [x] **P1.T1: Prove the bug before the fix** — covers: FR-3, FR-6
  - [x] Write the test that expects `tagSlug` to filter by tag membership and that expects
    a slug-substring post to be excluded from an unrelated category
  - [x] Run it against the current handler and capture the failing output as evidence
- [x] **P1.T2: Resolve slugs to ids** — covers: FR-2, FR-3, FR-5
  - [x] Look up the category and tag by `by_slug`; an unknown slug yields an empty page with
    `total: 0` instead of falling through to every post
  - [x] Pass `categoryId` into the index query and match tags by `tagIds` membership
- [x] **P1.T3: Page published posts and report the filtered total** — covers: FR-1, FR-4,
  FR-5, NFR-2, NFR-3
  - [x] Read the published set through the `by_published` index, exclude drafts and
    not-yet-due scheduled posts, and slice the requested page
  - [x] Return `{ posts, total, totalPages }` and clamp a page past the end to the empty
    state
  - [x] Replace the unused `paginationOpts`/`tagSlug` argument shape with
    `{ page, pageSize, categorySlug, tagSlug }`, and confirm nothing else called it

**Result:** verified
**Checkpoint:** 1337b89
**Evidence:** conductor/tracks/20261026-blog-discovery-correctness/verification/phase-1.md

**Risk:** the function is currently API-dead, so changing its arguments cannot break a
caller — but that must be re-verified with a grep rather than assumed. Tag filtering after
the published read is `O(published)`; the spec records that trade-off. A test that only
passes against the new code would not satisfy P1.T1, so the failing run is captured first.

## Phase 2: Blog index wiring

- **Goal:** The blog index renders the server page directly; the substring filter, the
  100-post cap, and the client-side slice are gone, and the empty state and boundaries hold.
- **Depends on:** Phase 1
- **Covers:** FR-1, FR-4, FR-5, FR-6, NFR-4, NFR-5
- **Touches:** `src/components/features/blog/BlogContent.tsx`,
  `src/components/features/blog/__tests__/blog-content.test.tsx`
- **Verification:** `pnpm type-check && pnpm lint && pnpm format:check && pnpm test && pnpm build`
- **Status:** in_progress

- [ ] **P2.T1: Render the server page** — covers: FR-1, FR-4
  - [ ] Query the new listing shape with `page`, `pageSize`, `category`, and `tag`
  - [ ] Delete the `listRecent` snapshot, the `slug.includes` filter, and the in-memory
    slice
  - [ ] Feed `totalPages` from the query into the existing `Pagination`
- [ ] **P2.T2: Pin the boundaries in a component test** — covers: FR-4, FR-5, FR-6
  - [ ] Assert a filtered page renders only its returned posts and the reported page count
  - [ ] Assert the empty state for an empty page and that no substring match is performed
    (fixture whose slug contains another tag's text is not listed)

**Risk:** `BlogContent` sits inside `Suspense` with a `SectionSkeleton` fallback and is
called from `blog.index.tsx` with the validated search params; the props must stay the same
so the route does not change. Mocking follows the existing `src/routes/__tests__/` pattern
and needs no live backend.
