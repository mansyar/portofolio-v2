---
description: Initialize the portfolio project with TanStack Start, Convex, R2, and Docker
---

# Project Setup Workflow

This workflow initializes the complete portfolio project from scratch.

## Prerequisites

- Node.js 20+ installed
- pnpm installed (`npm install -g pnpm`)
- Self-hosted Convex backend running (on Coolify)
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
pnpm add convex @convex-dev/react-query @convex-dev/auth @auth/core
pnpm add @tanstack/react-query sharp clsx
pnpm add -D @types/node typescript eslint prettier
```

---

## Step 3: Install UI/Editor Dependencies

```bash
pnpm add @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link @tiptap/extension-code-block-lowlight
pnpm add lowlight lucide-react
```

---

## Step 4: Create Project Structure

Create the following directories:

- `src/components/ui/`
- `src/components/features/`
- `src/components/layout/`
- `src/components/editor/`
- `src/hooks/`
- `src/lib/convex/`
- `src/lib/r2/`
- `src/styles/`
- `src/types/`
- `convex/` (for Convex functions)
- `convex/lib/` (for auth helpers)
- `docker/`
- `public/fonts/`
- `public/images/`

---

## Step 5: Create Environment File

Create `.env.example` with the following content:

```env
# =============================================================================
# App Configuration
# =============================================================================
NODE_ENV=development
VITE_APP_URL=http://localhost:3000

# =============================================================================
# Self-Hosted Convex (Required)
# =============================================================================
VITE_CONVEX_URL=https://convex.ansyar-world.top
CONVEX_SELF_HOSTED_URL=https://convex.ansyar-world.top
CONVEX_SELF_HOSTED_ADMIN_KEY=your-admin-key

# =============================================================================
# Cloudflare R2 (Media Storage)
# =============================================================================
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=portfolio-media
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
VITE_R2_PUBLIC_URL=https://media.ansyar-world.top

# =============================================================================
# Admin Authentication
# =============================================================================
ADMIN_EMAIL=your-email@example.com

# =============================================================================
# Email Service (Resend)
# =============================================================================
RESEND_API_KEY=your-resend-key
CONTACT_EMAIL=contact@ansyar-world.top
```

Copy to `.env.local` and fill in actual values.

---

## Step 6: Set Up Convex Schema

Create `convex/schema.ts` with the database schema from `docs/PRD.md` Section 7.

Deploy to your self-hosted backend:

```bash
# turbo
npx convex dev --once
```

---

## Step 7: Create Convex Client

Create `src/lib/convex/client.ts`:

```typescript
import { ConvexReactClient } from "convex/react";
import { ConvexQueryClient } from "@convex-dev/react-query";

const convexUrl = import.meta.env.VITE_CONVEX_URL as string;

if (!convexUrl) {
  throw new Error("Missing VITE_CONVEX_URL environment variable.");
}

export const convex = new ConvexReactClient(convexUrl);
export const convexQueryClient = new ConvexQueryClient(convex);
```

---

## Step 8: Create Auth Helpers

Create `convex/lib/auth.ts`:

```typescript
import { QueryCtx, MutationCtx } from "../_generated/server";

const ADMIN_EMAILS = process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL] : [];

export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error("Unauthorized: Not authenticated");
  }

  const email = identity.email;
  if (!email || !ADMIN_EMAILS.includes(email)) {
    throw new Error("Unauthorized: Not an admin");
  }

  return { email, subject: identity.subject };
}
```

---

## Step 9: Create CSS Variables File

Create `src/styles/variables.css` with the Ubuntu Terminal design tokens from PRD Section 4.

---

## Step 10: Create Docker Configuration

Create `docker/Dockerfile` and `docker/docker-compose.yml` using templates from PRD Section 10.

---

## Step 11: Configure ESLint

Create `eslint.config.js` with TypeScript and React hooks support.

---

## Step 12: Verify Setup

```bash
# turbo
pnpm dev
```

Open http://localhost:3000 to verify the app runs.

---

## Completion Checklist

- [ ] TanStack Start initialized
- [ ] Convex dependencies installed
- [ ] Directory structure created
- [ ] Environment variables configured
- [ ] Convex schema deployed
- [ ] Convex client created
- [ ] Auth helpers created
- [ ] CSS variables defined
- [ ] Docker files created
- [ ] ESLint configured
- [ ] Dev server runs successfully
