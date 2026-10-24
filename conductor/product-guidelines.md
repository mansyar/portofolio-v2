# Product Guidelines — Ansyar's Portfolio

Brand, voice, interaction, and accessibility standards for the portfolio website and
admin CMS. These guidelines govern how the product *feels*; `tech-stack.md` governs how
it is built.

## Voice and Tone

**Precise engineer with dry wit.** The site reads as if written by a competent engineer
who does not need to impress anyone: confident, technically accurate, understated, and
occasionally wry. Never breathless, never salesy.

The terminal aesthetic is **structural, not decorative**. Prompts (`>`, `$`), window
chrome, and monospace type are part of the interface's grammar — they organize
information. They are not jokes pasted onto a normal website.

### Rules

- **First person, singular.** "I build", "I write", not "we" or "the author".
- **No superlatives about yourself.** No "passionate", "rockstar", "10x", "cutting-edge",
  "world-class". Let the work and the specificity carry the claim.
- **Prefer specifics over adjectives.** "Cut deploy time from 12 minutes to 90 seconds"
  beats "significantly improved deployment".
- **Dry humor is seasoning, not the meal.** An occasional aside is good. A page of
  terminal jokes reads as a costume.
- **Never apologize or hedge in UI copy.** No "Sorry, something went wrong!" — say what
  failed.
- **Address the reader as "you"** when instructing or inviting action.

### Terminal-language conventions

| Context | Form | Avoid |
| --- | --- | --- |
| Buttons | `$ action` or `> action` prefix, imperative verb | `Click here`, `Submit` |
| Inputs | `> ` prompt prefix, placeholder as a value hint | Placeholder used as a label |
| Success messages | lowercase, terse: `saved`, `published` | `Success! Your changes have been saved.` |
| Errors | what failed + what to do, lowercase start | Blaming the user, raw stack traces |
| Empty states | state the fact, then the next action | Cute illustrations with no direction |

## Registers

Two registers, deliberately different. Do not blend them.

### 1. Interface copy — terminal register

Applies to navigation, buttons, forms, admin, status messages, empty states, and
metadata.

- **Terse and imperative.** Lowercase for system-voice messages; sentence case for
  labels and headings.
- **Commands are verbs.** `publish`, `delete`, `reorder` — not `do publishing`.
- **State is a fact, not a feeling.** `3 drafts`, `no messages yet`.
- **Labels must be correct alone.** An input's label is visible and real; a placeholder
  is never the only label.
- **Errors say what happened and what to do next**, in that order.

### 2. Editorial prose — long-form register

Applies to blog posts, the about page, and project descriptions.

- **Personal and considered.** First person, full sentences, allowed to be reflective.
- **Structure serves reading:** short paragraphs, descriptive headings, real code blocks
  with language tags.
- **No terminal affectation in prose.** A blog post is an essay, not a transcript.
- **Explain the reasoning, not just the result.** The value of the writing is the "why".

## UX Principles

1. **The content is the interface.** Navigation and chrome must never compete with a
   project, a post, or a resume. When in doubt, reduce the interface.
2. **Recruiter path is the critical path.** Home → about → resume → projects must be
   reachable in one click each and must never be interrupted by a modal, a cookie
   prompt, or an animation.
3. **Real-time by default.** Convex reactivity means content is current. Never show a
   stale value that a manual refresh would fix, and never require a manual refresh.
4. **The CMS never blocks the reader.** Admin code and bundles must not reach public
   routes.
5. **Destructive actions confirm; everything else is fast.** Delete confirms. Publish,
   reorder, and toggle act immediately with an undo or a toast.
6. **Motion is feedback, not decoration.** Animation communicates typing, loading, or
   transition. If it communicates nothing, remove it.
7. **Every interactive element is reachable and operable by keyboard**, and visibly
   focused when it is.
8. **Drafts stay drafts.** Never let unpublished content leak into the public site,
   sitemap, RSS, or OG metadata.
9. **Fail loudly in the CMS, gracefully in public.** Admins get the real error and a
   retry; visitors get a usable page.

### Interaction patterns to reuse

