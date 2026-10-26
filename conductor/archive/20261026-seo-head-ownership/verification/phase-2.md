# Phase 2 — One origin

- **Track:** `20261026-seo-head-ownership`
- **Phase:** 2 — One origin
- **Date:** 2026-10-26
- **Branch:** `fix/20261026-seo-head-ownership`
- **Base:** `8a86077` (phase base)
- **Head:** `5f29b3c`
- **Result:** verified

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| unit (red) | `pnpm exec vitest run src/lib/__tests__/site.test.ts` | 1 | 5 failed: `siteUrl` did not exist, and both XML routes hardcoded the origin |
| unit | same | 0 | 5 passed |
| static | `pnpm type-check` | 0 | clean |
| static | `pnpm lint` | 0 | 21 pre-existing warnings, 0 errors |
| static | `pnpm format:check` | 0 | clean |

Raw output: `.conductor/evidence/20261026-seo-head-ownership/phase-2-red-run.txt`,
`phase-2-gate.txt`, `phase-2-static.txt`.

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-4 | `siteUrl()` falls back to production for missing/loopback values, strips a trailing slash, and is the only origin the sitemap and feed consume | four resolver cases plus the source assertion in `src/lib/__tests__/site.test.ts` | met |

## Files changed

- `src/lib/site.ts` — `DEFAULT_SITE_ORIGIN`, loopback rejection, `siteUrl()`.
- `src/components/seo.tsx` — canonical, OG image, and JSON-LD `url` now use `siteUrl()`.
- `src/routes/sitemap[.]xml.ts`, `src/routes/feed[.]xml.ts` — imported the same resolver.
- `convex/lib/welcomeEmail.ts` — **deviation:** an empty `SITE_URL` was treated as configured
  and produced `""`; it is now treated as unset, matching the tested contract.
- `src/lib/__tests__/site.test.ts` — new.

## Deviations

- `convex/lib/welcomeEmail.ts` is outside the phase's `Touches`. The resolver test asserts the
  mail helper agrees with the web default; with `SITE_URL=""` the helper returned an empty
  origin instead. Fixing the nullish check to a truthiness check is the smallest change that
  makes the shared contract true, and it prevents scheme-less opt-out links.

## Notes

- The resolver reads `import.meta.env` inside the function, so `vi.stubEnv` and runtime
  overrides are honoured; a module-level read would have been inlined at build time.
- The sitemap and feed keep their separate Convex URL fallback (`convex.ansyar-world.top`);
  the guard only forbids the bare site origin literal.
- `pnpm test` is not re-run in this phase's table; Phase 3 runs the full suite and build on the
  combined change.

## Primary verification

Re-ran the phase verification on `5f29b3c`:

```
$ pnpm exec vitest run src/lib/__tests__/site.test.ts
 ✓ src/lib/__tests__/site.test.ts (5 tests) 8ms
 Test Files  1 passed (1)
      Tests  5 passed (5)
exit 0
```

`git status --porcelain` was empty after the commit.
