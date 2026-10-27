# Public Mobile Navigation — Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

The public header renders a desktop navigation row that is hidden below 768 px and, in
its place, a mobile area containing only the theme toggle. This track implements the
missing mobile navigation as an accessible disclosure menu, so that every visitor below
768 px can reach all seven public destinations — Home, About, Skills, Projects, Blog,
Uses, Contact — in one tap from any page.

## Problem / Motivation

`src/components/Header.tsx` hides its `<nav>` behind `hidden md:flex` and leaves a
literal `{/* Mobile Nav Placeholder - for now just ThemeToggle */}` comment in the
mobile branch. A visitor on a phone therefore gets the logo, the theme toggle, and no
navigation at all: About, Skills, Projects, Blog, Uses and Contact are unreachable
except by scrolling a page they already reached.

Product guidelines name this as principle 2 — "Recruiter path is the critical path",
where Home → about → resume → projects must be one click each and must never be
interrupted. The primary audience (recruiters and prospective clients) arrives
disproportionately on mobile, so the defect sits directly on the site's conversion path.
It also violates the platform convention that the layout works mobile-first at 360 px,
and it has survived because a single maintainer works on a desktop browser where the
desktop row is always visible. This track is a bug fix, not a feature: the documented
behaviour of a site-wide navigation is broken at the widths most visitors use.

## Goals & Success Metrics

- **Goal:** every one of the seven public destinations is reachable in one tap from any
  public page at 360 px width.
- **Metric:** a test asserting the trigger exists with an accessible name and that
  activating it exposes exactly the seven destinations in PRD §5 order; a test asserting
  the current route is indicated; the standard phase gate exits 0 and the final
  `pnpm build` succeeds.
- **Metric:** desktop behaviour at ≥768 px is unchanged — existing header, a11y and
  route-surface tests still pass without modification.
