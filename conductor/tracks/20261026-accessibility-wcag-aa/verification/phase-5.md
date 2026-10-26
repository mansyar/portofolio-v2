# Phase 5 Verification — Contrast audit and token corrections

- **Track:** 20261026-accessibility-wcag-aa — Accessibility WCAG 2.2 AA Burn-Down
- **Phase:** 5 of 7
- **Date:** 2026-10-26
- **Branch:** `chore/20261026-accessibility-wcag-aa`
- **Phase base commit:** `29a773ed5510a8aa2e8d64989672ff709714dc78`
- **Result:** PASS — full token-pair inventory computed for both themes; the known failing pair
  (`--color-text-secondary` on light surfaces) fixed via a light-theme override with the shared
  value untouched; literal-hex census classified (4 converted to tokens, 17 documented
  exceptions); gate passes (22 warnings, unchanged).

## Methodological statement (required)

**jsdom cannot evaluate CSS.** The checks below are static source evidence plus **arithmetic
computation** of WCAG 2.x contrast ratios — not runtime proof of rendered pixels. Per the spec
constraints, no runtime CSS test is attempted.

**Computation note:** the brief permits a throwaway `node -e` script for the arithmetic; the
sandbox denied `node` execution, so every ratio below was computed by hand using the WCAG
relative-luminance formula, applied uniformly:

- channel linearisation: `c = s/255`; `c ≤ 0.03928 ? c/12.92 : ((c+0.055)/1.055)^2.4`
- luminance: `L = 0.2126·R + 0.7152·G + 0.0722·B`
- ratio: `(L_light + 0.05) / (L_dark + 0.05)`, larger over smaller
- alpha overlays are pre-composited onto their backing surface before the ratio is taken.

Worked example (`--color-text-secondary` `#aea79f` on light surface `#f5f5f5`):
`L(#aea79f) = 0.2126·0.4232 + 0.7152·0.3864 + 0.0722·0.3467 = 0.3913`;
`L(#f5f5f5) = 0.9131`; ratio `= 0.9631 / 0.4413 = 2.18:1` → FAIL (4.5 required).
The method reproduces the ratios recorded in `verification/phase-4.md` for the focus ring
(4.8 / 4.5 / 5.1 / 3.7 / 3.3), which is a cross-check of the arithmetic.

## Commands

| Command | Result |
|---|---|
| `pnpm type-check` | PASS (exit 0) |
| `pnpm lint` | PASS (exit 0, 22 warnings, 0 errors — baseline unchanged; accessibility rules 0) |
| `pnpm format:check` | PASS (exit 0, 22 warnings, no format findings) |
| `pnpm test` | PASS — 30 files, 78 tests (floor 46) |

## P5.T1 — Token-pair inventory (FR-9)

Token values (`src/styles/variables.css`): ubuntu-orange `#e95420`, ubuntu-purple `#772953`,
aubergine `#2c001e`, warm-grey `#aea79f`, terminal-bg-dark `#300a24`, terminal-bg-light
`#ffffff`, terminal-green `#4e9a06`, terminal-red `#cc0000`, terminal-yellow `#c4a000`,
terminal-cyan `#06989a`, text-primary-dark `#ffffff`, text-primary-light `#2c001e`,
text-secondary `#aea79f`, border `#5e2750`, surface-dark `#3d0a2e`, surface-light `#f5f5f5`.

Surfaces per theme: **dark** — bg `#300a24`, surface `#3d0a2e`, aubergine `#2c001e` (footer /
card titlebar, fixed in both themes); **light** — bg `#ffffff`, surface `#f5f5f5`. The
authenticated admin shell renders on fixed dark surfaces in both themes (see P5.T2 pin).

### Dark theme (all pairs as used)

