---
trigger: always_on
---

# Portfolio CMS - AI Agent Rules

> **Stack:** TanStack Start, React 19, TypeScript, Supabase, R2  
> **Design:** Ubuntu Terminal aesthetic with monospace typography

---

## Core Principles

| Principle | Application                                                                                     |
| --------- | ----------------------------------------------------------------------------------------------- |
| **DRY**   | Extract hooks to `app/hooks/`, utils to `app/lib/`, reusable components to `app/components/ui/` |
| **KISS**  | Simple, readable code over clever solutions; self-documenting names                             |
| **YAGNI** | Build only what's needed now; refactor when patterns emerge                                     |
| **SRP**   | One responsibility per function/component                                                       |

---

## TypeScript

- **No `any`** - use `unknown` + type guards
- **Zod** for runtime validation: `type X = z.infer<typeof XSchema>`
- **Explicit return types** on async functions
- **Naming:** Components=PascalCase, hooks=useX, constants=SCREAMING_SNAKE, DB=snake_case

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
```

**Rules:**

- Named exports only (no default)
- <200 lines per component
- Co-locate CSS: `button.tsx` + `button.css`
- Memoize with `useMemo`/`useCallback` when needed

**Directories:** `ui/` (primitives) | `features/` (domain) | `layout/` (structural)

---

## Styling

**Always use CSS variables from `variables.css`:**

```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  font-family: var(--font-mono);
}
```

**Colors:** `--color-ubuntu-orange` (accent) | `--color-terminal-green` (success) | `--color-terminal-red` (error)

**Terminal aesthetic:** Buttons with `$` prefix, cards with window titlebar dots, inputs with `>` prompt

---

## TanStack Start

**Routing:** `app/routes/` - `index.tsx` (/) | `$slug.tsx` (dynamic) | `_layout.tsx` (nested layout)

**Server Functions:**

```typescript
import { createServerFn } from "@tanstack/start";
import { createSupabaseServerClient } from "~/lib/supabase/server";

export const getData = createServerFn("GET", async () => {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("table")
    .select("*")
    .eq("is_visible", true);
  if (error) throw new Error("Failed to fetch");
  return data;
});
```

---

## Supabase

- **Server:** `createSupabaseServerClient()` | **Client:** `createSupabaseBrowserClient()`
- Select specific columns, not `*`
- All tables have RLS enabled
- Use `/migrate` workflow for schema changes

---

## Error Handling

```typescript
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// Always try-catch, log server-side, return safe messages to users
```

---

## Security

- Protect `/admin/*` routes with `requireAdmin()` check
- Validate all input with Zod (client + server)
- Never commit secrets; use `.env.local`, prefix public vars with `PUBLIC_`

---

## Performance & a11y

- **Images:** R2 storage, WebP, lazy load, always include `alt`
- **Lazy load:** `lazy(() => import('./heavy-component'))`
- **Semantic HTML:** `<nav>`, `<main>`, `<article>`, single `<h1>`
- **Keyboard accessible**, visible focus states, WCAG AA contrast

---

## SEO

- Unique `<title>` + `<meta description>` per page
- Open Graph tags, canonical URLs
- JSON-LD structured data (Person, Article, BreadcrumbList)

---

## Quality Checks

```bash
pnpm tsc --noEmit && pnpm lint && pnpm build
```

**Before commit:** No TS errors, no lint warnings, CSS uses variables, admin routes protected, responsive

---

## Git

**Commits:** `<type>(<scope>): <description>` — types: feat, fix, docs, refactor, chore

**Branches:** `feature/x`, `fix/x`, `chore/x`

---

## Reference

- **PRD:** `docs/PRD.md` for specs
- **Workflows:** `/setup`, `/component`, `/page`, `/admin-page`, `/api`, `/migrate`, `/types`, `/check`
