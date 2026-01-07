# AI Agent Configuration

This directory contains workspace-based rules and workflows for AI coding agents working on this portfolio project.

## Directory Structure

```
.agent/
├── rules/
│   └── project-rules.md    # Project-specific coding guidelines
└── workflows/
    ├── setup.md            # /setup - Initialize project
    ├── component.md        # /component - Create components
    ├── page.md             # /page - Create public pages
    ├── admin-page.md       # /admin-page - Create admin pages
    ├── migrate.md          # /migrate - Schema migrations
    ├── api.md              # /api - Create Convex queries/mutations
    ├── check.md            # /check - Run quality checks
    └── types.md            # /types - Generate TypeScript types
```

## Rules

The rules in `rules/project-rules.md` define consistent behavior for the AI agent:

| Category          | Description                                         |
| ----------------- | --------------------------------------------------- |
| Technology Stack  | TanStack Start, Self-Hosted Convex, Cloudflare R2   |
| Design System     | Ubuntu Terminal theme specifications                |
| Code Architecture | Project structure and TypeScript requirements       |
| Development       | pnpm, environment variables, code quality           |
| SEO & Performance | Meta tags, Lighthouse targets                       |
| Admin/CMS         | Convex Auth, CRUD patterns                          |
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
| `/migrate`    | `migrate.md`    | Update Convex schema and deploy changes                 |
| `/api`        | `api.md`        | Create Convex queries and mutations                     |
| `/check`      | `check.md`      | Run TypeScript, lint, and build checks                  |
| `/types`      | `types.md`      | Regenerate Convex TypeScript types                      |

## Usage

1. **Following Rules**: The AI agent automatically reads and follows `project-rules.md` when working on this project.

2. **Running Workflows**: Use slash commands like `/setup` to trigger specific workflows.

3. **Customization**: Edit the markdown files to modify rules or workflow steps.

## Integration with Context7

The rules specify using Context7 MCP for documentation lookup. The agent will automatically query:

- TanStack Start docs
- Convex docs
- Other library documentation

## Integration with Convex

Database operations use Convex:

- Schema defined in `convex/schema.ts`
- Queries and mutations in `convex/*.ts`
- Deploy with `npx convex dev --once`
- Types auto-generated in `convex/_generated/`

## Tech Stack Summary

| Layer      | Technology                        |
| ---------- | --------------------------------- |
| Frontend   | TanStack Start, React 19, TypeScript |
| Backend    | Self-Hosted Convex                |
| Auth       | Convex Auth (Password provider)   |
| Database   | Convex (PostgreSQL backend)       |
| Storage    | Cloudflare R2                     |
| Deployment | Docker, Coolify                   |
