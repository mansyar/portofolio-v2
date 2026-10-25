# AGENTS.md

Guidance for AI agents working in this repository.

## Project

Portfolio website and custom CMS — TanStack Start (React 19, SSR) on a self-hosted
Convex backend, deployed via Docker + Coolify. See `README.md` for setup.

## Conductor

<!-- conductor:start -->

### Conductor

This project uses Conductor for spec-driven development.

Start with [`conductor/index.md`](./conductor/index.md). It links the product
definition, product guidelines, tech stack, workflow, code style guides, and the track
registry.

- Check track status with `conductor-status`.
- Plan new work with `conductor-new-track`.
- Execute a track with `conductor-implement`.
- Review a completed track with `conductor-review`.

Treat `plan.md`, `metadata.json`, `tracks.md`, and `review.md` as Conductor state. Do not
hand-edit them outside the Conductor commands; `conductor-implement` and
`conductor-review` own those files and their commits.

<!-- conductor:end -->
