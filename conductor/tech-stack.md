# Technology Stack — Ansyar's Portfolio

Full-stack SSR web application. Single package (not a monorepo), TypeScript end to end,
self-hosted backend and deployment.

> **This document distinguishes current repository state from the agreed target state.**
> Where they differ, both are listed. Nothing in the repository has been changed by
> Conductor setup — the target state is reached through tracks.

## Languages and Runtimes

| Item | Current | Target |
| --- | --- | --- |
| Language | TypeScript 5.7 (strict, `noEmit` typecheck) | TypeScript 7 (native compiler) |
| UI runtime | React 19.2 with React DOM | React 19.x (latest 19) |
| Server runtime | Node 20 — Dockerfile `node:20-alpine`, CI `node-version: 20` | **Node 24 everywhere** |
| Package manager | pnpm — Dockerfile pins `pnpm@10.1.0`, CI pins 10, local 12.4.1 | pnpm 12, pinned via `packageManager` |
| Module system | ESM (`"type": "module"`) | ESM |

**Runtime drift is a known, accepted gap.** The decision is that Node 24 is canonical.
The Dockerfile and CI workflow still pin Node 20 and pnpm 10; bringing them in line,
adding `.nvmrc` and a `packageManager` field, is pending migration work.

## Frameworks and Major Libraries

| Layer | Choice |
| --- | --- |
| Full-stack framework | TanStack Start 1.132 (SSR via Vite plugin + Nitro server) |
| Routing | TanStack Router 1.132, file-based under `src/routes/`; `routeTree.gen.ts` is generated |
| Server state | TanStack Query 5.90 via `@convex-dev/react-query`, `useSuspenseQuery` + `convexQuery` |
| Backend | Convex 1.31 (self-hosted) — reactive DB, queries/mutations/actions, scheduler, file storage |
| Auth | Convex Auth 0.0.90 (`@convex-dev/auth`), JWT via `JWT_PRIVATE_KEY` + `JWKS` |
| Styling | **Tailwind CSS 4 is authoritative**; CSS custom properties in `variables.css` supply the design tokens Tailwind consumes, and co-located `*.css` files remain for what Tailwind cannot express (keyframes, terminal chrome) |
| Component primitives | Local, hand-built (`src/components/ui/`); `clsx` + `tailwind-merge`; `lucide-react` and `react-icons` icons |
| Rich text | Tiptap 3 (StarterKit, Link, Image, CodeBlockLowlight) for authoring; `react-markdown` + `remark-gfm` for rendering |
| PDF | `@react-pdf/renderer` 4.3 — resume generated from CMS data |
| Validation | Convex validators server-side, Zod 4 client-side |
| Sanitization | `isomorphic-dompurify` |
| Dates | `date-fns` 4 |
| Images | `sharp` 0.34 (server-side processing), local `optimized-image.tsx` |
| Toasts | `sonner` |

### Styling rule for new work

Tailwind is the first tool. Use utility classes in JSX for layout, spacing, typography,
and state variants. Reach for a co-located `.css` file only when:

1. The rule cannot be expressed as a utility (keyframes, `::before` terminal chrome,
   complex `[data-*]` selectors), or
2. A token must be defined or overridden (`variables.css`).

Never hardcode a color that already exists as a CSS custom property. The README's
"Vanilla CSS + CSS Variables" line describes the design-token layer, not a ban on
Tailwind.

## Package Manager and Build Tooling

- **pnpm**, lockfile committed (`pnpm-lock.yaml`). CI installs with
  `--frozen-lockfile`.
- **Vite 7** is the build engine; TanStack Start and Nitro are Vite plugins.
- **Path aliases** via `vite-tsconfig-paths` reading `tsconfig.json`.
- **Nitro is pinned to `"latest"`** — a reproducibility risk, documented below.

### Commands

| Purpose | Command | Notes |
| --- | --- | --- |
| Dev server (port 3000) | `pnpm dev` | `vite dev --port 3000` |
| Production build | `pnpm build` | `vite build` |
| Preview built output | `pnpm preview` | — |
| Unit tests | `pnpm test` | `vitest run` |
| Coverage | `pnpm test:coverage` | **To be added** — see Lint/Format below |
| Lint | `pnpm lint` | `eslint .` |
| Format | `pnpm format` | **To be added** |
| Typecheck | `pnpm type-check` | `tsc --noEmit` |
| Convex schema push (dev) | `npx convex dev --once` | No npm script wrapper today |
| Convex deploy (prod) | `pnpm exec convex deploy` | Run by CI only |

## Data Stores and Schemas

