# Progress Tracking

> **Project:** Ansyar's Portfolio + Custom CMS  
> **Last Updated:** January 4, 2026  
> **Current Phase:** Phase 1 - Foundation

---

## Overview

| Metric            | Value                 |
| ----------------- | --------------------- |
| **Overall**       | █░░░░░░░░░ 10%        |
| **Phase 1**       | ████████░░ 83%        |
| **Target Launch** | ~10 weeks (estimated) |

---

## Phase 1: Foundation (Week 1-2)

**Status:** 🔴 Not Started  
**Progress:** 0/6 tasks

| Task                               | Status | Notes |
| ---------------------------------- | ------ | ----- |
| Initialize TanStack Start project  | [x]    |       |
| Set up Supabase project and schema | [x]    | Created 'ansyar-portfolio' and applied schema |
| Configure R2 bucket                | [ ]    | Credentials in .env, bucket needed |
| Implement design system            | [x]    | Variables & tokens created |
| Set up Docker configuration        | [x]    | Dockerfile & Compose created |
| Basic routing structure            | [x]    | Initial structure with src/ |

<details>
<summary><strong>Acceptance Criteria</strong></summary>

- [ ] TanStack Start app runs locally with `pnpm dev`
- [ ] Supabase project created with all tables from PRD schema
- [ ] RLS policies applied to all tables
- [ ] R2 bucket created and accessible via API
- [ ] CSS variables defined in `variables.css` matching Ubuntu theme
- [ ] Base UI components: Button, Input, Card created
- [ ] Docker container builds and runs successfully
- [ ] All public routes render without errors: `/`, `/about`, `/skills`, `/projects`, `/blog`, `/uses`, `/contact`

</details>

<details>
<summary><strong>Definition of Done</strong></summary>

- [ ] `pnpm tsc --noEmit` passes with 0 errors
- [ ] `pnpm lint` passes with 0 warnings
- [ ] `pnpm build` succeeds
- [ ] Docker image builds successfully
- [ ] All Supabase migrations applied
- [ ] Environment variables documented in `.env.example`
- [ ] README updated with setup instructions

</details>

---

## Phase 2: Public Pages (Week 3-4)

**Status:** ⚪ Pending  
**Progress:** 0/7 tasks

| Task                        | Status | Notes |
| --------------------------- | ------ | ----- |
| Home page with all sections | [ ]    |       |
| About page                  | [ ]    |       |
| Skills page with categories | [ ]    |       |
| Projects listing + detail   | [ ]    |       |
| Blog listing + detail       | [ ]    |       |
| Uses page                   | [ ]    |       |
| Contact page with form      | [ ]    |       |

<details>
<summary><strong>Acceptance Criteria</strong></summary>

- [ ] Home: Hero with typing animation, featured projects carousel, skills preview, CTA
- [ ] About: Bio, journey timeline, services sections render correctly
- [ ] Skills: Grouped by category, proficiency bars display correctly
- [ ] Projects: Grid layout with filtering by tech stack, detail pages with gallery
- [ ] Blog: Paginated list (10/page), category/tag filtering, detail with TOC
- [ ] Uses: Items grouped by category with images and links
- [ ] Contact: Form validates input, submits to Supabase, shows success message
- [ ] All pages have proper meta tags (title, description, OG)
- [ ] All pages responsive (mobile, tablet, desktop)
- [ ] Dark/light theme toggle works across all pages

</details>

<details>
<summary><strong>Definition of Done</strong></summary>

- [ ] `pnpm tsc --noEmit` passes with 0 errors
- [ ] `pnpm lint` passes with 0 warnings
- [ ] `pnpm build` succeeds
- [ ] Lighthouse Performance ≥ 90 on all pages
- [ ] Lighthouse Accessibility ≥ 95 on all pages
- [ ] All images have alt text
- [ ] Semantic HTML used (`<main>`, `<nav>`, `<article>`, single `<h1>`)
- [ ] Keyboard navigation works on all interactive elements

</details>

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

| Date        | Change                             |
| ----------- | ---------------------------------- |
| Jan 4, 2026 | Created progress tracking document |

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
