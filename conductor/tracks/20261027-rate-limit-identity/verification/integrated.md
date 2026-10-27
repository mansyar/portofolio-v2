# Integrated Verification — Rate Limit Identity

- **Track:** `20261027-rate-limit-identity`
- **Branch:** `fix/20261027-rate-limit-identity`
- **Base:** `main` @ `60012bdf2e99e8c9b09a9ce2e6eb32ebda41ac58`
- **Date:** 2026-10-27
- **Result:** verified

## Commands (run on the branch after all three phases)

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| static | `pnpm type-check` | 0 | `tsc --noEmit` clean |
| static | `pnpm lint` | 0 | 21 warnings — identical to the base commit, none new |
| static | `pnpm format:check` | 0 | 186 files clean |
| unit | `pnpm test` | 0 | 50 files, 167 tests passed |
| coverage | `pnpm test:coverage` | 0 | statements 29.92%, branches 35.19%, functions 21.87%, lines 30.0%; floor is 29 / 21 |
| build | `pnpm build` | 0 | Nitro server + client build succeeded |
| container | `docker build -f docker/Dockerfile -t portfolio-v2:rate-limit-verify .` | 0 | image exported; run because the track changed a build-affecting config (`vite.config.ts`) |

Test delta on the branch: 48 files / 146 tests at base → 50 files / 167 tests.
Coverage delta: 25.47% lines at base → 30.0% lines.

## Behaviour exercised against a real server

`PORT=3010 node .output/server/index.mjs`:

| Request | Result |
| --- | --- |
| `GET /contact` | `200`; form fields `name`, `email`, `message`, and the `website` honeypot are rendered |
| `GET /about` | `200`; the newsletter form markup is present |
| build output | `/newsletter/subscribe` present in both the client bundle and the server chunk |
| build output | no `x-forwarded-for` outside the Convex deployment — the resolver never ships to the browser |

## What the Phase 1 red run proves

The four test files were written before the endpoints existed and failed for exactly
the predicted reasons (unrouted path `404`, missing module, still-public mutation).
Phase 2 turned all of them green **without editing a test**, which is what makes the
suite a description of the defect rather than of the fix.

## Not verified here

- **The production header chain.** Whether the deployed Convex HTTP action receives
  `x-forwarded-for` with the real client as its rightmost public entry cannot be
  observed from this machine. The resolver is unit-tested against synthetic chains,
  including a forged leading hop and container-private proxy hops, and the failure
  mode is chosen to be loud (contact refuses rather than silently allowing). If the
  chain differs, the fix is a trusted-hop count in one function, not a redesign.
- **A real browser round trip to the endpoint**, which needs a live deployment with
  the new Convex functions pushed. The CORS and preflight answers are asserted at the
  HTTP layer instead.
- **The production deploy**, which is a human-only exception in `workflow.md`.

## Notes

- `pnpm build` ran without a live Convex deployment, as configured, so the build check
  says nothing about endpoint reachability — that is exactly why the endpoint
  behaviour is covered by `convex-test` at the HTTP layer.
- The Docker image builds from the same lockfile and `COPY` set as before; no image
  definition changed in this track.
