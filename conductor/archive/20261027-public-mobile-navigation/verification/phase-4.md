# Phase 4 — Accessibility pass, ratchet, and the build gate

| Field | Value |
| --- | --- |
| Track | `20261027-public-mobile-navigation` — Public Mobile Navigation |
| Phase | 4 — Accessibility pass, ratchet, and the build gate |
| Date | 2026-10-27 |
| Branch | `fix/20261027-public-mobile-navigation` |
| Base commit | `7513780` |
| Head commit | `a84b34f` |
| Result | **verified** |

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| static | `pnpm type-check` | 0 | Clean |
| static | `pnpm lint` | 0 | 0 errors, 21 warnings — baseline unchanged |
| static | `pnpm format:check` | 0 | Clean |
| unit + coverage | `pnpm test:coverage` | 0 | `Test Files 53 passed (53)`, `Tests 193 passed (193)`. Coverage `All files 32.56% stmts / 37.19% branch / 24.34% funcs / 32.66% lines` |
| build | `pnpm build` | 0 | Production build compiles |
| runtime | `PORT=4399 node .output/server/index.mjs` then `curl http://127.0.0.1:4399/` | 0 | HTTP 200 from the **built** server; see the SSR checks below |

## Built-output checks (P4.T3.2)

Run against the production build, not the dev server:

| Check | Observed |
| --- | --- |
| Server starts and serves `/` | `HTTP=200` |
| The trigger ships in the server-rendered HTML | `aria-label="Open navigation menu"` present (1 occurrence) |
| The panel ships and is closed on first paint | `<nav id="_R_bba_" hidden="" aria-label="Mobile navigation" class="… mobile-nav-panel …">` — the `hidden` attribute is in the SSR markup, so no open-panel flash is possible |
| The panel's styling reaches the browser | `.mobile-nav-panel{animation:mobile-nav-open .15s ease-out}` plus the `prefers-reduced-motion` override, and `outline-color:var(--focus-ring-color)`, all present in `.output/public/assets/main-*.css` |

The server process was started for this check and stopped by its recorded PID.

## Coverage ratchet (P4.T3.1)

| Measure | Before this track | After | New floor |
| --- | --- | --- | --- |
| Lines | 30.0% | **32.66%** | 32 (was 29) |
| Functions | 21.87% | **24.34%** | 24 (was 21) |
| Tests | 175 | **193** | — |

`vite.config.ts` was raised to the new baseline, with the comment updated to name this
track as the source of the measurement. The floor was not lowered anywhere.

## Guards (P4.T2)

| Guard | Method | Result |
| --- | --- | --- |
| No new Biome diagnostics; the seven a11y rules stay at `error` | `pnpm lint` plus a scripted read of `biome.json` asserting all seven keys equal `error` | 0 errors, 21 warnings (the same 21 as before this track); script printed `true` |
| No admin module, layout or import reaches the public header | `grep -c "admin" src/components/Header.tsx src/components/layout/MobileNav.tsx` | `0` and `0` |
| No new runtime dependency | `git diff --name-only 7513780..HEAD -- package.json pnpm-lock.yaml` | empty — neither file changed in this phase or in the track |
| Tailwind first, CSS only where a utility cannot express the rule | The single co-located rule is the keyframe, proven necessary in Phase 3 by the absent `animate-fade-in` declaration | recorded as a Phase 3 deviation |

## Acceptance criteria

| ID | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| AC-10 | Every added interactive element declares a ≥44×44 px target and a focus-visible style in both themes. | `mobile-nav.a11y.test.tsx` → "declares a 44x44 target and the shared token focus ring on every control it adds" passes: `h-11 w-11` on the trigger, `min-h-11` on all seven links, and the `--focus-ring-color` / `--focus-ring-offset` token utilities on both. Theme resolution is the tokens' job, and the utilities are confirmed present in the built stylesheet | satisfied, with the stated jsdom limitation |
| AC-11 | `pnpm type-check`, `pnpm lint`, `pnpm format:check` and `pnpm test` exit 0 with no new diagnostics, and the final-phase `pnpm build` succeeds. | All five commands (with `test:coverage` in place of `test`) exited 0 at this phase; the diagnostic count is unchanged from the pre-track baseline | satisfied |

Accessibility contract additionally asserted in the new file: the trigger's accessible
name changes with its state, the panel is discoverable as a named `navigation` landmark
that is the element the trigger controls, and the toggle icon is `aria-hidden`.

## Evidence paths

- `conductor/tracks/20261027-public-mobile-navigation/verification/phase-4.md` (this report)
- `.conductor/evidence/20261027-public-mobile-navigation/phase-4-coverage.log`
- `.conductor/evidence/20261027-public-mobile-navigation/phase-4-build.log`

## Deviations

None. Both changed files, `vite.config.ts` and
`src/components/layout/__tests__/mobile-nav.a11y.test.tsx`, are inside `Touches`.

## Notes

- **Two test-authoring mistakes were fixed in the assertions, not worked around.** The
  first draft asserted the landmark with `within(panel).getByRole("navigation", …)`;
  Testing Library's `within` excludes the container element itself, so that query can
  never match its own subject — it now asserts against the document and compares the
  result to the element the trigger controls, which is the stronger check. The second
  draft read `className` off the panel links through the shared setup's `Link` mock, which
  discards every prop but `children` and `to`; this file now owns a forwarding mock, the
  same pattern as `blog-index-prefetch.test.tsx`. No assertion was weakened, and no shared
  test infrastructure changed.
- **What jsdom still cannot prove, and where it is proved instead.** Target size and
  focus-ring appearance need a layout engine and a stylesheet. The tests assert the
  component's declared contract; the emitted CSS and the SSR markup are the real proof,
  and both were checked in this phase.
- **The desktop row is still untouched**, including its active styling and its lack of
  `aria-current`. That stays a follow-up, as the spec's out-of-scope section requires.
- **Execution mode**, unchanged: the primary agent implemented and then re-ran the
  verification commands against the checkpoint, because this host exposes no phase
  subagent.

## Primary verification

Re-ran the full phase verification command on the accepted checkpoint `a84b34f`:

| Command | Exit | Result |
| --- | --- | --- |
| `pnpm type-check` | 0 | Clean |
| `pnpm lint` | 0 | 0 errors, 21 warnings (baseline) |
| `pnpm format:check` | 0 | Clean |
| `pnpm test:coverage` | 0 | 53 files, 193 tests passed; coverage above the new floor |
| `pnpm build` | 0 | Compiles; the built server serves `/` with the trigger and a closed panel in its HTML |
