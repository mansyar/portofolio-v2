# SEO Head Ownership — Implementation Plan

> **Branch:** `fix/20261026-seo-head-ownership`
> **Base:** `main` @ `f05c4e02c9ac12b12252578d5adec78a9dd003f3`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.

## Phase 1: One title owner

- **Goal:** Every public page renders exactly one `<title>`, composed from a bare page title
  and the site name; the root route declares no title; admin and 404 pages each own one.
- **Depends on:** none
- **Covers:** FR-1, FR-2, FR-3, AC-1, AC-2, AC-3, AC-6
- **Touches:** `src/routes/__root.tsx`, `src/components/seo.tsx`, `src/routes/about.tsx`,
  `src/routes/blog.index.tsx`, `src/routes/contact.tsx`, `src/routes/projects.index.tsx`,
  `src/routes/skills.tsx`, `src/routes/uses.tsx`, `src/routes/newsletter/unsubscribe.tsx`,
  `src/routes/admin.tsx`, `src/components/NotFound.tsx`, `src/lib/site.ts`,
  `src/components/__tests__/seo.test.tsx`, `src/routes/__tests__/seo-surface.test.ts`
- **Verification:** `pnpm exec vitest run src/components/__tests__/seo.test.tsx src/routes/__tests__/seo-surface.test.ts`
- **Status:** in_progress

- [ ] **P1.T1: Remove the second title owner** — covers: FR-1
  - [ ] Delete the `title` entry from the root route's `head` meta, leaving charset and viewport
  - [ ] Export `DEFAULT_SITE_NAME` from `src/lib/site.ts` and consume it in `Seo`
- [ ] **P1.T2: Give every surface a bare title** — covers: FR-2, FR-3
  - [ ] Strip `| Muhammad Ansyar Rafi Putra` from the seven route titles
  - [ ] Add a route-level `Admin | <site name>` title on `/admin`
  - [ ] Render `Seo` with `Page not found` in `NotFound`
- [ ] **P1.T3: Pin the composition with tests** — covers: AC-1, AC-2, AC-3, AC-6
  - [ ] Assert `document.title` equals `<page> | Test Site` and exactly one `<title>` exists
  - [ ] Add a source guard: root `head` declares no title; no route title embeds the owner name
  - [ ] Assert the admin route's `head` title is present and unique

**Result:** pending
**Checkpoint:** pending
**Evidence:** conductor/tracks/20261026-seo-head-ownership/verification/phase-1.md

**Risk:** removing the root title leaves any surface without `Seo` title-less. The guard test
and the SSR check cover the public routes, the admin tree, and 404; the error boundary is a
documented exception.

## Phase 2: One origin

- **Goal:** Canonical, Open Graph, sitemap, and feed URLs come from a single resolver that
  never emits a loopback host.
- **Depends on:** Phase 1
- **Covers:** FR-4, AC-4
- **Touches:** `src/lib/site.ts`, `src/components/seo.tsx`,
  `src/routes/sitemap[.]xml.ts`, `src/routes/feed[.]xml.ts`, `src/lib/__tests__/site.test.ts`
- **Verification:** `pnpm exec vitest run src/lib/__tests__/site.test.ts`
- **Status:** pending

- [ ] **P2.T1: Add the resolver and consume it** — covers: FR-4
  - [ ] Implement `siteUrl()`: trim, strip trailing slashes, reject loopback, fall back to the
        production origin
  - [ ] Use it in `Seo` for canonical and OG URLs, and in the sitemap and feed routes
- [ ] **P2.T2: Pin the resolver behaviour** — covers: AC-4
  - [ ] Cover missing, loopback, trailing-slash, and valid origins
  - [ ] Assert the mail helper's default origin equals `siteUrl()`'s default

**Result:** pending
**Checkpoint:** pending
**Evidence:** conductor/tracks/20261026-seo-head-ownership/verification/phase-2.md

**Risk:** `import.meta.env` is inlined at build time, so the resolver must read it inside the
function (not at module load) for `vi.stubEnv` and for runtime overrides to work.

## Phase 3: Indexability and the full gate

- **Goal:** Token and 404 pages are explicitly `noindex`, the sitemap excludes them, and the
  built server proves one title, a production canonical, and the robots tag.
- **Depends on:** Phase 2
- **Covers:** FR-5, NFR-1, NFR-2, NFR-3, NFR-4, NFR-5, AC-5, AC-7
- **Touches:** `src/components/seo.tsx`, `src/routes/newsletter/unsubscribe.tsx`,
  `src/components/NotFound.tsx`, `src/components/__tests__/seo.test.tsx`,
  `convex/sitemap.ts`
- **Verification:** `pnpm type-check && pnpm lint && pnpm format:check && pnpm test && pnpm build`
- **Status:** pending

- [ ] **P3.T1: Add the noindex capability** — covers: FR-5, AC-5
  - [ ] Emit `<meta name="robots" content="noindex">` when `noindex` is set
  - [ ] Set it on the unsubscribe page and the 404 boundary
  - [ ] Assert the sitemap's static routes exclude `/newsletter` and `/admin`
- [ ] **P3.T2: Run the gate and the built-server check** — covers: NFR-1, NFR-2, NFR-3, NFR-4, NFR-5, AC-7
  - [ ] Run the five gate commands and `pnpm test:coverage`; record exit codes
  - [ ] Start the built server; count titles on `/about`, `/blog/`, `/admin/login`, and a 404;
        confirm the canonical host and the robots tag

**Result:** pending
**Checkpoint:** pending
**Evidence:** conductor/tracks/20261026-seo-head-ownership/verification/phase-3.md

**Risk:** the built server needs a reachable Convex backend to render settings-backed pages;
if it is unreachable, record which checks could not run rather than marking them passed.