| Pattern | Where it comes from | Rule |
| --- | --- | --- |
| Terminal window card | `terminal-window.tsx` | Title bar + traffic-light dots for grouped content |
| Prompt input | `input.tsx` | `>` prefix inside the wrapper; label always present |
| Command button | `button.tsx` | `$` prefix on primary actions only, not on every button |
| Typing effect | `typing-effect.tsx` | Hero and terminal output only; must honor reduced motion |
| Toast | `sonner` + `toast-provider.tsx` | One toast per completed mutation; never a modal |
| Skeleton | `section-skeleton.tsx` | Public data loading; no spinners on public pages |
| Bulk action bar | `bulk-action-bar.tsx` | Admin lists with selection |

## Accessibility Requirements

**Target: WCAG 2.2 Level AA.** This is a commitment, not an aspiration. Because the
primary goal is credibility with recruiters — including accessibility-aware ones — an
inaccessible portfolio actively harms the product.

### Non-negotiable

- **Semantic HTML first.** `<nav>`, `<main>`, `<article>`, `<button>`, one `<h1>` per
  page, headings in order. A `<div>` is never a button.
- **Every form control has a visible, associated label.** `aria-label` is a fallback for
  icon-only controls, not a substitute for a label.
- **Keyboard operability.** Everything reachable by mouse is reachable by Tab, and
  operable with Enter/Space. Admin modals trap focus and restore it on close.
- **Focus is visible.** Never remove a focus indicator without replacing it.
- **Contrast ratios hold.** 4.5:1 for body text, 3:1 for large text and UI borders. This
  constrains the palette: terminal green `#4E9A06` on aubergine `#2C001E` clears AA, but
  warm grey `#AEA79F` on the light surface does not — verify before use.
- **Reduced motion is respected.** Every animation, including the typing effect and
  cursor blink, must be disabled or reduced under `prefers-reduced-motion: reduce`.
- **Images carry meaningful `alt`.** Decorative images use `alt=""`. CMS uploads prompt
  for alt text.
- **No information conveyed by color alone.** Status is not only green/red — it also has
  a word or an icon.

### Known gaps (tracked debt, not silently accepted)

| Gap | Evidence | Impact |
| --- | --- | --- |
| No `:focus-visible` rules | Zero matches across `src/**/*.css`; focus is shown only via `:focus-within` on wrappers | Buttons and links have no explicit visible focus state |
| Reduced motion respected in one file only | `prefers-reduced-motion` appears only in `typing-effect.css` | Cursor blink and other animations run regardless of user preference |
| Minimal ARIA labelling | One `aria-label` across all TSX files | Icon-only controls and dynamic regions may be unnamed |

These are recorded as real work to schedule, not as acceptable state.

## Design System and Component Conventions

- **Tokens live in `src/styles/variables.css`** — colors, font stack, sizes, weights,
  spacing. New values must be tokens before they are literals.
- **Tailwind is the styling tool**; tokens feed it. Co-located `.css` files are for
  keyframes, terminal chrome, and complex selectors only.
- **Component directories by responsibility:**
  `ui/` primitives · `features/` domain components · `layout/` structural.
  Do not add a fourth.
- **Component files stay under ~200 lines.** Extract past that.
- **Named exports only.** No default exports for components.
- **Co-locate CSS** with its component: `button.tsx` + `button.css`.
- **Props are explicit interfaces**, never inline shapes duplicated across files.
- **Reuse before creating.** Check `ui/` first. A second card variant should extend the
  existing card, not fork it.
- **Admin and public UI may share primitives but not layouts.** Admin density differs
  deliberately.

### Color semantics

| Token | Meaning | Never used for |
| --- | --- | --- |
| `--color-ubuntu-orange` | Primary accent, primary CTA, active nav | Body text, large fills |
| `--color-terminal-green` | Success, published/active state | Errors, decorative accents |
| `--color-terminal-red` | Error, destructive action, failed state | Emphasis, warnings |
| `--color-terminal-yellow` | Warning, draft/pending state | Success |
| `--color-terminal-cyan` | Links, informational | Buttons |
| `--color-warm-grey` | Secondary text, metadata | Primary body text |

