---
description: Create a protected admin/CMS page with authentication and CRUD operations
---

# Create Admin Page Workflow

This workflow creates a protected admin page with Convex Auth and content management functionality.

---

## Step 1: Verify Admin Layout Exists

Ensure `src/routes/admin/_layout.tsx` exists with authentication protection:

```tsx
import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";
import { AdminSidebar } from "~/components/layout/admin-sidebar";

export const Route = createFileRoute("/admin/_layout")({
  beforeLoad: async ({ context }) => {
    // Auth check happens via Convex query
    // If not authenticated, redirect to login
  },
  component: AdminLayout,
});

function AdminLayout() {
  // Optionally verify auth status here
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-layout__content">
        <Outlet />
      </main>
    </div>
  );
}
```

---

## Step 2: Create Admin Page Route

Create `src/routes/admin/{entity}.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";

export const Route = createFileRoute("/admin/entity")({
  component: AdminEntityPage,
});

function AdminEntityPage() {
  // Fetch all items (admin query)
  const { data: items } = useSuspenseQuery(
    convexQuery(api.items.listAll, {})
  );

  // Mutations
  const createItem = useMutation(api.items.create);
  const updateItem = useMutation(api.items.update);
  const deleteItem = useMutation(api.items.remove);
  const toggleVisibility = useMutation(api.items.toggleVisibility);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreate = async (data: ItemInput) => {
    try {
      await createItem(data);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to create:", error);
    }
  };

  const handleDelete = async (id: Id<"items">) => {
    if (!confirm("Are you sure?")) return;
    try {
      await deleteItem({ id });
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  return (
    <div className="admin-page admin-page--entity">
      <header className="admin-page__header">
        <h1>~/admin/entity</h1>
        <button
          className="button button--primary"
          onClick={() => setIsModalOpen(true)}
        >
          $ add new
        </button>
      </header>

      <div className="admin-page__content">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id}>
                <td>{item.name}</td>
                <td>
                  <button
                    onClick={() => toggleVisibility({ id: item._id })}
                    className={item.isVisible ? "status--visible" : "status--hidden"}
                  >
                    {item.isVisible ? "visible" : "hidden"}
                  </button>
                </td>
                <td>
                  <button onClick={() => handleEdit(item)}>edit</button>
                  <button onClick={() => handleDelete(item._id)}>delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <Modal onClose={() => setIsModalOpen(false)}>
          <EntityForm onSubmit={handleCreate} />
        </Modal>
      )}
    </div>
  );
}
```

---

## Step 3: Create Form Component

Create a form component for the entity:

```tsx
import { useState } from "react";
import type { Doc, Id } from "../../../convex/_generated/dataModel";

type Item = Doc<"items">;
type ItemInput = Omit<Item, "_id" | "_creationTime">;

interface EntityFormProps {
  initialData?: Item;
  onSubmit: (data: ItemInput) => Promise<void>;
  onCancel: () => void;
}

export function EntityForm({ initialData, onSubmit, onCancel }: EntityFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);

    // Validate
    const name = formData.get("name") as string;
    if (!name) {
      setErrors({ name: "Name is required" });
      setIsSubmitting(false);
      return;
    }

    try {
      await onSubmit({
        name,
        slug: formData.get("slug") as string,
        description: formData.get("description") as string || undefined,
        category: formData.get("category") as string,
        displayOrder: Number(formData.get("displayOrder")) || 0,
        isVisible: formData.get("isVisible") === "on",
      });
    } catch (error) {
      console.error("Submission failed:", error);
      setErrors({ _form: "Failed to save. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="entity-form">
      <div className="form-field">
        <label htmlFor="name">&gt; name</label>
        <input
          type="text"
          id="name"
          name="name"
          defaultValue={initialData?.name}
          className={errors.name ? "input--error" : ""}
        />
        {errors.name && <span className="error-message">{errors.name}</span>}
      </div>

      {/* More form fields */}

      <div className="form-actions">
        <button type="button" onClick={onCancel} disabled={isSubmitting}>
          cancel
        </button>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "saving..." : "$ save"}
        </button>
      </div>
    </form>
  );
}
```

---

## Step 4: Ensure Convex Functions Exist

Make sure `convex/{entity}.ts` has admin queries and mutations:

```typescript
// convex/items.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

// Admin: Get all items
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("items").withIndex("by_order").collect();
  },
});

// Admin: Create
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
    return await ctx.db.insert("items", args);
  },
});

// Admin: Update
export const update = mutation({
  args: {
    id: v.id("items"),
    // ... optional fields
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

// Admin: Delete
export const remove = mutation({
  args: { id: v.id("items") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});

// Admin: Toggle visibility
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

## Step 5: Add Admin Page Styles

Apply terminal-style admin theme in `src/routes/admin/entity.css`:

```css
.admin-page {
  padding: 2rem;
}

.admin-page__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.admin-page__header h1 {
  font-family: var(--font-mono);
  color: var(--color-terminal-green);
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-mono);
}

.admin-table th,
.admin-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.admin-table th {
  color: var(--color-text-secondary);
  font-weight: 500;
}

.admin-table tr:hover {
  background-color: var(--color-surface);
}

.status--visible {
  color: var(--color-terminal-green);
}

.status--hidden {
  color: var(--color-text-muted);
}
```

---

## Step 6: Add to Admin Sidebar

Update `src/components/layout/admin-sidebar.tsx` to include link to new admin page.

---

## Step 7: Verify

1. Log in as admin (email matches `ADMIN_EMAIL`)
2. Navigate to the new admin page
3. Test CRUD operations:
   - Create new item
   - Edit existing item
   - Toggle visibility
   - Delete item
4. Verify real-time updates (changes should appear immediately)

---

## Security Checklist

- [ ] All admin queries/mutations use `requireAdmin(ctx)`
- [ ] Route is under `/admin/` path
- [ ] `ADMIN_EMAIL` is set in environment
- [ ] Error messages don't leak sensitive info
- [ ] Convex Auth is configured
