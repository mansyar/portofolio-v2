---
trigger: always_on
---

# Portfolio CMS - AI Agent Rules
> **Stack:** TanStack Start, React 19, TypeScript, Self-Hosted Convex, R2  
> **Design:** Ubuntu Terminal aesthetic with monospace typography
---
## Core Principles
| Principle | Application                                                                                     |
| --------- | ----------------------------------------------------------------------------------------------- |
| **DRY**   | Extract hooks to `src/hooks/`, utils to `src/lib/`, reusable components to `src/components/ui/` |
| **KISS**  | Simple, readable code over clever solutions; self-documenting names                             |
| **YAGNI** | Build only what's needed now; refactor when patterns emerge                                     |
| **SRP**   | One responsibility per function/component                                                       |
---
## TypeScript
- **No `any`** - use `unknown` + type guards
- **Convex validators** for backend, Zod for client-side
- **Explicit return types** on async functions
- **Naming:** Components=PascalCase, hooks=useX, constants=SCREAMING_SNAKE, DB fields=camelCase
---
## React Components
```tsx
// Structure: imports → types → component (named export)
import { useState } from "react";
import "./component.css";
interface Props {
  title: string;
  children?: React.ReactNode;
}
export function Component({ title, children }: Props) {
  const [state, setState] = useState(false);
  return (
    <div className="component">
      {title}
      {children}
    </div>
  );
}

Rules:

Named exports only (no default)
<200 lines per component
Co-locate CSS: button.tsx + button.css
Memoize with useMemo/useCallback when needed
Directories: 
ui/
 (primitives) | features/ (domain) | layout/ (structural)

---

Styling
Always use CSS variables from variables.css:

css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  font-family: var(--font-mono);
}
Colors: --color-ubuntu-orange (accent) | --color-terminal-green (success) | --color-terminal-red (error)

Terminal aesthetic: Buttons with $ prefix, cards with window titlebar dots, inputs with > prompt

---
TanStack Start + Convex
Routing: src/routes/ - index.tsx (/) | $slug.tsx (dynamic) | _layout.tsx (nested layout)

Fetching Data (SSR + Reactive):

typescript
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "../../convex/_generated/api";
export function SkillsPage() {
  const { data: skills } = useSuspenseQuery(
    convexQuery(api.skills.listVisible, {})
  );
  return <div>{/* render skills */}</div>;
}
Mutations:

typescript
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
const createSkill = useMutation(api.skills.create);
await createSkill({ name: "Docker", category: "devops", ... });
---
Convex Backend
Schema: 
convex/schema.ts
 using defineTable and validators

Queries:

typescript
import { query } from "./_generated/server";
export const listVisible = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("skills")
      .filter((q) => q.eq(q.field("isVisible"), true))
      .collect();
  },
});
Mutations with Admin Check:

typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";
export const create = mutation({
  args: { name: v.string(), ... },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("skills", args);
  },
});
---
Security
Protect /admin/* routes with Convex Auth session check
All mutations that modify data must call 
requireAdmin(ctx)
Validate all input with Convex validators
Never commit secrets; use .env.local, prefix public vars with VITE_
---
Performance & a11y
Images: R2 storage, WebP, lazy load, always include alt
Lazy load: lazy(() => import('./heavy-component'))
Semantic HTML: <nav>, <main>, <article>, single <h1>
Keyboard accessible, visible focus states, WCAG AA contrast
Convex reactivity: Data auto-updates, no manual refetching needed
---
SEO
Unique <title> + <meta description> per page
Open Graph tags, canonical URLs
JSON-LD structured data (Person, Article, BreadcrumbList)
---
Quality Checks
bash
pnpm type-check; pnpm lint; pnpm build
Before commit: No TS errors, no lint warnings, CSS uses variables, admin routes protected, responsive
---
Git
Commits: <type>(<scope>): <description> — types: feat, fix, docs, refactor, chore

Branches: feature/x, fix/x, chore/x
---
Reference
PRD: 
docs/PRD.md
 for specs
Migration: 
docs/MIGRATION_PLAN.md
 for migration details
Workflows: /setup, /component, /page, /admin-page, /api, /migrate, /types, /check