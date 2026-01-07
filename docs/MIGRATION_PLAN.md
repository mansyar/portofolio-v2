# Migration Plan: Supabase → Self-Hosted Convex

> **Date:** January 7, 2026  
> **Status:** Planning  
> **Estimated Effort:** 2-3 days

---

## Overview

This document outlines the migration from Supabase to self-hosted Convex for the portfolio project. The migration preserves the existing TanStack Start frontend while replacing the backend infrastructure.

---

## Current State vs Target State

| Aspect | Current (Supabase) | Target (Self-Hosted Convex) |
|--------|-------------------|----------------------------|
| **Database** | PostgreSQL (Supabase Cloud) | Convex (Self-hosted on Coolify) |
| **Auth** | Supabase Auth (Magic Link) | Convex Auth (Magic Link + Password) |
| **Realtime** | Supabase Realtime (optional) | Convex (built-in reactive queries) |
| **Storage** | Cloudflare R2 | Cloudflare R2 (unchanged) |
| **Type Generation** | `supabase gen types` | Automatic from Convex schema |
| **API Layer** | TanStack Start server functions | Convex queries/mutations |
| **RLS** | PostgreSQL Row Level Security | Convex function-level auth checks |

---

## Migration Phases

### Phase 1: Infrastructure Setup (Day 1)

#### 1.1 Convex Project Initialization

```bash
# Install Convex dependencies
pnpm add convex @convex-dev/react-query

# Install Convex Auth
pnpm add @convex-dev/auth @auth/core

# Initialize Convex in project
npx convex init
```

#### 1.2 Environment Configuration

Update `.env.local` for self-hosted Convex:

```bash
# Self-hosted Convex
CONVEX_SELF_HOSTED_URL=https://convex.ansyar-world.top
CONVEX_SELF_HOSTED_ADMIN_KEY=your-admin-key

# Keep R2 for media storage
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=portfolio-media
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
PUBLIC_R2_PUBLIC_URL=https://media.ansyar-world.top

# Auth
ADMIN_EMAIL=your-email@example.com

# Email (for contact form & magic links)
RESEND_API_KEY=your-resend-key
CONTACT_EMAIL=contact@ansyar-world.top
```

#### 1.3 Project Structure Changes

```
portofolio-v2/
├── convex/                    # NEW: Convex backend
│   ├── _generated/           # Auto-generated types
│   ├── schema.ts             # Database schema
│   ├── auth.ts               # Auth configuration
│   ├── auth.config.ts        # Auth providers
│   ├── skills.ts             # Skills queries/mutations
│   ├── projects.ts           # Projects queries/mutations
│   ├── blog.ts               # Blog queries/mutations
│   ├── uses.ts               # Uses queries/mutations
│   ├── resume.ts             # Resume queries/mutations
│   ├── contact.ts            # Contact mutations
│   ├── media.ts              # Media queries/mutations
│   └── http.ts               # HTTP routes (optional)
├── src/
│   ├── lib/
│   │   ├── convex/           # NEW: Convex client setup
│   │   │   └── client.ts
│   │   ├── r2/               # KEEP: R2 for media
│   │   │   └── client.ts
│   │   └── utils.ts
│   └── ...
```

---

### Phase 2: Schema Conversion (Day 1-2)

#### 2.1 Convex Schema Design

Convert SQL tables to Convex document schema. Key differences:
- No explicit foreign keys (use document IDs)
- No explicit indexes (define in schema)
- Arrays are first-class citizens
- Automatic `_id` and `_creationTime` fields