- **Metric:** no new Biome diagnostics; the coverage floor in `vite.config.ts` is not
  lowered (and is raised if this track's tests lift the measured value).

## Scope

### In Scope

- A disclosure trigger and panel in the public header, active below 768 px.
- The seven destinations, in PRD §5 order, as in-app links sharing the desktop row's
  active-route rule.
- Accessibility contract: `aria-expanded` / `aria-controls`, Escape to close, close on
  outside pointer interaction, close on navigation, focus kept on the trigger, visible
  focus ring, ≥44×44 px targets, reduced-motion-aware transition.
- One navigation landmark exposed to assistive technology at any width, including the
  SSR-to-hydration transition.
- Automated tests (behaviour and a11y) covering the contract above, plus the final
  production build.

### Out of Scope

- Any change to the desktop/tablet row at ≥768 px, including link order, wording and the
  breakpoint itself.
- Relocating or duplicating the theme toggle, per-link icons, grouped submenus, search, a
  full-screen sheet, or body scroll locking.
- A no-JS fallback list; the menu is a hydration-enhanced control (decision recorded
  below).
- New dependencies, new icon libraries, or a component-primitive rewrite.
- The unrelated findings surfaced in the same review: the `/health` route rendering a
  nested document inside the root shell, the unreferenced `public/manifest.json` +
  `logo192/512` + `tanstack-*.svg` assets, and the empty `src/lib/r2/` directory. Each is
  a separate finding, not this track's blast radius.

## Bug Details

- **Reproduction steps:**
  1. Open any public page (for example `/`) in a browser.
  2. Set the viewport to 360 px — or open it on a phone.
  3. Inspect the header: logo, theme toggle, and nothing else.
  4. Try to reach `/projects` from there. There is no control that does it.
- **Expected behavior:** the header offers an operable control that reveals links to all
  seven public pages, for pointer, keyboard and screen-reader users alike.
- **Actual behavior:** the desktop row is `hidden md:flex`; the mobile branch renders the
  theme toggle and a placeholder comment. No control, no landmark content, and the same
  dead end for keyboard and assistive-technology users. The behaviour is present at every
  width below 768 px and on every public route.
- **Root-cause hypothesis:** the mobile branch of `src/components/Header.tsx` was never
  implemented — the responsive pair was written for the desktop row, and the placeholder
  comment records the intent without the work. Nothing else depends on it, so removing
  the gap is additive.
- **Regression test:** a new test that renders the header, asserts a control with the
  accessible name for opening navigation, activates it, and asserts the seven
  destinations are present and navigable — plus the Escape and outside-click closures. It
  must fail against the current `Header.tsx` (no trigger exists) and pass after the fix.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | Below 768 px the header exposes a visible, operable trigger in the mobile cluster, alongside the logo and theme toggle, without introducing horizontal overflow at 360 px. | must |
| FR-2 | The trigger reports its state through `aria-expanded` and identifies the panel through `aria-controls`; its accessible name states the action it performs in the current state. | must |
| FR-3 | Activating the trigger reveals a panel containing exactly the seven public destinations in PRD §5 order — Home, About, Skills, Projects, Blog, Uses, Contact — each as an in-app link that navigates without a full page reload. | must |
| FR-4 | Escape closes the panel and leaves keyboard focus on the trigger. | must |
| FR-5 | A pointer interaction outside the panel and its trigger closes the panel. | must |
| FR-6 | Navigating to a destination closes the panel. | must |
| FR-7 | The panel indicates the current destination using the desktop row's rule (exact match for `/`, prefix match otherwise), and the indication is not conveyed by colour alone. | must |
| FR-8 | At ≥768 px the desktop row is the navigation, the trigger is not exposed to the user or to assistive technology, and the panel is not in the accessibility tree. | must |
| FR-9 | Exactly one navigation landmark is exposed to assistive technology at any viewport width, including before hydration completes. | must |
| FR-10 | Opening and closing is animated, and the transition is suppressed under `prefers-reduced-motion: reduce`. | should |
| FR-11 | Every interactive element the track adds meets the 44×44 px target and shows a visible focus indicator in both themes. | must |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | WCAG 2.2 Level AA holds for the new control: keyboard operability, visible focus, correct role/name/state, and contrast. The seven a11y rules promoted to `error` in `biome.json` stay at error, and no new diagnostics are introduced. |
| NFR-2 | No new runtime dependency. Styling is Tailwind-first over the existing tokens; a co-located `.css` file is used only for what utilities cannot express. |
| NFR-3 | SSR-safe: the panel is closed in the server-rendered markup, the SSR and client markup match for the header, and opening the panel does not shift surrounding layout or change the header's height. |
| NFR-4 | No admin code, layout, or bundle reaches the public header; the public route bundle is not enlarged by admin imports. |
| NFR-5 | Tests are deterministic: no dependence on transition timing, real timers, or animation completion; keyboard and pointer assertions are event-driven. |
| NFR-6 | The coverage thresholds in `vite.config.ts` are never lowered; if this track's tests raise measured coverage, the floor is raised to match. |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | A rendered header at mobile width contains a trigger whose accessible name states the open action, and the desktop row links remain in the document. | FR-1 |
| AC-2 | Activating the trigger flips `aria-expanded` false → true → false, and `aria-controls` resolves to the panel element that becomes exposed. | FR-2 |
| AC-3 | The exposed panel lists all seven destinations in the documented order, each rendered as an in-app link. | FR-3 |
| AC-4 | Pressing Escape with the panel open closes it and leaves focus on the trigger. | FR-4 |
| AC-5 | A pointer interaction outside the panel closes it; an interaction inside it does not. | FR-5 |
| AC-6 | Navigating to a listed destination closes the panel. | FR-6 |
| AC-7 | The link for the current route carries a non-colour indicator, and no other link carries it. | FR-7 |
| AC-8 | At ≥768 px the trigger is absent from the accessibility tree and exactly one navigation landmark is exposed. | FR-8, FR-9 |
| AC-9 | The reduced-motion path renders the panel without a transition, and the default path declares one. | FR-10 |
| AC-10 | Every added interactive element declares a ≥44×44 px target and a focus-visible style in both themes. | FR-11 |
| AC-11 | `pnpm type-check`, `pnpm lint`, `pnpm format:check` and `pnpm test` exit 0 with no new diagnostics, and the final-phase `pnpm build` succeeds. | NFR-1, NFR-6 |

## Edge Cases

- **Width crossing 768 px while the panel is open** (rotate, resize, split-screen): the
  panel closes and the desktop row takes over, leaving no orphaned panel or stale
  `aria-expanded`.
- **Repeated activation** of the trigger in quick succession: open/close is idempotent and
  never leaves the state out of sync with the panel.
- **Navigating to the current route** from the panel: the panel closes and no duplicate
  history entry is created.
- **Short viewport** (landscape phone): the seven links fit or the panel scrolls
  internally; body scroll the page behind is never locked.
- **Zoom to 200 % and longest label** ("Projects" / "Contact" at large text): labels wrap
  without clipping and the panel stays within the viewport width.
- **SSR first paint with the panel closed:** no flash of an open panel and no hydration
  mismatch warning.
- **Keyboard-only traversal:** Tab reaches the trigger, Enter/Space operates it, Tab then
  enters the panel in DOM order, and Shift+Tab returns to the trigger.
- **Both themes:** the trigger and the active-destination indicator are legible and
  contrast-compliant in dark and light.
- **Assistive-technology landmark count:** exactly one `navigation` landmark is announced,
  before and after hydration.

## Dependencies

- **Tracks:** none. No other track is in flight and `conductor/tracks/` is empty.
- **External:** none. No credentials, services, or data are required; the header renders
  from static configuration.

## Open Questions & Assumptions

- **Question:** if the desktop row ever outgrows the 768 px breakpoint (a longer
  destination set), should the switch point move to `lg`? Deferred — this track
  deliberately leaves the breakpoint and desktop row untouched.
- **Assumption:** the trigger is JS-driven with explicit Escape, outside-click and
  close-on-navigate behaviour; a JS-blocked browser gets no menu, and the seven
  destinations remain reachable from page content (decision recorded in this interview).
- **Assumption:** the panel is a compact dropdown under the sticky header with no body
  scroll lock (decision recorded in this interview).
- **Assumption:** focus stays on the trigger when the panel opens; the disclosure is not a
  focus trap (decision recorded in this interview).
- **Assumption:** the trigger is an icon-only control named via `aria-label` for the
  current action, consistent with product-guidelines ("aria-label is a fallback for
  icon-only controls"); icons come from the already-installed `lucide-react`.
- **Assumption:** the seven destinations and their order come from PRD §5; no Resume entry
  is added, because no `/resume` route exists yet.
- **Assumption:** `jsdom` has no layout engine, so overflow at 360 px and real visual
  focus rendering are covered by markup-level assertions plus the PR's attached media;
  they are not asserted as pixel behaviour in unit tests.

## References

- `docs/PRD.md` §5 Information Architecture (site map and destination set)
- `conductor/product-guidelines.md` — UX principles 2, 6, 7; WCAG 2.2 AA section;
  interaction-pattern table
- `conductor/tech-stack.md` — Tailwind-first styling rule; test locations; coverage
  ratchet
- `conductor/workflow.md` — verification layers, pass criteria, commit format
- `src/components/Header.tsx` (defect), `src/routes/admin.tsx` (existing accessible mobile
  drawer pattern), `src/components/ui/theme-toggle.tsx`
- `conductor/tracks.md` (registry ledger)
