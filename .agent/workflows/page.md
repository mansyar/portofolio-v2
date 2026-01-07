---
description: Create a new public page with SSR, SEO, and proper routing
---

# Create Public Page Workflow

This workflow creates a new public-facing page with server-side rendering, SEO optimization, and TanStack Start + Convex integration.

---

## Step 1: Determine Route Structure

Based on the page requirements:

| Page Type   | File Location                 | Example              |
| ----------- | ----------------------------- | -------------------- |
| Static page | `src/routes/{name}.tsx`       | `about.tsx`          |
| List page   | `src/routes/{name}/index.tsx` | `projects/index.tsx` |
| Detail page | `src/routes/{name}/$slug.tsx` | `projects/$slug.tsx` |

---

## Step 2: Create Convex Query (if fetching data)

Create or add to `convex/{entity}.ts`:

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get all visible items for the public page.
 */
export const listVisible = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("items")
      .withIndex("by_order")
      .filter((q) => q.eq(q.field("isVisible"), true))
      .collect();
  },
});

/**
 * Get single item by slug.
 */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const item = await ctx.db
      .query("items")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .filter((q) => q.eq(q.field("isVisible"), true))
      .first();

    if (!item) {
      throw new Error("Item not found");
    }

    return item;
  },
});
```

Deploy the query:

```bash
# turbo
npx convex dev --once
```

---

## Step 3: Create Route File

### For Static/List Pages

Create `src/routes/{page-name}.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "../../convex/_generated/api";
import { SEO } from "~/components/features/seo";
import "./page-name.css";

export const Route = createFileRoute("/page-name")({
  component: PageNamePage,
});

function PageNamePage() {
  // Fetch data with SSR + real-time updates
  const { data: items } = useSuspenseQuery(
    convexQuery(api.items.listVisible, {})
  );

  return (
    <>
      <SEO
        title="Page Title | Ansyar's Portfolio"
        description="Page description for SEO."
        canonical="https://ansyar-world.top/page-name"
      />

      <main className="page page--page-name">
        <h1>~/page-name</h1>
        {/* Page content */}
      </main>
    </>
  );
}
```

### For Detail Pages with Dynamic Slug

Create `src/routes/{name}/$slug.tsx`:

```tsx
import { createFileRoute, notFound } from "@tanstack/react-router";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";
import { SEO } from "~/components/features/seo";

export const Route = createFileRoute("/items/$slug")({
  component: ItemDetailPage,
});

function ItemDetailPage() {
  const { slug } = Route.useParams();

  const { data: item } = useSuspenseQuery(
    convexQuery(api.items.getBySlug, { slug })
  );

  if (!item) {
    throw notFound();
  }

  return (
    <>
      <SEO
        title={`${item.title} | Ansyar's Portfolio`}
        description={item.shortDescription || ""}
        canonical={`https://ansyar-world.top/items/${item.slug}`}
        ogImage={item.thumbnailUrl}
      />

      <main className="page page--item-detail">
        <h1>{item.title}</h1>
        {/* Detail content */}
      </main>
    </>
  );
}
```

---

## Step 4: Create SEO Component (if not exists)

Create `src/components/features/seo.tsx`:

```tsx
interface SEOProps {
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
  ogType?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
}

export function SEO({
  title,
  description,
  canonical,
  ogImage = "https://ansyar-world.top/og-default.png",
  ogType = "website",
  publishedTime,
  modifiedTime,
}: SEOProps) {
  return (
    <>
      {/* Basic Meta */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="Ansyar's Portfolio" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Article specific */}
      {publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
    </>
  );
}
```

---

## Step 5: Add Page Styles

Create or update `src/routes/page-name.css` following Ubuntu Terminal design:

```css
.page--page-name {
  min-height: 100vh;
  padding: 2rem;
  background-color: var(--color-bg-primary);
}

/* Terminal-style section headers */
.page__section-title {
  font-family: var(--font-mono);
  color: var(--color-ubuntu-orange);
  margin-bottom: 1.5rem;
}

.page__section-title::before {
  content: "# ";
  opacity: 0.7;
}
```

---

## Step 6: Add to Navigation (if applicable)

Update `src/components/layout/navigation.tsx` to include the new page link.

---

## Step 7: Verify Page

```bash
# turbo
pnpm dev
```

1. Navigate to the new page
2. Check SEO meta tags in browser dev tools
3. Verify data loading works
4. Test real-time updates (modify data in Convex dashboard)
5. Test responsive design

---

## SEO Checklist

- [ ] Unique, descriptive `<title>` tag
- [ ] Meta description under 160 characters
- [ ] Canonical URL set
- [ ] Open Graph tags present
- [ ] Twitter Card tags present
- [ ] Proper heading hierarchy (single H1)
- [ ] Semantic HTML landmarks
- [ ] Alt text for images

---

## Data Fetching Patterns

### SSR + Real-time (Recommended)

```tsx
const { data } = useSuspenseQuery(
  convexQuery(api.items.listVisible, {})
);
```

- Data is fetched on server for SSR
- Automatically updates when data changes
- Best for most use cases

### Client-only (SPA Mode)

```tsx
const { data } = useQuery(
  convexQuery(api.items.listVisible, {})
);
```

- Data fetched on client only
- Use when SSR is not needed
