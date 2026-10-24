# Product Definition — Ansyar's Portfolio

**Product:** Portfolio Website + Custom CMS
**Domain:** ansyar-world.top
**Status:** v1.0 released (Phases 0–4 complete)
**Owner:** Single maintainer (DevOps Engineer & Web Developer)

## Vision

A single-author portfolio website and self-hosted content management system built to
convert recruiters, prospective clients, and technical peers into contacts — by
presenting skills, projects, experience, and writing through a distinctive
Ubuntu-terminal-inspired interface, with all content authored through a bespoke CMS
rather than a third-party headless CMS.

The project carries three interlocking purposes, in priority order:

1. **Job and client acquisition (primary)** — the site must perform as a professional
   credential: fast, findable, accurate, and current.
2. **Engineering showcase and learning vehicle** — the site's own construction
   (TanStack Start SSR, Convex reactive backend, self-hosted deployment, CI/CD) is
   itself evidence of capability.
3. **Content platform** — a real CMS for the owner's writing and project history, with
   no dependency on hosted content infrastructure.

The differentiators that must not be traded away: a unique terminal-inspired design,
a fully custom CMS, an auto-generated PDF resume derived from CMS data, and real-time
content updates.

## Target Users

| Audience | Goals | Primary content |
| --- | --- | --- |
| **Recruiters** | Evaluate technical skills and experience quickly; verify credibility | Skills, Projects, Resume PDF, Blog |
| **Prospective clients** | Assess capability and fit for freelance/contract work | Projects, Skills, Contact form |
| **Technical peers / general public** | Discover DevOps and web content; follow writing | Blog, Uses page |
| **The owner (sole admin)** | Publish and edit all site content without code changes or deploys | Entire admin panel |

Admin access is restricted to an allowlisted email set via `ADMIN_EMAIL` (comma-separated).
There is one role: administrator.

## Core Use Cases

**Public**

- Land on the home page and immediately understand who the owner is and what they do.
- Scan featured projects and recent writing; drill into a project detail or blog post.
- Review skills by category with proficiency and years of experience.
- Read the about page and download a PDF resume generated from live CMS data.
- Submit a contact message (rate-limited) and receive a Slack notification to the owner.
- Subscribe to the newsletter and receive a welcome email.
- Share a post; comment via Giscus (GitHub Discussions).
- Discover content through the sitemap, RSS feed, and social preview cards.

**Admin**

- Authenticate to `/admin`; all admin routes are guarded and every mutating Convex
  function calls `requireAdmin`.
- Create, edit, reorder, publish/unpublish, and bulk-manage projects and blog posts
  (with categories, tags, rich-text editing, cover images, reading time).
- Manage skills, uses items, resume data (profile, experience, education,
  certifications), media files, contact messages, newsletter subscribers, and site
  settings.
- Review dashboard statistics, recent messages, analytics, and the activity log.

## Goals & Success Metrics

| Metric | Target |
| --- | --- |
| Lighthouse score | 95+ across all categories |
| Page load time | < 2 seconds |
| SEO visibility | Indexed on Google within 2 weeks of launch |
| Uptime | 99.9% |
| CMS usability | All content editable without code changes |
| Contact submissions | Tracked as a leading engagement signal |
| Resume downloads | Tracked as a leading engagement signal |

Performance, accessibility, and SEO are treated as product features, not chores: they are
the mechanism by which the primary goal (being hired) is achieved.

## Core Flows

1. **Discovery → contact:** search/social → home → projects or blog → contact form →
   Slack notification → owner replies.
2. **Credibility check:** recruiter → about → resume PDF download → skills → projects.
3. **Publishing:** admin login → author draft → preview → publish → live via Convex
   reactivity, sitemap and RSS updated automatically.
4. **Resume maintenance:** admin updates profile/experience/education → PDF regenerates
   from CMS data on next download (no manual document editing).

## Scope & Non-Goals