**File: `convex/schema.ts`**

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  // Auth tables (managed by Convex Auth)
  ...authTables,

  // Skills
  skills: defineTable({
    name: v.string(),
    category: v.union(
      v.literal("devops"),
      v.literal("backend"),
      v.literal("frontend"),
      v.literal("tools")
    ),
    icon: v.optional(v.string()),
    proficiency: v.number(), // 0-100
    yearsOfExperience: v.optional(v.number()),
    description: v.optional(v.string()),
    displayOrder: v.number(),
    isVisible: v.boolean(),
  })
    .index("by_category", ["category"])
    .index("by_order", ["displayOrder"]),

  // Projects
  projects: defineTable({
    slug: v.string(),
    title: v.string(),
    shortDescription: v.optional(v.string()),
    fullDescription: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    images: v.array(v.string()),
    techStack: v.array(v.string()),
    liveDemoUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    isFeatured: v.boolean(),
    displayOrder: v.number(),
    isVisible: v.boolean(),
  })
    .index("by_slug", ["slug"])
    .index("by_featured", ["isFeatured"])
    .index("by_order", ["displayOrder"]),

  // Blog Categories
  blogCategories: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    displayOrder: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_order", ["displayOrder"]),

  // Blog Tags
  blogTags: defineTable({
    name: v.string(),
    slug: v.string(),
  }).index("by_slug", ["slug"]),

  // Blog Posts
  blogPosts: defineTable({
    slug: v.string(),
    title: v.string(),
    excerpt: v.optional(v.string()),
    content: v.string(),
    coverImageUrl: v.optional(v.string()),
    categoryId: v.optional(v.id("blogCategories")),
    tagIds: v.array(v.id("blogTags")),
    status: v.union(v.literal("draft"), v.literal("published")),
    readingTime: v.optional(v.number()),
    publishedAt: v.optional(v.number()), // timestamp
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status"])
    .index("by_published", ["publishedAt"])
    .index("by_category", ["categoryId"]),

  // Uses Items
  usesItems: defineTable({
    category: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    url: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    displayOrder: v.number(),
    isVisible: v.boolean(),
  })
    .index("by_category", ["category"])
    .index("by_order", ["displayOrder"]),

  // Resume Profile (singleton pattern - one document)
  resumeProfile: defineTable({
    fullName: v.string(),
    title: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    location: v.optional(v.string()),
    summary: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
  }),

  // Work Experiences
  workExperiences: defineTable({
    company: v.string(),
    role: v.string(),
    location: v.optional(v.string()),
    startDate: v.string(), // ISO date string
    endDate: v.optional(v.string()), // null = current
    description: v.optional(v.string()),
    displayOrder: v.number(),
    isVisible: v.boolean(),
  }).index("by_order", ["displayOrder"]),

  // Education
  education: defineTable({
    institution: v.string(),
    degree: v.string(),
    field: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    description: v.optional(v.string()),
    displayOrder: v.number(),
    isVisible: v.boolean(),
  }).index("by_order", ["displayOrder"]),

  // Certifications
  certifications: defineTable({
    name: v.string(),
    issuer: v.string(),
    issueDate: v.string(),
    expiryDate: v.optional(v.string()),
    credentialUrl: v.optional(v.string()),
    displayOrder: v.number(),
    isVisible: v.boolean(),
  }).index("by_order", ["displayOrder"]),

  // Contact Submissions
  contactSubmissions: defineTable({
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    message: v.string(),
    isRead: v.boolean(),
  }).index("by_read", ["isRead"]),

  // Site Settings (key-value store pattern)
  siteSettings: defineTable({
    key: v.string(),
    value: v.any(),
  }).index("by_key", ["key"]),

  // Media Files (metadata, actual files in R2)
  mediaFiles: defineTable({
    filename: v.string(),
    originalFilename: v.string(),
    mimeType: v.string(),
    size: v.number(),
    url: v.string(),
    altText: v.optional(v.string()),
  }),
});
```

---

### Phase 3: Client Setup (Day 2)

#### 3.1 TanStack Start + Convex Integration

**File: `src/lib/convex/client.ts`**

```typescript
import { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexReactClient } from "convex/react";

const convexUrl = import.meta.env.VITE_CONVEX_URL;

export const convex = new ConvexReactClient(convexUrl);
export const convexQueryClient = new ConvexQueryClient(convex);
```

**File: `src/router.tsx`** (updated)

```typescript
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { ConvexProvider } from "convex/react";
import { convex, convexQueryClient } from "./lib/convex/client";
import { routeTree } from "./routeTree.gen";

export function createAppRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
      },
    },
  });
  
  convexQueryClient.connect(queryClient);

  return createRouter({
    routeTree,
    context: { queryClient },
    Wrap: ({ children }) => (
      <ConvexProvider client={convex}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </ConvexProvider>
    ),
  });
}
```

---

### Phase 4: Auth Migration (Day 2)

#### 4.1 Convex Auth Setup

**File: `convex/auth.config.ts`**

```typescript
export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
  ],
};
```

**File: `convex/auth.ts`**

```typescript
import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { MagicLink } from "@convex-dev/auth/providers/MagicLink";
import Resend from "@auth/core/providers/resend";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    // Password auth for admin
    Password,
    // Magic link via Resend
    MagicLink({
      id: "resend",
      apiKey: process.env.RESEND_API_KEY,
    }),
  ],
});
```

#### 4.2 Admin Authorization Helper

**File: `convex/lib/auth.ts`**

```typescript
import { QueryCtx, MutationCtx } from "./_generated/server";

