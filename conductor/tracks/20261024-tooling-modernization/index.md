# Tooling Modernization

- [Specification](./spec.md)
- [Implementation Plan](./plan.md)
- [Metadata](./metadata.json)

**Type:** `chore`
**Priority:** `high`
**Branch:** `chore/20261024-tooling-modernization`
**Depends on:** `none`

## Summary

Unify the toolchain on pinned, modern versions: Node 24, pnpm 12.4.1, an exact
`nitro` pin, Biome in place of ESLint and Prettier, Vitest 5 with a 40% coverage
gate, and TypeScript 7. No product behavior changes.

## Artifacts

- `verification/` - phase evidence, created during implementation
- `review.md` - created by `conductor-review`
- `pr.md` - created by `conductor-implement` before opening a PR
