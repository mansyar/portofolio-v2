# Progress Tracking

> **Project:** Ansyar's Portfolio + Custom CMS  
> **Last Updated:** January 8, 2026  
> **Current Phase:** Phase 2 - Public Pages Complete

---

## Overview

| Metric            | Value                 |
| ----------------- | --------------------- |
| **Overall**       | █████░░░░░ 50%        |
| **Phase 0**       | ██████████ 100%       |
| **Phase 1**       | ██████████ 100%       |
| **Phase 2**       | ██████████ 100%       |
| **Target Launch** | ~10 weeks (estimated) |

---

## Phase 0: Tech Stack Migration (Week 0)

**Status:** ✅ Complete  
**Progress:** 5/5 tasks

> Migrated from Supabase to self-hosted Convex. See [MIGRATION_PLAN.md](./MIGRATION_PLAN.md) for details.

| Task                                  | Status | Notes                                    |
| ------------------------------------- | ------ | ---------------------------------------- |
| Self-hosted Convex on Coolify         | [x]    | Backend deployed on Coolify              |
| Install Convex dependencies           | [x]    | convex, @convex-dev/react-query, @convex-dev/auth |
| Create Convex schema                  | [x]    | 14 tables deployed to backend            |
| Set up TanStack Start + Convex client | [x]    | Router updated with providers            |
| Configure Convex Auth                 | [x]    | Password provider configured             |

<details>
<summary><strong>Acceptance Criteria</strong></summary>

- [x] `npx convex dev` connects to self-hosted backend
- [x] Schema deploys successfully
- [x] Basic query works with SSR (tested in Phase 2)
- [ ] Auth flow works (sign in, sign out) (to test in Phase 3)
- [x] Admin authorization checks defined

</details>

<details>
<summary><strong>Definition of Done</strong></summary>

- [x] `pnpm tsc --noEmit` passes with 0 errors
- [x] `pnpm lint` passes with 0 warnings
- [x] `pnpm build` succeeds
- [x] Convex schema deployed to self-hosted backend
- [x] Environment variables documented in `.env.example`

</details>

---

## Phase 1: Foundation (Week 1-2)

**Status:** ✅ Complete  
**Progress:** 6/6 tasks

| Task                              | Status | Notes                                      |
| --------------------------------- | ------ | ------------------------------------------ |
| Initialize TanStack Start project | [x]    | Done                                       |
| Set up Convex + schema            | [x]    | Schema deployed, Skills API created        |
| Configure R2 bucket               | [x]    | Credentials in .env, bucket ready          |
| Implement design system           | [x]    | Ubuntu Terminal theme, CSS variables       |
| Set up Docker configuration       | [x]    | Dockerfile & Compose created               |
| Basic routing structure           | [x]    | All 7 public routes + Header/Footer layout |

<details>
<summary><strong>Acceptance Criteria</strong></summary>

- [x] TanStack Start app runs locally with `pnpm dev`
- [x] Convex connected and schema deployed
- [x] R2 bucket created and accessible via API
- [x] CSS variables defined in `variables.css` matching Ubuntu theme
- [x] Base UI components: Button, Input, Card created
- [x] Docker container builds and runs successfully
- [x] All public routes render without errors: `/`, `/about`, `/skills`, `/projects`, `/blog`, `/uses`, `/contact`

</details>

<details>
<summary><strong>Definition of Done</strong></summary>

- [x] `pnpm tsc --noEmit` passes with 0 errors
- [x] `pnpm lint` passes with 0 warnings
- [x] `pnpm build` succeeds
- [x] Docker image builds successfully
- [x] Convex schema deployed
- [x] Environment variables documented in `.env.example`
- [x] README updated with setup instructions

</details>

---

## Phase 2: Public Pages (Week 3-4)

**Status:** ✅ Complete  
**Progress:** 7/7 tasks

| Task                        | Status | Notes                                           |
| --------------------------- | ------ | ----------------------------------------------- |
| Home page with all sections | [x]    | Hero, featured projects, skills preview, CTA    |
| About page                  | [x]    | Profile, work experience, education timelines   |
| Skills page with categories | [x]    | Grouped by category with proficiency bars       |
| Projects listing + detail   | [x]    | Grid layout, detail pages with tech stack       |
| Blog listing + detail       | [x]    | Paginated list, category sidebar, detail pages  |
| Uses page                   | [x]    | Items grouped by category                       |
| Contact page with form      | [x]    | Form with validation, Convex mutation           |

