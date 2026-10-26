# Integrated Verification — Newsletter Lifecycle

- **Track:** `20261026-newsletter-lifecycle`
- **Date:** 2026-10-26
- **Branch:** `fix/20261026-newsletter-lifecycle`
- **Base:** `main` @ `1e721b43b2e82c2c0f93e43681c7dc332e20e2cf`
- **Head:** `60aa7b7`
- **Result:** pass

## Commands

Run as separate processes on the final HEAD, after `rm -rf .output`, with each exit code
captured.

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| build | `pnpm build` | 0 | Regenerates the route tree, including `/newsletter/unsubscribe` and `/admin/newsletter/` |
| static | `pnpm type-check` | 0 | Clean |
| static | `pnpm lint` | 0 | 21 warnings, 0 errors |
| static | `pnpm format:check` | 0 | Clean |
| unit | `pnpm test` | 0 | 44 files, 126 tests |
| unit | `pnpm test:coverage` | 0 | statement 24.76%, branch 30.96%, function 18.37%, line 24.96% |

Build runs first here on purpose: a new file route only exists in `src/routeTree.gen.ts`
after a build, so type-checking before it reports an unassignable route id.

## Coverage movement

| Metric | Before track | After track |
| --- | --- | --- |
| Statements | 22.45% | 24.76% |
| Branches | 29.76% | 30.96% |
| Functions | 16.29% | 18.37% |
| Lines | 22.82% | 24.96% |

The newsletter module, its mail builder, and the unsubscribe page account for the increase;
`convex/newsletter.ts` is now one of the better-covered backend modules.

## Notes

- The 18 new tests are the identity suite (3), the migration suite (3), unsubscribe (4), the
  mail builder (4), the route page (3), and the admin guard (3), minus one that replaced
  nothing.
- No new lint warnings; the count stays at 21.
