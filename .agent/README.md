# AI Agent Configuration

This directory contains workspace-based rules and workflows for AI coding agents working on this portfolio project.

## Directory Structure

```
agent/
├── rules/
│   └── project-rules.md    # Project-specific coding guidelines
└── workflows/
    ├── setup.md            # /setup - Initialize project
    ├── component.md        # /component - Create components
    ├── page.md             # /page - Create public pages
    ├── admin-page.md       # /admin-page - Create admin pages
    ├── migrate.md          # /migrate - Database migrations
    ├── deploy.md           # /deploy - Deploy to Coolify
    ├── api.md              # /api - Create API routes
    ├── check.md            # /check - Run quality checks
    └── types.md            # /types - Generate TypeScript types
```

## Rules

The rules in `rules/project-rules.md` define consistent behavior for the AI agent:

| Category          | Description                                         |
| ----------------- | --------------------------------------------------- |
| Technology Stack  | TanStack Start, Supabase, Cloudflare R2 conventions |
| Design System     | Ubuntu Terminal theme specifications                |
| Code Architecture | Project structure and TypeScript requirements       |
| Development       | pnpm, environment variables, code quality           |
| SEO & Performance | Meta tags, Lighthouse targets                       |
| Admin/CMS         | Authentication, CRUD patterns                       |
| Deployment        | Docker, Coolify configuration                       |
| Documentation     | PRD updates, code comments                          |

## Workflows

Workflows are invoked using slash commands:

| Command       | File            | Description                                             |
| ------------- | --------------- | ------------------------------------------------------- |
| `/setup`      | `setup.md`      | Initialize TanStack Start project with all dependencies |
| `/component`  | `component.md`  | Create a new component (ui/feature/layout)              |
| `/page`       | `page.md`       | Create a public page with SSR and SEO                   |
| `/admin-page` | `admin-page.md` | Create a protected admin page with CRUD                 |
| `/migrate`    | `migrate.md`    | Create and apply Supabase migrations                    |
| `/deploy`     | `deploy.md`     | Build and deploy to Coolify                             |
| `/api`        | `api.md`        | Create TanStack Start server functions                  |
| `/check`      | `check.md`      | Run TypeScript, lint, and build checks                  |
| `/types`      | `types.md`      | Generate Supabase TypeScript types                      |

## Usage

1. **Following Rules**: The AI agent automatically reads and follows `project-rules.md` when working on this project.

2. **Running Workflows**: Use slash commands like `/setup` to trigger specific workflows.

3. **Customization**: Edit the markdown files to modify rules or workflow steps.

## Integration with Context7

The rules specify using Context7 MCP for documentation lookup. The agent will automatically query:

- TanStack Start docs
- Supabase docs
- Other library documentation

## Integration with Supabase MCP

Database operations use Supabase MCP tools:

- `mcp_supabase-mcp-server_apply_migration`
- `mcp_supabase-mcp-server_execute_sql`
- `mcp_supabase-mcp-server_generate_typescript_types`
- `mcp_supabase-mcp-server_get_advisors`