<details>
<summary><strong>Acceptance Criteria</strong></summary>

- [x] Home: Hero with typing animation, featured projects carousel, skills preview, CTA
- [x] About: Bio, journey timeline, services sections render correctly
- [x] Skills: Grouped by category, proficiency bars display correctly
- [x] Projects: Grid layout with filtering by tech stack, detail pages with gallery
- [x] Blog: Paginated list (10/page), category/tag sidebar, detail with TOC
- [x] Uses: Items grouped by category with images and links
- [x] Contact: Form validates input, submits to Convex, shows success message
- [x] All pages have proper meta tags (title, description, OG)
- [x] All pages responsive (mobile, tablet, desktop)
- [x] Dark/light theme toggle works across all pages

</details>

<details>
<summary><strong>Definition of Done</strong></summary>

- [x] `pnpm tsc --noEmit` passes with 0 errors
- [x] `pnpm lint` passes with 0 warnings
- [x] `pnpm build` succeeds
- [ ] Lighthouse Performance ≥ 90 on all pages (to verify)
- [ ] Lighthouse Accessibility ≥ 95 on all pages (to verify)
- [x] All images have alt text
- [x] Semantic HTML used (`<main>`, `<nav>`, `<article>`, single `<h1>`)
- [x] Keyboard navigation works on all interactive elements

</details>

### Technical Improvements Made

- **Router Context Type Safety:** Used `createRootRouteWithContext<RouterContext>()` for fully inferred types in route loaders (no `any` required)
- **Tailwind CSS v4 Syntax Update**: `[var(--variable)]` -> `(--variable)` (Completed)
- **Theme Toggle**: Refactored to lazy initialization (Fixed hydration mismatch)
- **SEO Component**: Created reusable `SEO` component with Open Graph and JSON-LD support
- **Router/SSR Fixes**:
  - Solved "Already Subscribed" error by scoping `ConvexQueryClient` to request/router instance.
  - Added `NotFound` component to handle 404s and silence warnings.
- **Backend Fixes**:
  - Debugged and fixed `convex/seed.ts` to populate clean, valid data.
  - Resolved "Server Error" in Project queries by ensuring schema compliance.
- **Reusable Components:** Created SkillBar, ProjectCard, BlogCard, Timeline, Pagination, UsesItem, TypingEffect, **TerminalWindow**
- **Global Layout Fix:** Centered `.container` class in `globals.css` to fix page alignment.



---

## Phase 3: CMS - Core (Week 5-6)

**Status:** ⚪ Pending  
**Progress:** 0/6 tasks

| Task                        | Status | Notes |
| --------------------------- | ------ | ----- |
| Authentication (Magic Link) | [ ]    |       |
| Admin layout and navigation | [ ]    |       |
| Dashboard                   | [ ]    |       |
| Projects CRUD               | [ ]    |       |
| Skills CRUD                 | [ ]    |       |
| Media manager (R2)          | [ ]    |       |

<details>
<summary><strong>Acceptance Criteria</strong></summary>

- [ ] Magic link login works for whitelisted admin email
- [ ] Unauthorized users redirected to login page
- [ ] Admin sidebar navigation renders all sections
- [ ] Dashboard shows quick stats (projects, posts, messages count)
- [ ] Projects: Create, read, update, delete, reorder, toggle visibility
- [ ] Skills: Create, read, update, delete, reorder by category
- [ ] Media: Upload images to R2, delete, copy URL, preview thumbnails
- [ ] All admin routes protected with `requireAdmin()` check

</details>

<details>
<summary><strong>Definition of Done</strong></summary>

- [ ] `pnpm tsc --noEmit` passes with 0 errors
- [ ] `pnpm lint` passes with 0 warnings
- [ ] `pnpm build` succeeds
- [ ] All CRUD operations tested manually
- [ ] RLS policies verified (admin can write, public cannot)
- [ ] Session persistence works across page refreshes
- [ ] Logout clears session correctly

</details>

---

## Phase 4: CMS - Blog & Resume (Week 7-8)

**Status:** ⚪ Pending  
**Progress:** 0/5 tasks

| Task                         | Status | Notes |
| ---------------------------- | ------ | ----- |
| Rich text editor integration | [ ]    |       |
| Blog posts CRUD              | [ ]    |       |
| Categories and tags          | [ ]    |       |
| Resume data management       | [ ]    |       |
| PDF generation               | [ ]    |       |

