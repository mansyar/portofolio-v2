# Blog Index Server Prefetch — Implementation Plan

> **Branch:** `fix/20261026-blog-index-prefetch`
> **Base:** `main` @ `a3ef7cd8ea149808891176db8bd19cfb5d5d089e`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.

## Phase 1: Prefetch the default listing

- **Goal:** Page 1 of `/blog` is served from the loader's cache, and a regression test proves
  the component reads the key the loader writes.
- **Depends on:** none
- **Covers:** FR-1, FR-2, FR-3, AC-1, AC-3
- **Touches:** `src/routes/blog.index.tsx`,
  `src/components/features/blog/BlogContent.tsx`,
  `src/routes/__tests__/blog-index-prefetch.test.tsx`
- **Verification:** `pnpm exec vitest run src/routes/__tests__/blog-index-prefetch.test.tsx`
- **Status:** verified

- [x] **P1.T1: Write the failing regression test** — covers: AC-1, AC-3
  - [x] Mock `createFileRoute` as identity (the existing route-test convention), read
        `loader` off the route module, and run it with a real `QueryClient` whose default
        `queryFn` returns a two-post fixture.
  - [x] Assert the loader's `ensureQueryData` options carry the same query key as
        `convexQuery(api.blog.listPublished, { page: 1, pageSize: 9 })`.
  - [x] Render `BlogContent` under `QueryClientProvider` and assert both titles appear with
        no suspense fallback — the assertion that fails on a key mismatch.
  - [x] Record the red run against the current route in `verification/phase-1.md`.
- [x] **P1.T2: Seed the query in the loader** — covers: FR-1, FR-2, FR-3
  - [x] Export the listing page size from `BlogContent.tsx` and import it in the route.
  - [x] Await `context.queryClient.ensureQueryData(convexQuery(api.blog.listPublished, …))`
        with `page`, `pageSize`, `categorySlug: category`, and `tagSlug: tag` from `deps`.
  - [x] Keep `loaderDeps` as-is and leave unset filters `undefined`.

**Result:** verified
**Checkpoint:** 3923c06
**Evidence:** conductor/tracks/20261026-blog-index-prefetch/verification/phase-1.md

**Risk:** a prefetch under a slightly different argument object (for example `categorySlug:
undefined` serialized as `null`, or a duplicated page-size literal) produces a key the
component never reads. The cache-level assertion in P1.T1 is what catches that; a loader-only
assertion would not.

## Phase 2: Every listing state, and the full gate

- **Goal:** Each supported search state prefetches its own key, an out-of-range page keeps
  the empty state, and the whole project gate plus the production build pass.
- **Depends on:** Phase 1
- **Covers:** FR-1, NFR-1, NFR-2, NFR-3, NFR-4, AC-2, AC-4, AC-5
- **Touches:** `src/routes/__tests__/blog-index-prefetch.test.tsx`,
  `src/routes/blog.index.tsx`
- **Verification:** `pnpm type-check && pnpm lint && pnpm format:check && pnpm test && pnpm build`
- **Status:** in_progress

- [ ] **P2.T1: Table-drive the search states** — covers: AC-2
  - [ ] Cover `page: 2`, `category` only, `tag` only, and both together; assert each key
        carries the supplied value and leaves the other filter `undefined`.
- [ ] **P2.T2: Keep the out-of-range page honest** — covers: AC-4
  - [ ] Stub an empty listing for a page past `totalPages`; assert the loader resolves and
        the route's empty state renders without an error.
- [ ] **P2.T3: Run the gate, build, and coverage** — covers: NFR-1, NFR-2, NFR-3, NFR-4, AC-5
  - [ ] Run the full verification command and `pnpm test:coverage`; record both in
        `verification/phase-2.md`.
  - [ ] Confirm `package.json` and `pnpm-lock.yaml` are unchanged and the coverage floor was
        not edited.

**Result:** pending
**Checkpoint:** pending
**Evidence:** conductor/tracks/20261026-blog-index-prefetch/verification/phase-2.md

**Risk:** the test renders a route component outside a router. If `Link` or another router
hook is needed by the rendered tree, the mock must provide it; keep the fixture minimal
rather than widening the production code for testability.
