---
description: Regenerate Convex TypeScript types after schema changes
---

# Generate Types Workflow

This workflow regenerates TypeScript types from your Convex schema.

---

## When to Run This

Run this workflow after:

- Modifying `convex/schema.ts`
- Adding new tables or fields
- Changing field types
- Adding new queries/mutations

---

## Step 1: Deploy and Generate Types

Run the Convex dev command:

```bash
# turbo
npx convex dev --once
```

This will:
1. Validate your schema
2. Deploy functions to your self-hosted backend
3. Generate types in `convex/_generated/`

---

## Step 2: Verify Generated Types

Check that types were generated:

```
convex/_generated/
├── api.d.ts      # API function types
├── api.js        # API exports
├── dataModel.d.ts # Table/document types
├── server.d.ts   # Server-side types
└── server.js     # Server exports
```

---

## Step 3: Using Generated Types

### In Convex Functions

```typescript
// Types are automatically inferred from schema
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    // ctx.db is fully typed
    return await ctx.db.query("skills").collect();
  },
});
```

### In React Components

```typescript
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";

// Document type for a table
type Skill = Doc<"skills">;

// ID type for a table
type SkillId = Id<"skills">;

// Using with queries
const { data } = useSuspenseQuery(convexQuery(api.skills.listVisible, {}));
// data is automatically typed as Skill[]
```

---

## Step 4: Create Type Aliases (Optional)

For convenience, create type aliases in `src/types/index.ts`:

```typescript
import type { Doc, Id } from "../../convex/_generated/dataModel";

// Document types
export type Skill = Doc<"skills">;
export type Project = Doc<"projects">;
export type BlogPost = Doc<"blogPosts">;
export type BlogCategory = Doc<"blogCategories">;
export type BlogTag = Doc<"blogTags">;
export type UsesItem = Doc<"usesItems">;
export type ResumeProfile = Doc<"resumeProfile">;
export type WorkExperience = Doc<"workExperiences">;
export type Education = Doc<"education">;
export type Certification = Doc<"certifications">;
export type ContactSubmission = Doc<"contactSubmissions">;
export type MediaFile = Doc<"mediaFiles">;
export type SiteSetting = Doc<"siteSettings">;

// ID types
export type SkillId = Id<"skills">;
export type ProjectId = Id<"projects">;
export type BlogPostId = Id<"blogPosts">;
// ... etc

// Re-export for convenience
export type { Doc, Id } from "../../convex/_generated/dataModel";
```

---

## Step 5: Verify Types Work

Run TypeScript check:

```bash
# turbo
pnpm type-check
```

Test autocomplete in your IDE by using the types.

---

## Common Type Patterns

### Working with Document IDs

```typescript
import { Id } from "../../convex/_generated/dataModel";

// Function that takes a skill ID
function editSkill(id: Id<"skills">) {
  // ...
}

// Converting string to ID (from URL params)
const skillId = params.id as Id<"skills">;
```

### Working with Optional Fields

```typescript
type Skill = Doc<"skills">;

// All fields from schema are properly typed
const skill: Skill = {
  _id: "...",
  _creationTime: 123456,
  name: "TypeScript",
  category: "frontend",
  proficiency: 90,
  yearsOfExperience: 5,  // optional in schema
  description: undefined, // optional fields can be undefined
  displayOrder: 1,
  isVisible: true,
};
```

### Extracting Insert/Update Types

```typescript
import type { Doc } from "../../convex/_generated/dataModel";

// Type for creating a new skill (without system fields)
type SkillInput = Omit<Doc<"skills">, "_id" | "_creationTime">;

// Type for updating a skill (all fields optional)
type SkillUpdate = Partial<SkillInput>;
```

---

## Troubleshooting

### Types not updating?

1. Make sure `npx convex dev --once` completed successfully
2. Check for errors in the convex output
3. Restart your TypeScript language server (VS Code: Cmd/Ctrl+Shift+P → "Restart TS Server")

### Import errors?

Make sure you're importing from the correct path:
- Convex functions: `"./_generated/server"`
- React components: `"../../convex/_generated/api"` (adjust path as needed)

---

## Checklist

- [ ] `npx convex dev --once` ran successfully
- [ ] Types generated in `convex/_generated/`
- [ ] `pnpm type-check` passes
- [ ] IDE autocomplete working
- [ ] Type aliases created (optional)
