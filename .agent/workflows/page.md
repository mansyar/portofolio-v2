---
description: Create a new public page with SSR, SEO, and proper routing
---

# Create Public Page Workflow

This workflow creates a new public-facing page with server-side rendering, SEO optimization, and TanStack Start routing conventions.

---

## Step 1: Determine Route Structure

Based on the page requirements:

| Page Type   | File Location                 | Example              |
| ----------- | ----------------------------- | -------------------- |
| Static page | `app/routes/{name}.tsx`       | `about.tsx`          |
| List page   | `app/routes/{name}/index.tsx` | `projects/index.tsx` |
| Detail page | `app/routes/{name}/$slug.tsx` | `projects/$slug.tsx` |

---

## Step 2: Create Route File

### For Static Pages

Create `app/routes/{page-name}.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/start";
import { createSupabaseServerClient } from "~/lib/supabase/server";
import { SEO } from "~/components/features/seo";

// Server function for data loading
const getData = createServerFn("GET", async () => {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("your_table")
    .select("*")
    .eq("is_visible", true);

  if (error) throw error;
  return data;
});

export const Route = createFileRoute("/page-name")({
  loader: () => getData(),
  component: PageNamePage,
});

function PageNamePage() {
  const data = Route.useLoaderData();

  return (
    <>
      <SEO
        title="Page Title | Ansyar's Portfolio"
        description="Page description for SEO."
        canonical="https://ansyar-world.top/page-name"
      />

      <main className="page page--page-name">{/* Page content */}</main>
    </>
  );
}
```

### For Detail Pages with Dynamic Slug

Create `app/routes/{name}/$slug.tsx`:

```tsx
import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/start";
import { createSupabaseServerClient } from "~/lib/supabase/server";
import { SEO } from "~/components/features/seo";

const getItem = createServerFn("GET", async (slug: string) => {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("your_table")
    .select("*")
    .eq("slug", slug)
    .eq("is_visible", true)
    .single();

  if (error || !data) {
    throw notFound();
  }

  return data;
});

export const Route = createFileRoute("/items/$slug")({
  loader: ({ params }) => getItem(params.slug),
  component: ItemDetailPage,
});

function ItemDetailPage() {
  const item = Route.useLoaderData();

  return (
    <>
      <SEO
        title={`${item.title} | Ansyar's Portfolio`}
        description={item.short_description}
        canonical={`https://ansyar-world.top/items/${item.slug}`}
        ogImage={item.thumbnail_url}
      />

      <main className="page page--item-detail">{/* Detail content */}</main>
    </>
  );
}
```

---

## Step 3: Create SEO Component (if not exists)

Create `app/components/features/seo.tsx`:

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

## Step 4: Add Page Styles

Create or update CSS for the page following Ubuntu Terminal design:

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

## Step 5: Add to Navigation (if applicable)

Update `app/components/layout/navigation.tsx` to include the new page link.

---

## Step 6: Verify Page

```bash
# turbo
pnpm dev
```

1. Navigate to the new page
2. Check SEO meta tags in browser dev tools
3. Verify data loading works
4. Test responsive design

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
