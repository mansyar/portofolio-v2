## Summary

The document head had two owners: the root route declared a title and `Seo` rendered another,
so every page shipped two `<title>` elements and the generic one won. Seven routes also
repeated the owner name that `Seo` already appends. This track leaves one owner, makes route
titles bare, gives the admin tree and 404 their own single title, routes canonical/OG/sitemap/
feed through one origin resolver that rejects loopback hosts, and marks the capability and 404
pages `noindex`.

## Track

- **ID:** `20261026-seo-head-ownership`
- **Type:** `bug`
- **Spec:** [`conductor/archive/20261026-seo-head-ownership/spec.md`](conductor/archive/20261026-seo-head-ownership/spec.md)
- **Plan:** [`conductor/archive/20261026-seo-head-ownership/plan.md`](conductor/archive/20261026-seo-head-ownership/plan.md)
- **Review:** [`conductor/archive/20261026-seo-head-ownership/review.md`](conductor/archive/20261026-seo-head-ownership/review.md)

## What happened

| Phase | Goal | Result | Checkpoint | Notes |
| --- | --- | --- | --- | --- |
| 1: One title owner | One composed title per page | verified | `15dc4d0` | Root title removed; admin route head and 404 `Seo` added |
| 2: One origin | One resolver for canonical/OG/sitemap/feed | verified | `5f29b3c` | Deviation: empty `SITE_URL` now treated as unset in mail |
| 3: Indexability and the full gate | `noindex` for token/404 pages; gate and built-server proof | verified | `b1a03f1` | SSR check: one title on five routes, production canonical |

## Requirements

- [x] `FR-1` — exactly one `<title>`, composed by `Seo` as `<page> | <site name>` (test: `src/components/__tests__/seo.test.tsx`)
- [x] `FR-2` — route titles are bare page names (guard: `src/routes/__tests__/seo-surface.test.tsx`)
- [x] `FR-3` — admin tree and 404 each own one title
- [x] `FR-4` — canonical/OG/sitemap/feed use one resolver (`src/lib/__tests__/site.test.ts`)
- [x] `FR-5` — `noindex` on the unsubscribe page and the 404 boundary
- [x] `NFR-1` — no dependency, schema, or backend query change
- [x] `NFR-2` — SSR and client heads agree (one title, same canonical)
- [x] `NFR-3` — all five gate commands exit 0; coverage 25.13% → 25.47%
- [x] `NFR-4` — production origin unchanged
- [x] `AC-1` — one page-specific title on `/about` and `/blog/`
- [x] `AC-2` — owner name appears once in the title
- [x] `AC-3` — source guard fails on a root title or an owner-name route title (red run recorded)
- [x] `AC-4` — resolver handles missing, loopback, trailing-slash, and valid origins
- [x] `AC-5` — unsubscribe is `noindex`; the sitemap excludes token and admin paths
- [x] `AC-6` — admin and 404 each render one title
- [x] `AC-7` — five gate commands exit 0 on the final HEAD

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| unit | `pnpm test` | pass (48 files, 146 tests) | `conductor/archive/20261026-seo-head-ownership/verification/integrated.md` |
| coverage | `pnpm test:coverage` | pass (lines 25.47%, floor 3%) | `phase-3.md` |
| lint | `pnpm lint` | pass (21 pre-existing warnings) | `integrated.md` |
| format | `pnpm format:check` | pass | `integrated.md` |
| typecheck | `pnpm type-check` | pass | `integrated.md` |
| build | `pnpm build` | pass | `integrated.md` |
| runtime | built server on five routes | pass | `phase-3.md` — one `<title>` each, production canonical, `noindex` where required |

## Review

- **Verdict:** `PASS`
- **Rounds:** 1
- **Fixed:** 0 findings
- **Accepted/deferred:** 0

## Deviations and risks

- `convex/lib/welcomeEmail.ts` is outside the Phase 2 `Touches`: an empty `SITE_URL` produced an
  empty origin, so the shared-default test could not hold. The guard now treats empty as unset.
- Error pages intentionally keep no page title; the error boundary can render inside the admin
  tree, whose title is route-level, and a second tag would recreate this bug.
- Local development now emits the production canonical, because loopback origins are rejected
  unconditionally. Deliberate: a canonical must never name a developer machine.
- `/sitemap.xml` and `/feed.xml` could not be exercised on the local built server — their
  `ConvexClient` WebSocket reconnected in a loop. Their origin is covered by a source assertion
  instead; this is stated, not hidden.

## Follow-ups

- none

## Rollback

```bash
git revert --no-edit <squash-merge-sha>
```

No data, migration, or configuration change is involved.
