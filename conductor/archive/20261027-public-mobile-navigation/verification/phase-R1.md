# Phase R1 — Review Fixes

| Field | Value |
| --- | --- |
| Track | `20261027-public-mobile-navigation` — Public Mobile Navigation |
| Phase | R1 — Review Fixes |
| Date | 2026-10-27 |
| Branch | `fix/20261027-public-mobile-navigation` |
| Base commit | `5e2f9ab` |
| Head commit | `b65e346` |
| Findings | F1 (Medium), F2 (Medium) |
| Result | **verified** |

Both findings were real and are fixed in the code, not waived.

## Commands

| Layer | Command | Exit | Summary |
| --- | --- | --- | --- |
| static | `pnpm type-check` | 0 | Clean |
| static | `pnpm lint` | 0 | 0 errors, 21 warnings — the pre-track baseline, unchanged |
| static | `pnpm format:check` | 0 | Clean |
| unit | `pnpm test` | 0 | `Test Files 53 passed (53)`, `Tests 195 passed (195)` (was 193) |
| unit + coverage | `pnpm test:coverage` | 0 | `All files 32.84% stmts / 37.21% branch / 24.67% funcs / 32.9% lines` — above the 32 / 24 floor |
| build | `pnpm build` | 0 | Compiles |

## F1 — The panel stayed open across the breakpoint

**Fix.** `MobileNav` now subscribes to `(min-width: 768px)` while mounted and closes the
panel when the query starts matching, removing the listener on unmount.

On the breakpoint's single source of truth, stated precisely: the exposure rule is the
`md:hidden` class, so the JS constant cannot read it. The constant mirrors the `md`
breakpoint, and `src/styles/globals.css` declares no `@theme` override for it — Tailwind's
default 768 px is what both the class and the constant resolve to, and the constant's
doc comment names that relationship. A future customised `--breakpoint-md` would have to
update the constant too; recording it is the right treatment for a maintainability note,
not a finding against this fix.

**Test.** The new case fires the registered change handler on the mocked media query and
asserts `aria-expanded` is back to `"false"` and the panel is `hidden`. The setup's
`matchMedia` mock records `addEventListener`/`removeEventListener`, so the test exercises
the subscription the component actually creates rather than a stub of its own.

## F2 — No internal scroll on a short viewport

**Fix.** The panel's height is capped at the space below the header
(`max-height: calc(100vh - 4rem)`) with `overflow-y: auto`.

**Test + emitted CSS.** The test asserts the declared contract on the panel element. That
alone is not proof of layout, so the rule was confirmed in the built stylesheet:
`.mobile-nav-panel` carries `max-height:calc(100vh - 4rem)` and the element's
`.overflow-y-auto` utility resolves to `overflow-y:auto`. The panel's `mobile-nav-open`
animation and its `prefers-reduced-motion` override are both still present, so the fix did
not disturb AC-9.

## Findings closed

| ID | Severity | Status | Closed by |
| --- | --- | --- | --- |
| F1 | Medium | fixed | `b65e346` — media-query subscription, plus the close-across-breakpoint test |
| F2 | Medium | fixed | `b65e346` — capped height and internal scroll, confirmed in the emitted CSS |

## Deviations

None. Both files changed are inside this phase's `Touches`.

## Notes

- **No shared test infrastructure was altered.** The `matchMedia` mock in
  `vitest.setup.tsx` already exposed `addEventListener`; the new assertions target the
  handler the component registers, and no assertion in the existing cases was relaxed.
- **`pnpm format:check` is configured as the same `biome check .` invocation as
  `pnpm lint`** in `package.json`, so the two layers report identical output; both exit 0
  with the 21 pre-existing warnings. Pre-existing configuration, untouched here.
- **`MobileNav.css` did not need to change** for F2 even though the plan listed it: the
  height cap and scroll are plain single-declaration rules Tailwind already expresses, so
  the co-located sheet still holds only the keyframe that forced its existence.
- **Execution mode**, unchanged: this host exposes no phase subagent, so the primary agent
  implemented the fixes and then re-ran every configured check against the checkpoint.
