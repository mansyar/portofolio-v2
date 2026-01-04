---
description: Create and apply Supabase database migrations with RLS policies
---

# Database Migration Workflow

This workflow creates and applies database migrations to Supabase using the MCP tools.

---

## Step 1: Identify Required Changes

Determine what schema changes are needed:

- New table
- New columns on existing table
- Indexes
- RLS policies
- Functions/triggers

---

## Step 2: Get Project ID

List Supabase projects to get the project ID:

```
mcp_supabase-mcp-server_list_projects
```

Note the `id` field for your portfolio project.

---

## Step 3: Review Existing Schema

Check current tables:

```
mcp_supabase-mcp-server_list_tables with project_id
```

Check existing migrations:

```
mcp_supabase-mcp-server_list_migrations with project_id
```

---

## Step 4: Write Migration SQL

Create the migration SQL following these conventions:

### For New Tables

```sql
-- Create table
CREATE TABLE table_name (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- columns...
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_table_name_column ON table_name(column);

-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Public read policy (if applicable)
CREATE POLICY "Public can read visible items" ON table_name
  FOR SELECT USING (is_visible = true);

-- Admin write policy
CREATE POLICY "Admin full access" ON table_name
  FOR ALL USING (auth.jwt() ->> 'email' = current_setting('app.admin_email', true));
```

### For Altering Tables

```sql
-- Add column
ALTER TABLE table_name ADD COLUMN new_column VARCHAR(255);

-- Add constraint
ALTER TABLE table_name ADD CONSTRAINT constraint_name CHECK (condition);
```

---

## Step 5: Apply Migration

Use the Supabase MCP tool:

```
mcp_supabase-mcp-server_apply_migration
  project_id: "your-project-id"
  name: "descriptive_migration_name"
  query: "SQL migration content"
```

Migration name should be snake_case and descriptive, e.g.:

- `create_skills_table`
- `add_featured_to_projects`
- `create_blog_post_tags_junction`

---

## Step 6: Run Security Advisor

Check for security issues after applying migration:

```
mcp_supabase-mcp-server_get_advisors
  project_id: "your-project-id"
  type: "security"
```

Address any warnings, especially:

- Missing RLS policies
- Overly permissive policies
- Exposed sensitive columns

---

## Step 7: Run Performance Advisor

Check for performance issues:

```
mcp_supabase-mcp-server_get_advisors
  project_id: "your-project-id"
  type: "performance"
```

Address any warnings about:

- Missing indexes
- Inefficient queries
- Table bloat

---

## Step 8: Generate TypeScript Types

Update TypeScript types to match new schema:

```
mcp_supabase-mcp-server_generate_typescript_types
  project_id: "your-project-id"
```

Copy the generated types to `app/lib/supabase/types.ts`.

---

## Step 9: Update Application Types

Update `app/types/index.ts` to export the new types:

```typescript
// Re-export database types
export type { Database } from "~/lib/supabase/types";

// Create convenience type aliases
export type Skill = Database["public"]["Tables"]["skills"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
// ... etc
```

---

## Step 10: Test Migration

Verify the migration worked:

```
mcp_supabase-mcp-server_execute_sql
  project_id: "your-project-id"
  query: "SELECT * FROM table_name LIMIT 5;"
```

---

## Migration Checklist

- [ ] Migration applied successfully
- [ ] RLS policies created
- [ ] Security advisor passed
- [ ] Performance advisor passed
- [ ] TypeScript types generated
- [ ] Application types updated
- [ ] Tested locally

---

## Rollback (if needed)

If migration fails, create a reverse migration:

```
mcp_supabase-mcp-server_apply_migration
  name: "rollback_migration_name"
  query: "DROP TABLE table_name; -- or ALTER TABLE to reverse changes"
```

> ⚠️ Be careful with rollbacks in production - they may cause data loss.