const ADMIN_EMAILS = [process.env.ADMIN_EMAIL];

export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized: Not authenticated");
  }
  if (!ADMIN_EMAILS.includes(identity.email ?? "")) {
    throw new Error("Unauthorized: Not an admin");
  }
  return identity;
}

export async function optionalAdmin(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  if (!ADMIN_EMAILS.includes(identity.email ?? "")) return null;
  return identity;
}
```

---

### Phase 5: API Migration (Day 2-3)

Convert TanStack Start server functions to Convex queries/mutations.

#### Example: Skills API

**File: `convex/skills.ts`**

```typescript
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

// Public: Get all visible skills
export const listVisible = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("skills")
      .filter((q) => q.eq(q.field("isVisible"), true))
      .order("asc")
      .collect();
  },
});

// Public: Get skills by category
export const byCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("skills")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .filter((q) => q.eq(q.field("isVisible"), true))
      .collect();
  },
});

// Admin: Get all skills (including hidden)
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("skills").order("asc").collect();
  },
});

// Admin: Create skill
export const create = mutation({
  args: {
    name: v.string(),
    category: v.union(
      v.literal("devops"),
      v.literal("backend"),
      v.literal("frontend"),
      v.literal("tools")
    ),
    icon: v.optional(v.string()),
    proficiency: v.number(),
    yearsOfExperience: v.optional(v.number()),
    description: v.optional(v.string()),
    displayOrder: v.number(),
    isVisible: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("skills", args);
  },
});

// Admin: Update skill
export const update = mutation({
  args: {
    id: v.id("skills"),
    name: v.optional(v.string()),
    category: v.optional(v.union(
      v.literal("devops"),
      v.literal("backend"),
      v.literal("frontend"),
      v.literal("tools")
    )),
    icon: v.optional(v.string()),
    proficiency: v.optional(v.number()),
    yearsOfExperience: v.optional(v.number()),
    description: v.optional(v.string()),
    displayOrder: v.optional(v.number()),
    isVisible: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

// Admin: Delete skill
export const remove = mutation({
  args: { id: v.id("skills") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});
```

---

### Phase 6: Frontend Updates (Day 3)

#### 6.1 Using Convex Queries in Components

**Example: Skills Page**

```typescript
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "../../convex/_generated/api";

export function SkillsPage() {
  const { data: skills } = useSuspenseQuery(
    convexQuery(api.skills.listVisible, {})
  );

  return (
    <div className="skills-page">
      {skills.map((skill) => (
        <SkillCard key={skill._id} skill={skill} />
      ))}
    </div>
  );
}
```

---

## Files to Remove

After migration, delete these Supabase-related files:

```
src/lib/supabase/          # Entire directory
  ├── client.ts
  ├── server.ts
  └── types.ts
```

---

## Files to Update

| File | Change |
|------|--------|
| `package.json` | Remove supabase deps, add convex deps |
| `.env.example` | Update environment variables |
| `.env.local` | Update with Convex credentials |
| `src/router.tsx` | Add Convex provider |
| `docs/PRD.md` | Update tech stack section |
| `docs/PROGRESS.md` | Reset progress for new stack |
| `.agent/workflows/*.md` | Update for Convex patterns |

---

## Testing Checklist

- [ ] Convex dev server connects to self-hosted backend
- [ ] Schema deploys successfully (`npx convex dev`)
- [ ] Auth flow works (sign up, sign in, sign out)
- [ ] Admin authorization works (only admin email can access)
- [ ] All public queries return data correctly
- [ ] All admin mutations work (CRUD operations)
- [ ] R2 media upload still works
- [ ] Production build succeeds
- [ ] Docker container builds and runs

---

## Rollback Plan

If migration fails:
1. Keep Supabase credentials in `.env.local.backup`
2. Git branch `pre-convex-migration` created before starting
3. Supabase project retained (don't delete until production verified)

---

## Success Criteria

- [ ] All existing functionality works with Convex
- [ ] Type safety maintained (no `any` types)
- [ ] SSR works with Convex queries
- [ ] Real-time updates work in admin panel
- [ ] Performance equal or better than Supabase
- [ ] Self-hosted Convex stable on Coolify
