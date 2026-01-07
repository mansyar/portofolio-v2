---
description: Create a Convex query or mutation (API function)
---

# Create Convex API Workflow

This workflow creates a type-safe Convex query or mutation for data operations.

---

## Step 1: Determine Function Type

| Type     | Use Case                    | Example                        |
| -------- | --------------------------- | ------------------------------ |
| Query    | Read data (reactive)        | Get projects, blog posts       |
| Mutation | Write data (create/update)  | CRUD operations                |
| Action   | External API calls          | Send email, upload to R2       |

---

## Step 2: Create Convex Function File

Create or add to `convex/{entity}.ts`:

### Public Query (Read-only, no auth required)

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get all visible items, ordered by displayOrder.
 * Public: No authentication required.
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
 * Get a single item by slug.
 * Public: No authentication required.
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

/**
 * Get items by category.
 */
export const byCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("items")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .filter((q) => q.eq(q.field("isVisible"), true))
      .collect();
  },
});
```

---

### Admin Query (Requires authentication)

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

/**
 * Get all items including hidden ones.
 * Admin only.
 */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("items").withIndex("by_order").collect();
  },
});

/**
 * Get a single item by ID.
 * Admin only.
 */
export const getById = query({
  args: { id: v.id("items") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.get(args.id);
  },
});
```

---

### Admin Mutation (Create/Update/Delete)

```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

/**
 * Create a new item.
 * Admin only.
 */
export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    displayOrder: v.number(),
    isVisible: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Check for duplicate slug
    const existing = await ctx.db
      .query("items")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      throw new Error("An item with this slug already exists");
    }

    return await ctx.db.insert("items", args);
  },
});

/**
 * Update an existing item.
 * Admin only.
 */
export const update = mutation({
  args: {
    id: v.id("items"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    displayOrder: v.optional(v.number()),
    isVisible: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const { id, ...updates } = args;

    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );

    if (Object.keys(cleanUpdates).length === 0) {
      return;
    }

    await ctx.db.patch(id, cleanUpdates);
  },
});

/**
 * Delete an item.
 * Admin only.
 */
export const remove = mutation({
  args: { id: v.id("items") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});

/**
 * Reorder items by updating their displayOrder.
 * Admin only.
 */
export const reorder = mutation({
  args: { orderedIds: v.array(v.id("items")) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    for (let i = 0; i < args.orderedIds.length; i++) {
      await ctx.db.patch(args.orderedIds[i], { displayOrder: i });
    }
  },
});

/**
 * Toggle visibility of an item.
 * Admin only.
 */
export const toggleVisibility = mutation({
  args: { id: v.id("items") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Item not found");

    await ctx.db.patch(args.id, { isVisible: !item.isVisible });
  },
});
```

---

## Step 3: Use in React Components

### Using Queries (SSR + Reactive)

```tsx
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "../../convex/_generated/api";

export function ItemsPage() {
  // SSR-compatible, auto-updates when data changes
  const { data: items } = useSuspenseQuery(
    convexQuery(api.items.listVisible, {})
  );

  return (
    <div>
      {items.map((item) => (
        <div key={item._id}>{item.name}</div>
      ))}
    </div>
  );
}
```

### Using Mutations

```tsx
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function CreateItemButton() {
  const createItem = useMutation(api.items.create);

  const handleCreate = async () => {
    try {
      await createItem({
        name: "New Item",
        slug: "new-item",
        category: "general",
        displayOrder: 0,
        isVisible: true,
      });
    } catch (error) {
      console.error("Failed to create:", error);
    }
  };

  return <button onClick={handleCreate}>$ create item</button>;
}
```

---

## Step 4: Deploy Functions

After creating/modifying functions, deploy to your backend:

```bash
# turbo
npx convex dev --once
```

This also regenerates types in `convex/_generated/`.

---

## Validator Reference

Common Convex validators:

```typescript
import { v } from "convex/values";

v.string()              // string
v.number()              // number
v.boolean()             // boolean
v.id("tableName")       // document ID reference
v.array(v.string())     // array of strings
v.optional(v.string())  // optional string
v.union(v.literal("a"), v.literal("b"))  // enum
v.any()                 // any value (use sparingly)
```

---

## Checklist

- [ ] Function created with proper args validation
- [ ] Admin functions use `requireAdmin(ctx)`
- [ ] Indexes used for efficient queries
- [ ] `npx convex dev --once` deployed successfully
- [ ] Types regenerated in `convex/_generated/`
- [ ] Tested in component
