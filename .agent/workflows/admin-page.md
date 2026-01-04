---
description: Create a protected admin/CMS page with authentication and CRUD operations
---

# Create Admin Page Workflow

This workflow creates a protected admin page with authentication guards and content management functionality.

---

## Step 1: Verify Admin Layout Exists

Ensure `app/routes/admin/_layout.tsx` exists with authentication protection:

```tsx
import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/start";
import { createSupabaseServerClient } from "~/lib/supabase/server";
import { AdminSidebar } from "~/components/layout/admin-sidebar";

const checkAuth = createServerFn("GET", async () => {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw redirect({ to: "/admin/login" });
  }

  // Check if user email is whitelisted
  const adminEmail = process.env.ADMIN_EMAIL;
  if (user.email !== adminEmail) {
    throw redirect({ to: "/" });
  }

  return { user };
});

export const Route = createFileRoute("/admin/_layout")({
  beforeLoad: () => checkAuth(),
  component: AdminLayout,
});

function AdminLayout() {
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

Create `app/routes/admin/{entity}.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/start";
import { createSupabaseServerClient } from "~/lib/supabase/server";
import { useState } from "react";

// Fetch all items
const getItems = createServerFn("GET", async () => {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("your_table")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) throw error;
  return data;
});

// Create item
const createItem = createServerFn("POST", async (formData: FormData) => {
  const supabase = createSupabaseServerClient();

  const item = {
    name: formData.get("name") as string,
    // ... other fields
  };

  const { data, error } = await supabase
    .from("your_table")
    .insert(item)
    .select()
    .single();

  if (error) throw error;
  return data;
});

// Update item
const updateItem = createServerFn(
  "POST",
  async ({ id, data }: { id: string; data: Partial<Item> }) => {
    const supabase = createSupabaseServerClient();

    const { data: updated, error } = await supabase
      .from("your_table")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return updated;
  }
);

// Delete item
const deleteItem = createServerFn("POST", async (id: string) => {
  const supabase = createSupabaseServerClient();

  const { error } = await supabase.from("your_table").delete().eq("id", id);

  if (error) throw error;
  return { success: true };
});

export const Route = createFileRoute("/admin/entity")({
  loader: () => getItems(),
  component: AdminEntityPage,
});

function AdminEntityPage() {
  const items = Route.useLoaderData();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const createItemFn = useServerFn(createItem);
  const updateItemFn = useServerFn(updateItem);
  const deleteItemFn = useServerFn(deleteItem);

  const handleCreate = async (formData: FormData) => {
    try {
      await createItemFn(formData);
      // Refresh data or update local state
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to create:", error);
    }
  };

  return (
    <div className="admin-page admin-page--entity">
      <header className="admin-page__header">
        <h1>Manage Entity</h1>
        <button
          className="button button--primary"
          onClick={() => setIsModalOpen(true)}
        >
          Add New
        </button>
      </header>

      <div className="admin-page__content">
        {/* Table or grid of items */}
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
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.is_visible ? "Visible" : "Hidden"}</td>
                <td>
                  <button onClick={() => handleEdit(item)}>Edit</button>
                  <button onClick={() => handleDelete(item.id)}>Delete</button>
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
interface EntityFormProps {
  initialData?: Partial<Entity>;
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel: () => void;
}

function EntityForm({ initialData, onSubmit, onCancel }: EntityFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    // Client-side validation
    const validationErrors: Record<string, string> = {};
    if (!formData.get("name")) {
      validationErrors.name = "Name is required";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Submission failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="entity-form">
      <div className="form-field">
        <label htmlFor="name">Name</label>
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
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
```

---

## Step 4: Add Admin Page Styles

Apply terminal-style admin theme:

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
  color: var(--color-ubuntu-orange);
}

.admin-page__header h1::before {
  content: "~/admin/ ";
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
```

---

## Step 5: Add to Admin Sidebar

Update `app/components/layout/admin-sidebar.tsx` to include link to new admin page.

---

## Step 6: Verify

1. Log in as admin
2. Navigate to the new admin page
3. Test CRUD operations
4. Verify validation works
5. Check error handling

---

## Security Checklist

- [ ] Route protected by authentication check
- [ ] Email whitelisting enforced
- [ ] Server-side validation on all mutations
- [ ] RLS policies in place on Supabase table
- [ ] Error messages don't leak sensitive info