## Content Style and Terminology

### Mechanics

- **Sentence case** for headings, labels, and buttons. No Title Case, no ALL CAPS except
  literal terminal strings.
- **No exclamation marks.** Ever, in UI copy.
- **Numbers:** numerals, not words, for counts and metrics (`3 projects`, not
  `three projects`).
- **Dates:** human-readable and unambiguous — `12 Jan 2026`. Never `01/12/2026`.
- **Times:** 24-hour with timezone where it matters.
- **Code and identifiers** always in monospace, with the correct language tag in code
  blocks.
- **Ellipsis** is a single character (`…`), used for progress ("saving…"), not for
  trailing off.

### Canonical terms

| Use | Not |
| --- | --- |
| blog post | article, entry, post |
| project | portfolio piece, work |
| skills | tech stack (as a page name) |
| uses | gear, setup, equipment |
| messages (contact inbox) | inquiries, submissions |
| draft / published | unpublished / live |
| sign in | log in, login |
| sign out | log out, logout |

### Microcopy rules

- **Empty state = fact + next action.** `no projects yet` → `> create the first project`.
- **Confirmation of destructive action** names the object: `delete "Homelab 2025"?` —
  not `Are you sure?`.
- **Success is quiet.** A toast, not a modal.
- **Loading is honest.** `loading…`, then the content. Never a fake progress bar.
- **Errors state the cause when known**: `slug already in use`, not `invalid input`.

## Platform Conventions

**Web only.** Responsive, mobile-first, SSR-rendered.

- **Breakpoints are mobile-up.** Verify every change at 360px, 768px, 1280px.
- **Touch targets are at least 44×44px** on interactive elements.
- **The layout must not depend on JS to be readable.** Core content renders under SSR;
  hydration enhances.
- **URLs are the navigation model.** Every meaningful view has a real, shareable URL.
  Admin modals that could be routes should be routes.
- **Dark mode is the default**, with light mode supported via the theme toggle and
  `prefers-color-scheme`. Both themes must pass contrast checks independently.
- **No native app, no PWA install prompt.** Responsive web is the delivery surface.

## Internationalization and Localization

**Out of scope for now, and deliberately not a non-goal.** The site is English-only and
has no i18n infrastructure. This dimension is skipped for that reason rather than
declared unnecessary.

If localization is ever pursued, it is not a translation task — the CMS schema, rich-text
content, and resume data model would all need to carry per-locale variants. That is a
product decision, not a UI change.

## Legal, Privacy, and Compliance

- **Umami analytics is cookieless and stores no personal identifiers.** No cookie
  banner, no consent gate, and no third-party tracking scripts are required. Do not add
  one that would create the obligation.
- **Contact and newsletter data is personal data.** Collect only the email/name/message
  that is needed, store it only in Convex, and never sell, share, or export it to a third
  party beyond the delivery services already in use (Resend, Slack).
- **Newsletter subscriptions require an unsubscribe path.** Any bulk email must include
  one, and unsubscribing must update `newsletterSubscribers.status`.
- **Secrets never reach the client.** Only `VITE_`-prefixed values are inlined at build
  time; anything else is server-only.
- **Uploads are sanitized.** Rich-text HTML passes through `isomorphic-dompurify` before
  render; never introduce a raw-HTML path.
- **No license or regulatory constraint applies** beyond the project's own MIT license.

## Open Questions

1. **Formal privacy notice.** With cookieless analytics, is a short privacy note still
   wanted for contact and newsletter data, or is the current setup acceptable?
2. **Alt-text enforcement.** Should the CMS *require* alt text on image upload, or only
   prompt for it?
3. **Light-mode contrast budget.** Warm grey on the light surface fails AA for body
   text. Light mode may need a token change — is light mode worth the extra design
   constraint?
4. **Motion defaults.** Should the typing effect be reduced for everyone after first
   visit, or always animate (subject to user preference)?
5. **Admin accessibility scope.** Does the AA commitment extend to the admin CMS, or only
   public pages? Currently assumed to cover both.
