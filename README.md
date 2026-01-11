# Ansyar's Portfolio

> A portfolio website + custom CMS built with TanStack Start, Convex, and an Ubuntu Terminal-inspired design.

**Domain:** [ansyar-world.top](https://ansyar-world.top)  
**Status:** ✅ Released (v1.0)

---

## ✨ Features

- **Ubuntu Terminal Aesthetic** — Unique, techy design with monospace typography
- **Custom CMS** — Full content management without third-party headless CMS
- **Auto-Generated Resume** — PDF resume dynamically generated from CMS data
- **Real-time Updates** — Convex reactive queries for instant content sync
- **SEO Optimized** — SSR, sitemap, JSON-LD, Open Graph tags
- **Responsive Design** — Mobile-first with dark/light theme support

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | TanStack Start (React 19, SSR) |
| **Database** | Convex (self-hosted) |
| **Auth** | Convex Auth (Password provider) |
| **Styling** | Vanilla CSS + CSS Variables |
| **PDF Generation** | @react-pdf/renderer |
| **Rich Text** | Tiptap Editor |
| **Storage** | Convex File Storage (R2 backend) |
| **Deployment** | Docker + Coolify |
| **CI/CD** | GitHub Actions |

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Convex backend (self-hosted or cloud)

### Installation

```bash
# Clone the repository
git clone https://github.com/ansyar-world/portofolio-v2.git
cd portofolio-v2

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your Convex URL and credentials

# Deploy Convex schema
npx convex dev --once

# Start development server
pnpm dev
```

The app will be running at [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
src/
├── components/
│   ├── ui/              # Base primitives (Button, Input, Card, etc.)
│   ├── layout/          # Footer, AdminHeader, AdminSidebar
│   ├── features/        # Domain components (home/, blog/, projects/, etc.)
│   └── editor/          # RichTextEditor
├── routes/
│   ├── index.tsx        # Home page
│   ├── about.tsx        # About page (+ Resume download)
│   ├── skills.tsx       # Skills page
│   ├── projects.*.tsx   # Projects list & detail
│   ├── blog.*.tsx       # Blog list & detail
│   ├── uses.tsx         # Uses page
│   ├── contact.tsx      # Contact page
│   ├── sitemap[.]xml.ts # Dynamic sitemap
│   ├── admin.tsx        # Admin layout (protected)
│   └── admin/           # CMS pages (dashboard, projects, blog, etc.)
├── hooks/               # Custom hooks (use-auth, use-toast-mutation)
├── styles/              # CSS (variables, globals, admin, toast)
└── lib/                 # Utilities and Convex client

convex/
├── schema.ts            # Database schema (15 tables)
├── skills.ts            # Skills queries/mutations
├── projects.ts          # Projects queries/mutations
├── blog.ts              # Blog queries/mutations
├── resume.ts            # Resume queries/mutations
├── contact.ts           # Contact form handling (with rate limiting)
├── media.ts             # Media file management
└── lib/auth.ts          # requireAdmin authorization helper
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server on port 3000 |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm type-check` | Run TypeScript type checking |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run Vitest tests |

### Quality Check (before commit)

```bash
pnpm type-check; pnpm lint; pnpm build
```

---

## Design System

The UI follows an **Ubuntu Terminal** aesthetic:

- **Colors:** Ubuntu Orange (#E95420), Aubergine (#2C001E), Terminal Green (#4E9A06)
- **Typography:** Ubuntu Mono throughout
- **Components:** Terminal-style cards with traffic light dots, `>` prompt inputs, `$` button prefixes
- **Dark mode:** Default theme with light mode support
- **Animations:** Typing effect, cursor blink, smooth transitions

---

## Environment Variables

See `.env.example` for all required variables:

```env
# Convex
VITE_CONVEX_URL=https://your-convex-url
CONVEX_SELF_HOSTED_URL=https://your-convex-url
CONVEX_SELF_HOSTED_ADMIN_KEY=your-admin-key

# Auth
ADMIN_EMAIL=your-email@example.com
JWT_PRIVATE_KEY=your-jwt-private-key
JWKS=your-jwks-json

# App
VITE_APP_URL=https://ansyar-world.top
```

---

## Docker

Build and run with Docker:

```bash
# Build image
docker build -f docker/Dockerfile -t portfolio .

# Run container
docker run -p 3000:3000 portfolio
```

Or use Docker Compose:

```bash
docker-compose -f docker/docker-compose.yml up
```

---

## CMS Features

The admin panel (`/admin`) includes:

| Feature | Description |
|---------|-------------|
| **Dashboard** | Quick stats, recent messages, system status |
| **Projects** | CRUD, reorder, featured toggle, rich descriptions |
| **Blog** | Draft/publish workflow, categories, tags, reading time |
| **Skills** | Category management, proficiency sliders, icon picker |
| **Uses** | Hardware/software/tools showcase |
| **Resume** | Profile, work experience, education, certifications |
| **Media** | Upload, preview, delete files (Convex Storage) |
| **Messages** | Contact form submissions, read/unread status |

---

## Documentation

- [PRD.md](./docs/PRD.md) — Product Requirements Document
- [PROGRESS.md](./docs/PROGRESS.md) — Development progress tracking
- [MIGRATION_PLAN.md](./docs/MIGRATION_PLAN.md) — Supabase → Convex migration details

---

## License

MIT © Muhammad Ansyar Rafi Putra