**In scope:** public marketing pages (home, about, skills, projects, blog, uses,
contact), the full admin CMS, SEO surface (sitemap, RSS, JSON-LD, OG), analytics
integration, newsletter capture, contact handling, PDF resume generation, Dockerized
self-hosted deployment with CI/CD.

**Explicit non-goals:**

- **Multi-author CMS** — no editor roles, invitations, or per-user permissions.
- **E-commerce or payments** — no cart, checkout, or paid content.
- **Built-in comment system** — comments remain delegated to Giscus; no in-app
  commenting or moderation.
- **Native mobile app** — responsive web only; no app-store distribution.

## Constraints

**Operating realities** — true of the project, and they shape decisions without gating
them:

- **Single maintainer.** No team, no external code review. Patterns must be
  self-explanatory and survive long gaps between work sessions.
- **Self-hosted core.** The application's core function (database, storage, auth,
  hosting) runs on infrastructure the owner controls: self-hosted Convex, Cloudflare R2
  for media, Coolify + Nginx for deployment. There is no managed fallback.

**None of these is declared strictly binding.** The owner has stated that no constraint
other than the technical realities above gates future work. When quality and speed
conflict, quality wins — but a constraint is never a reason to refuse a change outright.

## Integrations and External Dependencies

| Integration | Purpose | Failure impact |
| --- | --- | --- |
| Self-hosted Convex | Database, serverless functions, file storage, auth | Total outage; CMS and public data unavailable |
| Convex Auth (password provider) | Admin authentication | Admin lockout |
| Cloudflare R2 (via Convex storage) | Media and image storage | Broken images and uploads |
| Umami (self-hosted) | Privacy-friendly analytics + admin dashboard widget | Dashboard analytics empty; no user-facing impact |
| Resend | Newsletter welcome email | Subscriber stored but not emailed |
| Slack webhook | Contact-form notifications | Messages stored, owner not notified |
| Giscus / GitHub Discussions | Blog comments | Comments unavailable; content unaffected |
| Coolify + Docker Hub | Deployment pipeline | Cannot ship |
| JWT_PRIVATE_KEY / JWKS | Auth token signing | Admin authentication fails |

## Risks and Unknowns

- **Self-hosted infrastructure burden.** Convex, R2, Umami, and Coolify upgrades,
  backups, and outages are all owned by one person; a broken CMS blocks all content work.
- **Content staleness.** Projects, posts, and resume data going out of date directly
  undermines the primary purpose (credibility with recruiters).
- **Roadmap scope creep.** `docs/PROGRESS.md` lists Phases 6–12 as aspirational;
  pursuing them in parallel risks half-finished features reaching production.
- **Performance and SEO regression.** Holding Lighthouse 95+ and <2s becomes harder with
  every added script, widget, and rich-text surface.
- **Bus factor of one.** Recovery and handover knowledge currently lives in
  `README.md`, `docs/PRD.md`, and `docs/PROGRESS.md` rather than in runbooks.

## Open Questions & Assumptions

**Open questions**

- **Internationalization:** deferred. No decision on whether the site will ever be
  localized; if it is, content authoring and the CMS schema would both need changes.
- **Blog full-text search:** deferred. Category and tag filtering is currently
  sufficient; the trigger for revisiting is unclear.
- **Roadmap prioritization:** Phases 6–12 in `docs/PROGRESS.md` have not been
  reconciled into a committed backlog; which of them are real is unresolved.
- **Content freshness mechanism:** no reminder, scheduled review, or staleness signal
  exists to prompt content updates.

**Recorded assumptions**

- *Sole admin* — assumed the owner is and remains the only editor; the allowlist
  supports multiple emails but multi-author workflows are out of scope.
- *Self-hosted by preference* — assumed self-hosting is a deliberate stance rather than
  a temporary cost measure, since it is a stated differentiator of the owner's skillset.
- *English-only for now* — assumed from the absence of any i18n infrastructure, while
  i18n itself remains an open question rather than a non-goal.