| Foreground | Background (use) | Ratio | AA verdict |
|---|---|---|---|
| text-primary `#fff` | bg `#300a24` (body) | 17.58 | PASS |
| text-primary `#fff` | surface `#3d0a2e` | 16.39 | PASS |
| text-secondary `#aea79f` | bg `#300a24` (muted body) | 7.39 | PASS |
| text-secondary `#aea79f` | surface `#3d0a2e` (TOC, share, labels) | 6.89 | PASS |
| text-secondary `#aea79f` | aubergine `#2c001e` (footer, card titlebar) | 7.84 | PASS |
| text-secondary `#aea79f` | surface-dark `#3d0a2e` (bulk buttons) | 6.89 | PASS |
| text-secondary `#aea79f` | admin table-head blend `rgba(255,255,255,.05)` | 6.21 | PASS |
| text-secondary `#aea79f` | admin badge-neutral blend `rgba(255,255,255,.1)` | 5.42 | PASS |
| ubuntu-orange | bg `#300a24` (headings, accents) | 4.82 | PASS |
| ubuntu-orange | surface `#3d0a2e` | 4.49 | PASS large/UI; 4.49 marginal vs 4.5 normal |
| ubuntu-orange | aubergine (footer link hover) | 5.11 | PASS |
| terminal-cyan | bg (links, `em`, h3) | 4.99 | PASS |
| terminal-cyan | surface | 4.66 | PASS |
| terminal-green | bg (inline code, prompt, status) | 4.98 | PASS |
| terminal-green | surface | 4.64 | PASS |
| terminal-green | aubergine (footer status) | 5.28 | PASS |
| terminal-green | admin badge-success blend | 3.88 | FAIL 4.5 (residual R7) |
| terminal-yellow | bg | 7.01 | PASS |
| terminal-yellow | admin badge-warning blend | 4.86 | PASS |
| terminal-red | bg (toast/badge error accents) | 2.99 | FAIL (residual R5) |
| terminal-red | admin badge-error blend | 2.32 | FAIL (residual R5) |
| `white` on ubuntu-orange | `.btn-primary`, active toolbar btn | 3.65 | FAIL 4.5 normal (residual R4) |
| `white` on `#c03d10` (btn-primary hover) | 5.36 | PASS |
| `white` on terminal-red (bulk danger hover) | 5.89 | PASS |
| `black` on terminal-green (bulk success hover) | 5.95 | PASS |
| `white` on `#1a0614` (editor pre code) | 19.44 | PASS |
| text-secondary @ opacity .5 (placeholder) | input-wrapper blend | 2.79 | FAIL (residual R6) |

### Light theme — BEFORE the fix

| Foreground | Background (use) | Ratio | AA verdict |
|---|---|---|---|
| text-primary `#2c001e` | bg `#ffffff` | 18.66 | PASS |
| text-primary `#2c001e` | surface `#f5f5f5` | 17.11 | PASS |
| text-secondary `#aea79f` | bg `#ffffff` | 2.38 | **FAIL (the known pair)** |
| text-secondary `#aea79f` | surface `#f5f5f5` | 2.18 | **FAIL (the known pair)** |
| text-secondary `#aea79f` | aubergine (footer, card titlebar) | 7.84 | PASS |
| ubuntu-orange | bg (h1–h3 large text) | 3.65 | PASS large/UI; FAIL 4.5 small (residual R1) |
| ubuntu-orange | surface | 3.35 | PASS large/UI; FAIL 4.5 small (residual R1) |
| terminal-cyan | bg (body links) | 3.52 | FAIL 4.5 normal (residual R2) |
| terminal-cyan | surface | 3.23 | FAIL 4.5 normal (residual R2) |
| terminal-green | bg / surface (inline code, status) | 3.53 / 3.24 | FAIL 4.5 normal (residual R3) |
| terminal-red | bg / surface (error text) | 5.89 / 5.40 | PASS |
| `white` on ubuntu-orange (buttons) | 3.65 | FAIL 4.5 normal (residual R4) |
| text-secondary @ opacity .5 (placeholder) | input-wrapper blend | 1.00 | FAIL (residual R6) |

## P5.T2 — Fix of the failing pair (FR-9), before/after

**Fix (token level, shared value untouched):** `variables.css` defines a new
`--color-text-secondary-light: #6e675f` — a darker warm grey in the same hue/chroma family as
`#aea79f` (identical 15-unit R−B spread, scaled lightness) — and both light-theme blocks
(`@media (prefers-color-scheme: light) :root` and `:root.light`) now override
`--color-text-secondary` with it. The shared `--color-text-secondary: #aea79f` and the dark
theme are unchanged.

