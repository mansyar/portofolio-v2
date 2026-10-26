# Review: SEO Head Ownership

- **Track:** `20261026-seo-head-ownership`
- **Type:** `bug`
- **Branch:** `fix/20261026-seo-head-ownership`
- **Range:** `f05c4e02c9ac12b12252578d5adec78a9dd003f3..e22f0a6` (code head `b1a03f1`)
- **Date:** `2026-10-26T20:42:00+11:00`
- **Verdict:** `PASS`

## Summary

The head now has one owner, one origin feeds every absolute URL, and the capability/404 pages
are explicitly `noindex`. Volume is small and entirely within the three phases' `Touches`: 19
files, 235 insertions, of which four are new test files. No Critical, High, Medium, or Low
findings. The built-server check is the evidence that matters here — it shows one `<title>` on
each sampled route and a production canonical from a build whose env names localhost.

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| test | `pnpm test` | pass (48 files, 146 tests) | `verification/integrated.md` |
| coverage | `pnpm test:coverage` | pass (lines 25.13% → 25.47%, floor 3%) | `verification/phase-3.md` |
| lint | `pnpm lint` | pass (21 warnings, 0 errors) | `verification/integrated.md` |
| format | `pnpm format:check` | pass | `verification/integrated.md` |
| typecheck | `pnpm type-check` | pass | `verification/integrated.md` |
| build | `pnpm build` | pass | `verification/integrated.md` |
| runtime | built server, five routes | pass (one title each; production canonical; noindex) | `verification/phase-3.md` |

`/sitemap.xml` and `/feed.xml` could not be fetched from the local built server: their
`ConvexClient` WebSocket reconnected in a loop and the request timed out. That is a pre-existing
property of those routes, not this diff; their origin is asserted at the source level instead,
and the limitation is recorded rather than counted as a pass.

## Requirements

| ID | Implemented by | Verified by | Status |
| --- | --- | --- | --- |
| FR-1 | P1.T1 — root title removed; `Seo` composes once | `seo.test.tsx` exact title + single `<title>`; SSR count | covered |
| FR-2 | P1.T2 — seven routes pass bare titles | `seo-surface.test.tsx` owner-name scan | covered |
| FR-3 | P1.T2 — admin route head and 404 `Seo` | admin head test; 404 test; SSR `/admin/login` and 404 | covered |
| FR-4 | P2.T1 — `siteUrl()` consumed by head, sitemap, feed | `site.test.ts` resolver cases + source assertion; SSR canonical | covered |
| FR-5 | P3.T1 — `noindex` prop on unsubscribe and 404 | `seo.test.tsx`, `not-found.test.tsx`, SSR robots meta | covered |
| NFR-1 | No dependency or schema change | diff contains none; lockfile untouched | covered |
| NFR-2 | SSR and client agree | SSR table plus component tests; one title after render | covered |
| NFR-3 | Gate passes, floor untouched | `integrated.md`; `vite.config.ts` unmodified | covered |
| NFR-4 | Production origin unchanged | SSR canonical is `https://ansyar-world.top/...` | covered |
| NFR-5 | Pure composition/resolver, no new calls | `site.ts` is pure; `Seo` still has one settings query | covered |
| AC-1 | One page-specific title on `/about` and `/blog/` | SSR table (titles=1) | covered |
| AC-2 | Owner name appears once | SSR titles; `seo.test.tsx` | covered |
| AC-3 | Guard fails on root title or owner-name route title | red run in `phase-1.md` | covered |
| AC-4 | Resolver fallback/trim/consumers | `site.test.ts` five cases | covered |
| AC-5 | `noindex` on unsubscribe; sitemap excludes token/admin | SSR table; sitemap guard | covered |
| AC-6 | Admin and 404 each one title | SSR table; `not-found.test.tsx` | covered |
| AC-7 | Five gate commands exit 0 | `phase-3-final-gate.txt` `GATE_FAIL=0` | covered |

## Findings

### Critical

- none

### High

- none

### Medium

- none

### Low

- none

## Overrides

- none

## Plan compliance

Three phases, each with `Result`, `Checkpoint`, and `Evidence`; all seven tasks and their
sub-tasks are `[x]`. The code diff matches the union of the phases' `Touches` plus one
reported deviation: `convex/lib/welcomeEmail.ts` in Phase 2, where an empty `SITE_URL` returned
an empty origin. That deviation is recorded in `phase-2.md` and is the smallest change that
makes the resolver's shared-default test true.

## Out of scope

- **Error pages have no title.** Accepted in the spec: the router's error boundary can render
  inside the admin tree, whose title is route-level, and a second tag there would recreate the
  defect. Not silently ignored.
- **Development canonicals.** A local `pnpm dev` now emits the production canonical because the
  resolver rejects loopback unconditionally. That is deliberate: canonical must not name a
  developer machine.
- **Sitemap/feed WebSocket client.** Their `ConvexClient` reconnection loop in the local
  production build is pre-existing and unrelated to the origin change.
- **Coverage floor.** Still 3% against a measured 25.47%; the project-wide chore remains its own
  track.

## Debt

- none

## Doc sync

`updated` — `conductor/tech-stack.md` gained a dated "Site head and origin" section recording
the single title owner, the resolver contract, the mail exception, and the `noindex` rule.

## History

| Round | Verdict | Critical | High | Medium | Low | Fixed |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | PASS | 0 | 0 | 0 | 0 | 0 |
