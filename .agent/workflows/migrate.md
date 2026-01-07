---
description: Update Convex schema and deploy changes
---

# Schema Migration Workflow

This workflow updates the Convex schema and deploys changes to your self-hosted backend.

---

## Step 1: Identify Required Changes

Determine what schema changes are needed:

- New table
- New fields on existing table
- New indexes
- Modified validators

---

## Step 2: Update Schema File

Edit `convex/schema.ts`:

### Adding a New Table

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ... existing tables

  // New table
  newTable: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    displayOrder: v.number(),
    isVisible: v.boolean(),
  })
    .index("by_slug", ["slug"])
    .index("by_category", ["category"])
    .index("by_order", ["displayOrder"]),
});
```

### Adding Fields to Existing Table

```typescript
// Just add the new field to the table definition
existingTable: defineTable({
  // ... existing fields
  newField: v.optional(v.string()),  // Make optional for backwards compatibility
})
```

### Adding an Index

```typescript
existingTable: defineTable({
  // ... fields
})
  .index("existing_index", ["existingField"])
  .index("new_index", ["newField"])  // Add new index
```

---

## Step 3: Deploy Schema Changes

Deploy to your self-hosted Convex backend:

```bash
# turbo
npx convex dev --once
```

This will:
1. Validate the schema
2. Create new tables/indexes
3. Regenerate TypeScript types in `convex/_generated/`

---

## Step 4: Verify Deployment

Check the output for:
- ✓ Schema changes applied
- ✓ Indexes created
- ✓ No errors

Example success output:
```
✔ Added table indexes:
  [+] newTable.by_slug   slug
  [+] newTable.by_order  displayOrder
✔ Convex functions ready!
```

---

## Step 5: Create Queries/Mutations

If you added a new table, create the corresponding API file:

```typescript
// convex/newTable.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

export const listVisible = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("newTable")
      .withIndex("by_order")
      .filter((q) => q.eq(q.field("isVisible"), true))
      .collect();
  },
});

// ... add more queries/mutations as needed
```

---

## Step 6: Run Quality Checks

```bash
# turbo
pnpm type-check
```

Ensure TypeScript passes with the new schema types.

---

## Schema Best Practices

### Field Naming
- Use camelCase: `displayOrder`, `isVisible`, `createdAt`
- Be descriptive: `thumbnailUrl` not `thumb`

### Indexes
- Add indexes for fields you query/filter by
- Index order matters for compound indexes
- Common patterns:
  - `by_slug` for URL lookups
  - `by_order` for sorting
  - `by_category` for filtering

### Optional Fields
- Use `v.optional()` for nullable fields
- New fields should usually be optional for backwards compatibility

### Document References
- Use `v.id("tableName")` for foreign key-like references
- Example: `categoryId: v.id("blogCategories")`

---

## Common Validators

```typescript
v.string()                  // Required string
v.optional(v.string())      // Optional string
v.number()                  // Number
v.boolean()                 // Boolean
v.id("tableName")           // Document ID reference
v.array(v.string())         // Array of strings
v.array(v.id("tags"))       // Array of document IDs
v.union(                    // Enum
  v.literal("draft"),
  v.literal("published")
)
v.any()                     // Any type (avoid if possible)
```

---

## Rollback (if needed)

Convex doesn't have traditional "down" migrations. To rollback:

1. Revert schema changes in `convex/schema.ts`
2. Deploy again: `npx convex dev --once`

> ⚠️ Removing fields/tables may cause data loss. Be careful in production.

---

## Checklist

- [ ] Schema updated in `convex/schema.ts`
- [ ] Indexes added for queried fields
- [ ] `npx convex dev --once` succeeds
- [ ] TypeScript types regenerated
- [ ] `pnpm type-check` passes
- [ ] Queries/mutations created for new tables