**Required consistency work so the override introduces no new failure** (muted text also sits
on *fixed-dark* surfaces that do not follow the theme):

| Change | File | Why |
|---|---|---|
| Admin dark pin: `.admin-layout { --color-bg-primary/-text-primary/-surface/-text-secondary → dark values }` | `globals.css` | `.admin-content` is always `--color-terminal-bg-dark`; without the pin the override would put dark grey on dark surfaces inside admin (labels, editor, badges), and `--color-text-primary` already flips to near-black on the admin's dark shell in light mode (1.06:1 pre-existing). Dark rendering identical (these are the dark values). |
| Footer copyright/link → `var(--color-warm-grey)` | `Footer.css` | Footer keeps aubergine in both themes; value identical to the dark secondary, so rendering unchanged in both themes. |
| Card titlebar title → `var(--color-warm-grey)` | `card.css` | Titlebar keeps aubergine in both themes; rendering unchanged. |
| Admin splash + TerminalWindow titlebar → `text-(--color-warm-grey)` | `admin.tsx`, `terminal-window.tsx` | Both sit on fixed-dark backgrounds outside the pinned subtree; without the re-point the override would regress them (3.15:1 / 2.94:1). |

**Re-measurement (before → after):**

| Pair | Before | After |
|---|---|---|
| text-secondary on `#f5f5f5` (surface) | 2.18 FAIL | **5.11 PASS** |
| text-secondary on `#ffffff` (bg) | 2.38 FAIL | **5.58 PASS** |
| text-secondary on admin table-head blend (light) | 2.20 FAIL | **5.16 PASS** |
| text-secondary on aubergine (footer/card) | 7.84 PASS | 7.84 PASS (pinned to warm-grey, unchanged) |
| text-secondary on any dark surface | 6.89–7.84 PASS | unchanged (shared value untouched) |
| text-primary on admin shell (light mode) | 1.06 FAIL (pre-existing) | 17.58 PASS (via pin) |

Dark-theme rendering is untouched: the shared token value is byte-identical and the pin value
equals the dark value.

### Third theme state — manual dark under an OS light preference (added by Phase R1, F1)

Phase 5's audit covered the two states reachable from OS preference alone. The round-1 review
found a third state the fix above misses: when the OS prefers light but the user manually
selects dark (`:root.dark`), the `@media (prefers-color-scheme: light)` block — equal
specificity, and the only rule that re-declared `--color-text-secondary` — still supplied the
light value `#6e675f`, because `:root.dark` re-declared bg/text/surface but not the secondary.
Measured (same method): `#6e675f` on `#300a24` ≈ 3.15:1 and on `#3d0a2e` ≈ 2.94:1 — both FAIL.

**Fix:** `variables.css` defines `--color-text-secondary-dark: #aea79f` beside the light
variant, and `:root.dark` now re-declares `--color-text-secondary: var(--color-text-secondary-dark)`,
mirroring its three existing re-declarations (source order then defeats the media rule).

| Pair | Before | After |
|---|---|---|
| text-secondary on `#300a24` (bg) | ≈3.15 FAIL | **7.39 PASS** |
| text-secondary on `#3d0a2e` (surface) | ≈2.94 FAIL | **6.89 PASS** |

The other three states are unaffected: OS-dark default and `:root.dark` under OS dark resolve
to the same declarations they already had (`#aea79f`), `:root.light` re-declares the light
value on top of the media rule regardless, and OS-light default is unchanged — only the
OS-light + manual-dark state changes (back to the pre-track dark values).

## P5.T3 — Classification of the 21 literal hex values (FR-9)

Baseline census (component CSS, excluding the token definitions in `variables.css`):
`globals.css` 3 · `button.css` 1 · `RichTextEditor.css` 10 (incl. 8 hljs) · `ShareButtons.css` 4
· `GiscusComments.css` 3 = **21 occurrences**.

**Converted to tokens (4):**

