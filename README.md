# Ansyar's Portfolio

> A portfolio website + custom CMS built with TanStack Start, Convex, and an Ubuntu Terminal-inspired design.

**Domain:** [ansyar-world.top](https://ansyar-world.top)  
**Status:** 🚧 In Development (Phase 1 Complete)

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | TanStack Start (React 19, SSR) |
| **Database** | Convex (self-hosted) |
| **Styling** | Tailwind CSS v4 + CSS Variables |
| **Storage** | Cloudflare R2 |
| **Deployment** | Docker + Coolify |

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
│   ├── ui/          # Base primitives (Button, Input, Card)
│   ├── layout/      # Header, Footer
│   └── features/    # Domain-specific components
├── routes/          # File-based routing
│   ├── index.tsx    # Home page
│   ├── about.tsx    # About page
│   ├── skills.tsx   # Skills page
│   ├── projects.tsx # Projects page
│   ├── blog.tsx     # Blog page
│   ├── uses.tsx     # Uses page
│   └── contact.tsx  # Contact page
├── styles/
│   ├── variables.css # CSS custom properties (Ubuntu theme)
│   └── globals.css   # Global styles
└── lib/             # Utilities and Convex client

convex/
├── schema.ts        # Database schema (14 tables)
├── skills.ts        # Skills API
└── lib/auth.ts      # Authorization helpers
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

---

## Design System

The UI follows an **Ubuntu Terminal** aesthetic:

- **Colors:** Ubuntu Orange (#E95420), Aubergine (#2C001E), Terminal Green (#4E9A06)
- **Typography:** Ubuntu Mono throughout
- **Components:** Terminal-style cards with traffic light dots, `>` prompt inputs
- **Dark mode:** Default theme with light mode support

---

## Environment Variables

See `.env.example` for all required variables:

```env
# Convex
VITE_CONVEX_URL=https://your-convex-url
CONVEX_SELF_HOSTED_ADMIN_KEY=your-admin-key

# Cloudflare R2
R2_ACCESS_KEY_ID=your-r2-key
R2_SECRET_ACCESS_KEY=your-r2-secret
R2_BUCKET_NAME=portfolio-media

# Admin
ADMIN_EMAIL=your-email@example.com
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

## Documentation

- [PRD.md](./docs/PRD.md) - Product Requirements Document
- [PROGRESS.md](./docs/PROGRESS.md) - Development progress tracking
- [MIGRATION_PLAN.md](./docs/MIGRATION_PLAN.md) - Supabase → Convex migration details

---

## License

MIT © Muhammad Ansyar Rafi Putra
