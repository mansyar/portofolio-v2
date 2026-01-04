---
description: Create a TanStack Start server function (API route)
---

# Create API Route Workflow

This workflow creates a type-safe TanStack Start server function for API operations.

---

## Step 1: Determine API Type

| Type        | Use Case                    | Example                        |
| ----------- | --------------------------- | ------------------------------ |
| Public GET  | Fetch data for public pages | Get projects, blog posts       |
| Public POST | Submit forms                | Contact form submission        |
| Admin GET   | Fetch admin data            | Get all items including hidden |
| Admin POST  | Create/update data          | CRUD operations                |

---

## Step 2: Create Server Function

### Public GET API

Create or add to `app/routes/api/{entity}.ts`:

```tsx
import { createServerFn } from "@tanstack/start";
import { json } from "@tanstack/start";
import { createSupabaseServerClient } from "~/lib/supabase/server";
import { z } from "zod";

// Input validation schema (optional)
const GetItemsInput = z.object({
  category: z.string().optional(),
  limit: z.number().min(1).max(100).default(10),
  offset: z.number().min(0).default(0),
});

export const getItems = createServerFn(
  "GET",
  async (input?: z.infer<typeof GetItemsInput>) => {
    // Parse and validate input
    const params = GetItemsInput.parse(input ?? {});

    const supabase = createSupabaseServerClient();

    let query = supabase
      .from("items")
      .select("*", { count: "exact" })
      .eq("is_visible", true)
      .order("display_order", { ascending: true })
      .range(params.offset, params.offset + params.limit - 1);

    if (params.category) {
      query = query.eq("category", params.category);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error("Failed to fetch items");
    }

    return {
      items: data,
      total: count ?? 0,
      hasMore: (count ?? 0) > params.offset + params.limit,
    };
  }
);

// Get single item by slug
export const getItemBySlug = createServerFn("GET", async (slug: string) => {
  if (!slug) {
    throw new Error("Slug is required");
  }

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("slug", slug)
    .eq("is_visible", true)
    .single();

  if (error || !data) {
    throw new Error("Item not found");
  }

  return data;
});
```

---

### Public POST API (Form Submission)

```tsx
import { createServerFn } from "@tanstack/start";
import { createSupabaseServerClient } from "~/lib/supabase/server";
import { z } from "zod";

// Validation schema
const ContactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(20, "Message must be at least 20 characters"),
});

export const submitContactForm = createServerFn(
  "POST",
  async (formData: FormData) => {
    // Parse form data
    const rawData = {
      name: formData.get("name"),
      email: formData.get("email"),
      subject: formData.get("subject"),
      message: formData.get("message"),
    };

    // Validate
    const result = ContactFormSchema.safeParse(rawData);

    if (!result.success) {
      return {
        success: false,
        errors: result.error.flatten().fieldErrors,
      };
    }

    const supabase = createSupabaseServerClient();

    // Insert into database
    const { error } = await supabase
      .from("contact_submissions")
      .insert(result.data);

    if (error) {
      console.error("Contact form error:", error);
      return {
        success: false,
        errors: { _form: ["Failed to submit. Please try again."] },
      };
    }

    // TODO: Send email notification via Resend

    return { success: true };
  }
);
```

---

### Admin API (Protected)

```tsx
import { createServerFn } from "@tanstack/start";
import { createSupabaseServerClient } from "~/lib/supabase/server";
import { redirect } from "@tanstack/react-router";
import { z } from "zod";

// Helper to check admin auth
async function requireAdmin() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    throw redirect({ to: "/admin/login" });
  }

  return user;
}

// Admin: Get all items (including hidden)
export const adminGetItems = createServerFn("GET", async () => {
  await requireAdmin();

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("items")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) throw new Error("Failed to fetch items");

  return data;
});

// Admin: Create item
const CreateItemSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  is_visible: z.boolean().default(true),
});

export const adminCreateItem = createServerFn(
  "POST",
  async (input: z.infer<typeof CreateItemSchema>) => {
    await requireAdmin();

    const data = CreateItemSchema.parse(input);
    const supabase = createSupabaseServerClient();

    const { data: created, error } = await supabase
      .from("items")
      .insert(data)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error("An item with this slug already exists");
      }
      throw new Error("Failed to create item");
    }

    return created;
  }
);

// Admin: Update item
export const adminUpdateItem = createServerFn(
  "POST",
  async ({
    id,
    data,
  }: {
    id: string;
    data: Partial<z.infer<typeof CreateItemSchema>>;
  }) => {
    await requireAdmin();

    const supabase = createSupabaseServerClient();

    const { data: updated, error } = await supabase
      .from("items")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error("Failed to update item");

    return updated;
  }
);

// Admin: Delete item
export const adminDeleteItem = createServerFn("POST", async (id: string) => {
  await requireAdmin();

  const supabase = createSupabaseServerClient();

  const { error } = await supabase.from("items").delete().eq("id", id);

  if (error) throw new Error("Failed to delete item");

  return { success: true };
});

// Admin: Reorder items
export const adminReorderItems = createServerFn(
  "POST",
  async (orderedIds: string[]) => {
    await requireAdmin();

    const supabase = createSupabaseServerClient();

    // Update display_order for each item
    const updates = orderedIds.map((id, index) =>
      supabase.from("items").update({ display_order: index }).eq("id", id)
    );

    await Promise.all(updates);

    return { success: true };
  }
);
```

---

## Step 3: Use Server Functions in Components

```tsx
import { useServerFn } from '@tanstack/start';
import { getItems, submitContactForm } from '~/routes/api/items';

function MyComponent() {
  const getItemsFn = useServerFn(getItems);
  const submitFormFn = useServerFn(submitContactForm);

  const handleSubmit = async (formData: FormData) => {
    const result = await submitFormFn(formData);
    if (result.success) {
      // Handle success
    } else {
      // Handle errors
    }
  };

  return (/* ... */);
}
```

---

## Step 4: Add Zod for Validation (if not installed)

```bash
pnpm add zod
```

---

## Error Handling Best Practices

```typescript
// Create standardized error responses
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

// Use in server functions
export const myServerFn = createServerFn(
  "POST",
  async (input): Promise<ApiResponse<Data>> => {
    try {
      // ... operation
      return { success: true, data: result };
    } catch (error) {
      console.error("Operation failed:", error);
      return {
        success: false,
        error: "Operation failed",
        code: "OPERATION_FAILED",
      };
    }
  }
);
```

---

## Checklist

- [ ] Input validation with Zod
- [ ] Proper error handling
- [ ] Admin routes protected
- [ ] TypeScript types exported
- [ ] Tested locally