| Literal | File | Token | Note |
|---|---|---|---|
| `#300a24` (html bg) | `globals.css:32` | `var(--color-terminal-bg-dark)` | identical value |
| `#300a24` (body bg fallback) | `globals.css:37` | fallback → `var(--color-terminal-bg-dark)` | identical value |
| `#ffffff` (body colour fallback) | `globals.css:38` | fallback → `var(--color-text-primary-dark)` | identical value |
| `#fff` (editor pre code) | `RichTextEditor.css:127` | `var(--color-text-primary-dark)` | pre bg is fixed dark in both themes |

**Documented exceptions (17 occurrences / 14 unique values):**

| Literal(s) | File | Justification |
|---|---|---|
| hljs palette: `#5c6370` `#c678dd` `#e06c75` `#56b6c2` `#98c379` `#e6c07b` `#d19a66` `#61afef` | `RichTextEditor.css` | Third-party One-Dark-style syntax-highlighting palette (spec edge case names it a legitimate exception). Fixed dark code backgrounds in both themes (`#1a0614` editor, `--color-surface-dark` markdown pre). Measured vs `#3d0a2e` / `#1a0614`: keyword 5.57/6.60, string 8.13/9.64, number 6.65/7.89, title 6.93/8.23, literal 6.92/8.21, type 5.13/6.08, built_in 9.51/11.29 — all ≥4.5 except comments `#5c6370` 2.71/3.21 (italic low-priority annotations; recorded, not altered — palette is third-party). |
| `#1da1f2` ×2, `#0a66c2` ×2 | `ShareButtons.css` | Brand colours (Twitter/X, LinkedIn) — spec edge case names them legitimate exceptions; hover-only icon/border tint, no body text. |
| `#ff5f56` `#ffbd2e` `#27c93f` | `GiscusComments.css` | Decorative macOS traffic-light dots (no text; mimic window chrome). Non-text ratios vs surface 2.74/1.53/2.02 — decorative, no information conveyed. |
| `#c03d10` | `button.css:25` | "Darker orange" hover state; **no token equivalent exists and it has a single consumer**, so per the brief no token was invented. Pair `white`/`#c03d10` measures 5.36 PASS. |
| `#1a0614` | `RichTextEditor.css:114` | Editor pre background; no token equivalent, single consumer — kept as literal per the same rule. Pair `white`/`#1a0614` measures 19.44 PASS. |

No token was invented with fewer than two consumers. Post-conversion literal census: 17
occurrences, all in the exception table above.

## P5.T4 — Residual sub-AA pairs (flagged for the primary — NOT corrected in this phase)

The audit found additional pairs below AA that were **not** altered: correcting them means
redefining brand-accent token values (a design decision beyond this phase's prescribed
correction) or changing text colours on brand surfaces. They are recorded here so the debt is
explicit:

- **R1 — ubuntu-orange small text on light surfaces** (3.65/3.35): passes 3:1 large-text/UI;
  h4–h6 headings and small orange labels (newsletter prompt, TOC active link) fall short of
  4.5. A light-theme orange override (cf. the existing `#c03d10` hover precedent) would fix it
  and simultaneously lift white-on-orange buttons in light mode.
- **R2 — terminal-cyan links on light surfaces** (3.52/3.23): body links miss 4.5; passes 3:1.
  A darker teal light override (e.g. ≈`#05767a` at ≈5.4/5.0) is the token-level fix.
- **R3 — terminal-green on light surfaces** (3.53/3.24): inline code and the home status badge
  miss 4.5. Same override pattern; note the footer status (aubergine) would need the same
  fixed-value pin treatment as the warm grey.
- **R4 — `white` on ubuntu-orange button labels, BOTH themes** (3.65): needs a darker orange
  brand-wide or a different button text colour — a brand decision.
- **R5 — terminal-red on dark surfaces** (2.99 bg / 2.78 surface / 2.32 badge blend): toast
  error titles and admin error badges miss even 3:1 in dark mode.
- **R6 — placeholders at `opacity: 0.5`** (`input.css`, contact textarea `placeholder:text-gray-500`):
  opacity, not the token, binds the ratio (blended 2.79 dark / 1.00 light-before / 1.69
  light-after). Any fix changes placeholder visual weight.
- **R7 — admin badge-success green 3.88** on its blended background (12px text).