Single Convex deployment, 16 tables declared in `convex/schema.ts`:
`skills`, `projects`, `blogCategories`, `blogTags`, `blogPosts`, `usesItems`,
`resumeProfile`, `workExperiences`, `education`, `certifications`,
`contactSubmissions`, `rateLimits`, `siteSettings`, `activityLogs`, `mediaFiles`,
`newsletterSubscribers`.

- Supporting Postgres storage is provisioned by self-hosted Convex on Coolify.
- Indexes are declared per table in the schema; queries use named indexes
  (e.g. `by_email`, `by_identifier_action`) instead of table scans.
- `rateLimits` implements contact-form rate limiting in the database, not in memory.
- Media binaries live in Convex File Storage, backed by Cloudflare R2.
- Generated artifacts under `convex/_generated/` are **committed** and lint-ignored.
  They must never be hand-edited; `convex dev`/`convex deploy` regenerate them.

## External Services and APIs

| Service | Use | Required for |
| --- | --- | --- |
| Self-hosted Convex | DB, functions, storage, auth | Everything |
| Cloudflare R2 | Object storage behind Convex File Storage | Media |
| Umami (self-hosted) | Analytics; `VITE_UMAMI_*` client-side, `UMAMI_*` for Convex actions | Dashboard widget |
| Resend | Newsletter welcome email | Notifications |
| Slack incoming webhook | Contact-form notifications | Notifications |
| Giscus (GitHub Discussions) | Blog comments | Comments |
| Coolify | Deployment target and webhook trigger | Deploys |

## Hosting and Deployment Target

`ansyar-world.top` on a self-hosted VPS behind Coolify/Nginx.

- Multi-stage Docker build (`docker/Dockerfile`): `base` → `deps` → `builder` →
  `runner`, running as a non-root user, with a `/health` HTTP healthcheck and
  `CMD node .output/server/index.mjs`.
- Image published to Docker Hub as `<user>/portfolio-v2:latest` and `:sha`.
- `docker/docker-compose.yml` runs the app on port 3000 with `NODE_ENV=production`.
- CI (`.github/workflows/deploy.yml`) runs three stages on push to `main`:
  **test** (typecheck → lint → test) → **build-and-push** (Dockerfile, GitHub Actions
  layer cache) → **deploy** (`convex deploy` for the schema, then a Coolify webhook).

## Test, Coverage, Lint, Format, and Typecheck Tooling

| Concern | Current | Target |
| --- | --- | --- |
| Unit/component tests | Vitest 3, jsdom, Testing Library, `@testing-library/jest-dom` | keep Vitest |
| Test setup | `vitest.setup.tsx`; SSR plugins disabled under test to avoid hanging processes; `pool: 'forks'` with a short teardown timeout | keep |
| Coverage | **none installed** | `@vitest/coverage-v8` + `test:coverage` script |
| Lint | ESLint 9 flat config: `typescript-eslint`, `react-hooks`, `react-refresh`; `no-explicit-any` = **error** | **Biome** |
| Format | Prettier 3.7 configured, but **no script** and `.prettierrc` names an uninstalled plugin | **Biome** |
| Typecheck | `tsc --noEmit` | **TypeScript 7 (`tsgo`)** |

Test locations: `convex/__tests__/*.test.ts` for backend logic and
`src/**/__tests__/*.test.tsx` for components and utilities.

### Coverage policy

Add `@vitest/coverage-v8` with a `test:coverage` script and start the gate low and
honest. Suggested starting point: **40% lines / 40% functions**, measured over
`src/` and `convex/`, excluding `convex/_generated/` and `src/routeTree.gen.ts`.
Raise the threshold as tracks add tests; never lower it to make a phase pass.

## Planned Modernization

These are agreed directions, not completed work. Each should become its own track, and
each needs verification before adoption — the notes below record what must be checked.

| Change | From | To | Verification required |
| --- | --- | --- | --- |
| Toolchain consolidation | ESLint 9 + Prettier 3.7 | Biome | Confirm Biome covers `no-explicit-any`, the `react-hooks` rules in use, import ordering, and `ignores` for generated files. Keep a lint rule set at least as strict as today. |
| Typecheck | `tsc` 5.7 | TypeScript 7 native compiler | Confirm TanStack Start, Convex codegen, and `vite-tsconfig-paths` typecheck cleanly; keep both paths available until parity is proven. |
| Runtime | Node 20 (Dockerfile + CI) | Node 24 | Update `node:20-alpine` → a Node 24 base, CI `node-version`, add `.nvmrc`, add `packageManager` to `package.json`. Re-verify the healthcheck and `.output/server/index.mjs` boot. |
| Dependency freshness | mixed | current majors | Bump in reviewable groups, not one sweeping commit. |
| Reproducibility | `"nitro": "latest"` | pinned semver | Pin once the current resolved version is confirmed building. |

