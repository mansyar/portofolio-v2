# Phase 3 — Indexability and the full gate

- **Track:** `20261026-seo-head-ownership`
- **Phase:** 3 — Indexability and the full gate
- **Date:** 2026-10-26
- **Branch:** `fix/20261026-seo-head-ownership`
- **Base:** `d7327b7` (phase base)
- **Head:** `b1a03f1`
- **Result:** verified

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| unit | `pnpm exec vitest run src/components/__tests__/seo.test.tsx src/components/__tests__/not-found.test.tsx src/routes/__tests__/seo-surface.test.tsx src/lib/__tests__/site.test.ts` | 0 | 16 tests |
| static | `pnpm type-check` | 0 | clean |
| static | `pnpm lint` | 0 | 21 pre-existing warnings, 0 errors |
| static | `pnpm format:check` | 0 | clean |
| unit | `pnpm test` | 0 | 48 files, 146 tests (was 46 / 137) |
| build | `pnpm build` | 0 | Nitro build in 35.21s |
| coverage | `pnpm test:coverage` | 0 | lines 25.13% → **25.47%**, functions 18.52% → 18.93% |

Raw output: `.conductor/evidence/20261026-seo-head-ownership/phase-3-tests.txt`,
`phase-3-final-gate.txt`, `phase-3-coverage.txt`.

## Built-server head check

Built at `b1a03f1`, served with `node .output/server/index.mjs` on `127.0.0.1:4319`. The build
environment still carries `VITE_APP_URL=http://localhost:3000` from `.env.example`.

| Path | Status | `<title>` count | Title | Canonical | Robots |
| --- | --- | --- | --- | --- | --- |
| `/about` | 200 | **1** | `About Me \| Muhammad Ansyar Rafi Putra \| Portfolio` | `https://ansyar-world.top/about` | absent |
| `/blog/` | 200 | **1** | `Blog \| Muhammad Ansyar Rafi Putra \| Portfolio` | `https://ansyar-world.top/blog` | absent |
| `/admin/login` | 200 | **1** | `Admin \| Muhammad Ansyar Rafi Putra \| Portfolio` | — | absent |
| `/definitely-missing` | 404 | **1** | `Page not found \| Muhammad Ansyar Rafi Putra \| Portfolio` | `https://ansyar-world.top/definitely-missing` | `noindex` |
| `/newsletter/unsubscribe` | 200 | **1** | `Unsubscribe \| Muhammad Ansyar Rafi Putra \| Portfolio` | `https://ansyar-world.top/newsletter/unsubscribe` | `noindex` |

The canonical host is the production origin even though the build env names localhost, which is
the defect this phase's resolver fixes. Raw HTML: `.conductor/evidence/20261026-seo-head-ownership/ssr-_*.html`.

**Not run:** `/sitemap.xml` and `/feed.xml` on the built server. Both build their XML through a
`ConvexClient` WebSocket, which reconnected in a loop in this environment and never answered
within the command timeout; the request had to be abandoned, not reported as a pass. The
origin they use is asserted at the source level (`site.test.ts` checks both routes import the
resolver and no longer hardcode the site origin), and their content was unchanged apart from
that origin.

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-5 | Unsubscribe emits `noindex`; the sitemap excludes `/newsletter` and `/admin` | SSR table; `keeps token and admin paths out of the sitemap` | met |
| AC-6 | Admin and 404 each render exactly one title | SSR table (`/admin/login`, `/definitely-missing`); `not-found.test.tsx` | met |
| AC-7 | Five gate commands exit 0 on the final HEAD | `phase-3-final-gate.txt`, `GATE_FAIL=0` | met |

## Files changed

- `src/components/seo.tsx` — `noindex` prop emitting `<meta name="robots" content="noindex">`.
- `src/components/NotFound.tsx` — passes `noindex`.
- `src/routes/newsletter/unsubscribe.tsx` — passes `noindex`.
- `src/components/__tests__/seo.test.tsx` — noindex on/off cases.
- `src/components/__tests__/not-found.test.tsx` — 404 title and robots tag.
- `src/routes/__tests__/seo-surface.test.tsx` — sitemap exclusion guard.

## Deviations

None.

## Notes

- The first gate run in this phase failed lint/format on a JSX line break only; `biome check
  --write` fixed it, and the final gate above is the re-run on the committed code.
- Coverage rose with the new tests; the configured floor was not touched.
- The sitemap route's WebSocket client is a pre-existing property of the route, unrelated to
  the head change; it is recorded here rather than silently skipped.

## Primary verification

The final gate in `phase-3-final-gate.txt` ran on `b1a03f1`:

```
HEAD=b1a03f1
type-check exit 0
lint exit 0 (21 warnings)
format:check exit 0
test exit 0 (48 files, 146 tests)
build exit 0
GATE_FAIL=0
```

`git status --porcelain` was empty after the code commit.
