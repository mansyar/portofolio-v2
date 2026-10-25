<!-- conductor-version: 2 -->

# Conductor Index

Project context and standards for **Ansyar's Portfolio** — a portfolio website and
custom CMS built with TanStack Start and self-hosted Convex.

## Definition

- [Product Definition](./product.md) — vision, users, use cases, success metrics, scope
  and non-goals, integrations, risks, open questions.
- [Product Guidelines](./product-guidelines.md) — voice and tone, UX principles,
  accessibility (WCAG 2.2 AA), design system, terminology, privacy.
- [Tech Stack](./tech-stack.md) — languages, frameworks, data stores, hosting, tooling,
  coverage policy, planned modernization, constraints, rejected alternatives.

## Workflow

- [Project Workflow](./workflow.md) — commands, phase and task lifecycle, verification
  strategy, quality gates, commit conventions, deployment.
- [Code Style Guides](./code_styleguides/) — `project.md` (authoritative and
  stack-specific), `typescript.md` and `general.md` (library guides).

## Tracks

- [Tracks Registry](./tracks.md) — all tracks and their status.
- [Tracks Directory](./tracks/) — one folder per active track with `spec.md`, `plan.md`,
  `metadata.json`, `review.md`, and `verification/`.
- [Archive](./archive/) — completed tracks, moved here with their full history.

## Capabilities

- **Phase executor:** [`.opencode/agents/conductor-phase.md`](../.opencode/agents/conductor-phase.md)
  — executes one phase, runs verification, writes evidence, reports structured results.
  Template v2.2.
- **Reviewer:** [`.opencode/agents/conductor-reviewer.md`](../.opencode/agents/conductor-reviewer.md)
  — read-only review of a track diff against spec, plan, and style guides. Template v2.2.

No third-party agent skills are installed. The available catalog covers Firebase and
Google Cloud CI/CD; this project uses self-hosted Convex on Docker + Coolify, so neither
family applies.

## Notes

- Conductor runtime state (phase evidence binaries, backups) lives in `.conductor/`,
  which is gitignored. Verification *reports* are committed under
  `conductor/tracks/<track-id>/verification/`.
- Merging a track PR to `main` **deploys to production** via
  `.github/workflows/deploy.yml`. See [Deployment](./workflow.md#deployment).
