---
description: Initialize the portfolio project with TanStack Start, Supabase, R2, and Docker
---

# Project Setup Workflow

This workflow initializes the complete portfolio project from scratch.

## Prerequisites

- Node.js 20+ installed
- pnpm installed (`npm install -g pnpm`)
- Supabase account ready
- Cloudflare account with R2 bucket created

---

## Step 1: Initialize TanStack Start Project

```bash
# turbo
pnpm create @tanstack/start@latest ./
```

Select options:

- TypeScript: Yes
- Package manager: pnpm

---

## Step 2: Install Core Dependencies

```bash
pnpm add @supabase/supabase-js @tanstack/react-query sharp
pnpm add -D @types/node typescript eslint prettier
```

---

## Step 3: Install UI/Editor Dependencies

```bash
pnpm add @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link @tiptap/extension-code-block-lowlight
pnpm add lowlight
```

---

## Step 4: Create Project Structure

Create the following directories:

- `app/components/ui/`
- `app/components/features/`
- `app/components/layout/`
- `app/components/editor/`
- `app/hooks/`
- `app/lib/supabase/`
- `app/lib/r2/`
- `app/styles/`
- `app/types/`
- `docker/`
- `public/fonts/`
- `public/images/`

---

## Step 5: Create Environment File

Create `.env.example` with the following content:

```env
# App
NODE_ENV=development
PUBLIC_APP_URL=http://localhost:3000

# Supabase
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cloudflare R2
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=portfolio-media
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
PUBLIC_R2_PUBLIC_URL=https://media.ansyar-world.top

# Auth
ADMIN_EMAIL=your-email@example.com

# Email (for contact form)
RESEND_API_KEY=your-resend-key
CONTACT_EMAIL=contact@ansyar-world.top
```

Copy to `.env.local` and fill in actual values.

---

## Step 6: Set Up Supabase Schema

Use the Supabase MCP tool to apply the database schema from `docs/PRD.md` Section 7.

```
mcp_supabase-mcp-server_apply_migration
```

---

## Step 7: Create CSS Variables File

Create `app/styles/variables.css` with the Ubuntu Terminal design tokens from PRD Section 4.

---

## Step 8: Create Docker Configuration

Create `docker/Dockerfile` and `docker/docker-compose.yml` using templates from PRD Section 10.

---

## Step 9: Configure ESLint & Prettier

Create `.eslintrc.cjs` and `.prettierrc` with project preferences.

---

## Step 10: Verify Setup

```bash
# turbo
pnpm dev
```

Open http://localhost:3000 to verify the app runs.

---

## Completion Checklist

- [ ] TanStack Start initialized
- [ ] All dependencies installed
- [ ] Directory structure created
- [ ] Environment variables configured
- [ ] Supabase schema applied
- [ ] CSS variables defined
- [ ] Docker files created
- [ ] Linting configured
- [ ] Dev server runs successfully