<details>
<summary><strong>Acceptance Criteria</strong></summary>

- [ ] Rich text editor supports: headings, bold, italic, lists, quotes, code blocks, links, images
- [ ] Blog posts: Create draft, edit, publish, unpublish, delete
- [ ] Reading time auto-calculated on save
- [ ] Categories: CRUD with order management
- [ ] Tags: CRUD, can be assigned to multiple posts
- [ ] Resume profile: Edit personal info, summary, social links
- [ ] Work experiences: CRUD with date ranges and descriptions
- [ ] Education & Certifications: CRUD with visibility toggle
- [ ] PDF generates with all resume sections, downloads correctly

</details>

<details>
<summary><strong>Definition of Done</strong></summary>

- [ ] `pnpm tsc --noEmit` passes with 0 errors
- [ ] `pnpm lint` passes with 0 warnings
- [ ] `pnpm build` succeeds
- [ ] Rich text content renders correctly on public blog pages
- [ ] Code blocks have syntax highlighting
- [ ] PDF is ATS-friendly (parseable text, proper structure)
- [ ] All resume changes reflected in generated PDF

</details>

---

## Phase 5: Polish & Deploy (Week 9-10)

**Status:** ⚪ Pending  
**Progress:** 0/6 tasks

| Task                     | Status | Notes |
| ------------------------ | ------ | ----- |
| SEO optimization         | [ ]    |       |
| Performance optimization | [ ]    |       |
| Responsive testing       | [ ]    |       |
| Coolify deployment       | [ ]    |       |
| Domain configuration     | [ ]    |       |
| Final testing            | [ ]    |       |

<details>
<summary><strong>Acceptance Criteria</strong></summary>

- [ ] XML sitemap generated and accessible at `/sitemap.xml`
- [ ] robots.txt configured correctly
- [ ] JSON-LD structured data on all pages (Person, Article, BreadcrumbList)
- [ ] All images optimized (WebP, lazy loading, responsive sizes)
- [ ] Font loading optimized with `font-display: swap`
- [ ] Responsive layout verified on: mobile (375px), tablet (768px), desktop (1280px+)
- [ ] Docker container deployed to Coolify successfully
- [ ] Domain `ansyar-world.top` points to deployment
- [ ] SSL certificate active (Let's Encrypt via Coolify)
- [ ] All public pages accessible and functional in production

</details>

<details>
<summary><strong>Definition of Done</strong></summary>

- [ ] `pnpm tsc --noEmit` passes with 0 errors
- [ ] `pnpm lint` passes with 0 warnings
- [ ] `pnpm build` succeeds
- [ ] Lighthouse Performance ≥ 95
- [ ] Lighthouse SEO = 100
- [ ] Lighthouse Accessibility ≥ 95
- [ ] Lighthouse Best Practices ≥ 95
- [ ] Page load time < 2 seconds
- [ ] Site indexed by Google (submitted to Search Console)
- [ ] Uptime monitoring configured

</details>

---

## Changelog

| Date        | Change                                                                          |
| ----------- | ------------------------------------------------------------------------------- |
| Jan 8, 2026 | Phase 2 complete: All 7 public pages with SSR, type-safe routing, Tailwind v4   |
| Jan 8, 2026 | Phase 1 complete: UI components, 7 public routes, Ubuntu theme                  |
| Jan 4, 2026 | Created progress tracking document                                              |

---

## Future Considerations (Post-v1)

Items to implement after the initial launch:

- [ ] Analytics integration (Umami/Plausible)
- [ ] Newsletter subscription
- [ ] Project case studies
- [ ] Internationalization (i18n)
- [ ] Blog comments (Giscus/Utterances)
- [ ] RSS feed for blog
- [ ] Webmentions
- [ ] Reading progress indicator
- [ ] Command palette (Cmd+K)
- [ ] View transitions API

---

## Quality Gates

Before each phase completion, verify:

```bash
pnpm tsc --noEmit && pnpm lint && pnpm build
```

| Check             | Target |
| ----------------- | ------ |
| TypeScript errors | 0      |
| Lint warnings     | 0      |
| Build success     | ✓      |
| Lighthouse Perf   | 95+    |
| Lighthouse SEO    | 100    |
| Lighthouse a11y   | 95+    |