**Pre-existing latent issues observed, deliberately untouched** (defining the missing tokens
would change rendering, violating the no-visual-change constraint): `--color-surface-brighter`
and `--color-surface-darker` and `--color-terminal-bg` and `--color-text-muted` are referenced
(CSS + Tailwind arbitrary utilities) but never defined; `--color-terminal-green-opacity` has an
inline fallback.

## Constraints check

| Constraint | Status |
|---|---|
| No edits to `plan.md`, `spec.md`, `metadata.json` | ✅ |
| Stayed inside Touches | ✅ with recorded deviations (Footer.css, card.css, admin.tsx, terminal-window.tsx — required so the prescribed override introduces no new failure on fixed-dark surfaces) |
| No new dependencies | ✅ |
| Gate as four separate commands | ✅ |
| No-new-warnings (≤ 22, a11y = 0) | ✅ exactly 22, all out-of-scope rules (`noArrayIndexKey` 16, `useOptionalChain` 3, `noNonNullAssertion` 3) |
| Dark-first theme parity (NFR-3) | ✅ shared token value unchanged; dark ratios identical before/after |
| No behaviour regression (NFR-1) | ✅ CSS/class-only; every re-point preserves the exact rendered value in dark and restores intended values in light |
| Max 2 retries per command | ✅ all commands passed first run |

## Tasks

| Task | Status |
|---|---|
| P5.T1 — pair inventory with computed ratios (dark + light) | Done |
| P5.T2 — light-theme override + re-measurement | Done |
| P5.T3 — 21-literal classification (4 converted, 17 exceptions) | Done |
| P5.T4 — verification + this file | Done |

## Primary verification

- **Date:** 2026-10-26 — run independently by the Conductor orchestrator (not the implementing agent).
- Worktree clean before verification; `git log 29a773e..HEAD` shows exactly the two reported commits (`ae853b3`, `216528a`); changed-file list matches the report.
- Gate re-run as four separate commands on the final code state: `pnpm type-check` exit 0 · `pnpm lint` exit 0 (22 warnings, 0 errors) · `pnpm format:check` exit 0 · `pnpm test` exit 0 (30 files, 78 tests). Baseline unchanged; accessibility rules still 0.
- Diff spot-checks: `variables.css` — shared `--color-text-secondary: #aea79f` byte-untouched, new `--color-text-secondary-light: #6e675f` defined once and overridden in **both** light-theme blocks; `globals.css` — admin dark pin sets the four theme tokens to their dark values (dark rendering identical by construction) and the three html/body literal fallbacks converted to tokens at identical values; `Footer.css`/`card.css`/`terminal-window.tsx`/`admin.tsx` — re-points to `var(--color-warm-grey)`/`text-(--color-warm-grey)`, whose value (`#aea79f`) equals the dark-theme secondary, so dark rendering is unchanged; `RichTextEditor.css` — `#fff` → `var(--color-text-primary-dark)` at identical value on a fixed-dark pre background.
- Arithmetic cross-check: the reported before/after ratios (2.18/2.38 → 5.11/5.58) are consistent with the WCAG relative-luminance formula shown in the evidence and reproduce phase-4's focus-ring ratios.
- **Primary verdict: PASS.** The phase's prescribed scope (the known failing pair + literal classification) is complete; the R1–R7 residual pairs flagged in this file are recorded above as an explicit decision item for the track owner.

## Notes for the primary

- The 22-warning baseline is unchanged; no tests modified (78 passing).
- The known failing pair is fixed with the prescribed strategy (light override, shared value
  untouched) and re-measured: 2.18/2.38 → 5.11/5.58.
- **Decision needed (not blocking Phase 6 mechanically):** residuals R1–R7 above. R2/R3 have
  mechanical token-level fixes (light-theme accent overrides + one footer pin); R1/R4/R5 need a
  brand-colour decision. Recommend deciding whether to fold them into this track or record as
  follow-up debt before Phase 7 closes the known-gaps table.
- The admin dark pin also fixes a pre-existing light-mode admin failure (text-primary 1.06:1 on
  the admin shell); the admin is now a coherent dark terminal in both themes.
- The `node -e` allowance was denied by the sandbox; all ratios were computed by hand with the
  documented formula and cross-checked against phase-4's recorded ring ratios.
