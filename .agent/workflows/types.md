---
description: Generate Supabase TypeScript types and sync with project
---

# Generate Types Workflow

This workflow generates TypeScript types from Supabase and syncs them with the project.

---

## Step 1: Get Project ID

List Supabase projects:

```
mcp_supabase-mcp-server_list_projects
```

Note the project ID.

---

## Step 2: Generate Types from Supabase

Use the Supabase MCP tool:

```
mcp_supabase-mcp-server_generate_typescript_types
  project_id: "your-project-id"
```

This returns the TypeScript type definitions for all tables and views.

---

## Step 3: Save Generated Types

Save the output to `app/lib/supabase/database.types.ts`:

```typescript
// This file is auto-generated. Do not edit manually.
// Generated from Supabase schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      skills: {
        Row: {
          id: string;
          name: string;
          category: string;
          icon: string | null;
          proficiency: number | null;
          years_of_experience: number | null;
          description: string | null;
          display_order: number;
          is_visible: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          // ... insert types
        };
        Update: {
          // ... update types
        };
      };
      // ... other tables
    };
    Views: {
      // ...
    };
    Functions: {
      // ...
    };
    Enums: {
      // ...
    };
  };
}
```

---

## Step 4: Create Type Aliases

Create or update `app/types/index.ts` with convenient type aliases:

```typescript
import type { Database } from "~/lib/supabase/database.types";

// Table row types
export type Skill = Database["public"]["Tables"]["skills"]["Row"];
export type SkillInsert = Database["public"]["Tables"]["skills"]["Insert"];
export type SkillUpdate = Database["public"]["Tables"]["skills"]["Update"];

export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
export type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];

export type BlogPost = Database["public"]["Tables"]["blog_posts"]["Row"];
export type BlogPostInsert =
  Database["public"]["Tables"]["blog_posts"]["Insert"];
export type BlogPostUpdate =
  Database["public"]["Tables"]["blog_posts"]["Update"];

export type BlogCategory =
  Database["public"]["Tables"]["blog_categories"]["Row"];
export type BlogTag = Database["public"]["Tables"]["blog_tags"]["Row"];

export type UsesItem = Database["public"]["Tables"]["uses_items"]["Row"];

export type ResumeProfile =
  Database["public"]["Tables"]["resume_profile"]["Row"];
export type WorkExperience =
  Database["public"]["Tables"]["work_experiences"]["Row"];
export type Education = Database["public"]["Tables"]["education"]["Row"];
export type Certification =
  Database["public"]["Tables"]["certifications"]["Row"];

export type ContactSubmission =
  Database["public"]["Tables"]["contact_submissions"]["Row"];
export type MediaFile = Database["public"]["Tables"]["media_files"]["Row"];
export type SiteSetting = Database["public"]["Tables"]["site_settings"]["Row"];

// Re-export database type for Supabase client
export type { Database };
```

---

## Step 5: Update Supabase Client Types

Ensure the Supabase client uses the types. Update `app/lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

export function createSupabaseClient() {
  return createBrowserClient<Database>(
    process.env.PUBLIC_SUPABASE_URL!,
    process.env.PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

Update `app/lib/supabase/server.ts`:

```typescript
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./database.types";

export function createSupabaseServerClient() {
  return createServerClient<Database>(
    process.env.PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        // cookie handling...
      },
    }
  );
}
```

---

## Step 6: Verify Types

Run TypeScript to verify types work:

```bash
# turbo
pnpm tsc --noEmit
```

---

## Step 7: Test Type Usage

Verify types work in components:

```typescript
import type { Skill, Project } from "~/types";

// Should have proper autocomplete and type checking
const skill: Skill = {
  id: "uuid",
  name: "TypeScript",
  category: "frontend",
  // ... all fields should be type-checked
};
```

---

## When to Regenerate Types

Run this workflow after:

- Creating new tables
- Adding/removing columns
- Changing column types
- Modifying constraints
- Adding new views or functions

---

## Automation (Optional)

Add a script to `package.json`:

```json
{
  "scripts": {
    "generate-types": "supabase gen types typescript --project-id your-project-id > app/lib/supabase/database.types.ts"
  }
}
```

Note: This requires the Supabase CLI installed and authenticated.

---

## Checklist

- [ ] Types generated from Supabase
- [ ] Types saved to `app/lib/supabase/database.types.ts`
- [ ] Type aliases created in `app/types/index.ts`
- [ ] Supabase clients typed
- [ ] TypeScript check passes
- [ ] IDE autocomplete working