A sensible order: **Node 24 → Biome → dependency refresh → TypeScript 7**, since each
later step is easier to validate on a green baseline. TypeScript 7 goes last because it
touches every file's type surface.

## Local Development Environment

1. `pnpm install`
2. `cp .env.example .env.local` and fill in values
3. `npx convex dev --once` to push the schema to the self-hosted backend
4. `pnpm dev` → `http://localhost:3000`

No containers are needed for local development; Docker is deployment-only.
`.env.local` holds secrets and is git-ignored. Public variables carry the `VITE_`
prefix and are inlined at build time — never put a secret behind that prefix.

Required variables: `VITE_APP_URL`, `VITE_CONVEX_URL`, `CONVEX_SELF_HOSTED_URL`,
`CONVEX_SELF_HOSTED_ADMIN_KEY`, `CONVEX_SITE_URL`, `JWT_PRIVATE_KEY`, `JWKS`,
`ADMIN_EMAIL`, `VITE_UMAMI_URL`, `VITE_UMAMI_WEBSITE_ID`. Optional:
`SLACK_WEBHOOK_URL`, `RESEND_API_KEY`, plus Convex-side `UMAMI_*`.

## Constraints

- **Self-hosting is load-bearing.** Convex, R2, Umami, and Coolify are all
  owner-operated. There is no managed fallback for any of them.
- **No `any`.** Enforced at error level today by ESLint; the Biome migration must
  preserve this as an error, not a warning.
- **Committed generated code.** `convex/_generated/` and `src/routeTree.gen.ts` are
  tracked, so CI typechecks without a codegen step — but they must never be edited by
  hand.
- **Tight coupling to framework idioms.** Server state goes through `convexQuery` and
  `useSuspenseQuery`; mutations go through Convex React hooks wrapped by
  `use-toast-mutation`. Deviating breaks the SSR + reactivity model.
- **Single package, no workspace.** Do not introduce a monorepo without a product-level
  decision.

## Rejected Alternatives and Why

| Alternative | Rejected because |
| --- | --- |
| Supabase (the previous stack) | Migrated away — see `docs/PRD.md` §14. Convex's reactive queries and colocated functions were preferred. |
| A hosted headless CMS (Contentful, Sanity, etc.) | Defeats the goal of demonstrating a self-built CMS and introduces a SaaS dependency. |
| Managed Convex Cloud | Self-hosting is itself part of the skill showcase. |
| Tailwind-only, tokens deleted | The terminal aesthetic depends on CSS custom properties for theming; tokens stay, Tailwind consumes them. |
| Full component-library adoption (Radix/shadcn wholesale) | Primitives are hand-built to keep the visual identity distinctive. |
| ESLint + Prettier long term | Two tools, two configs, duplicated ignores; Biome consolidates lint and format. |

## Upgrade and Maintenance Policy

- **Reactive, not scheduled.** Dependencies are bumped when work touches them. There is
  no Renovate/Dependabot configuration; adding one is an open question.
- **Modernization is planned and staged**, per the Planned Modernization table above —
  not incidental. Each step lands as its own track with verification.
- **Convex schema changes** ship through `convex deploy` in the CI deploy stage; there is
  no manual production migration path.
- **Breaking upgrades require a green baseline first.** Verify with
  `pnpm type-check; pnpm lint; pnpm test; pnpm build` before and after.

## Open Questions & Assumptions

**Open questions**

1. **Automated dependency updates.** No Renovate or Dependabot config exists. Should
   one be added, and at what cadence?
2. **Coverage threshold trajectory.** The 40% starting gate is a placeholder. What is
   the intended destination, and should it apply to new code only (changed lines) rather
   than the whole project?
3. **TypeScript 7 readiness.** The native compiler's support for TanStack Start's
   generated types and Convex's codegen is unverified. The migration must not land
   before parity is demonstrated.
4. **Biome rule parity.** The exact Biome equivalents for the current ESLint rule set
   (including `react-refresh/only-export-components` and the custom `argsIgnorePattern`)
   have not been mapped.
5. **`convex` script wrapper.** `convex dev` and `convex deploy` are invoked directly by
   README and CI. Should they get `package.json` scripts?

**Recorded assumptions**

- *Node 24 is the intended production runtime*, even though the Dockerfile and CI still
  pin 20. The gap is accepted temporarily and closed by a track.
- *Vitest is retained.* The modernization targets the lint/format/typecheck surface, not
  the test runner; Biome does not replace it.
- *Committed generated files are intentional*, so CI does not need a codegen step before
  typecheck.
- *Tailwind-first styling applies to new work only.* Existing co-located CSS files are
  not to be rewritten for its own sake.
