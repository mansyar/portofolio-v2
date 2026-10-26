# Accessibility WCAG 2.2 AA Burn-Down

- [Specification](./spec.md)
- [Implementation Plan](./plan.md)
- [Metadata](./metadata.json)

**Type:** `chore`
**Priority:** `high`
**Branch:** `chore/20261026-accessibility-wcag-aa`
**Depends on:** `none`

## Summary

Pay down the accessibility debt the tooling track surfaced and recorded rather than
fixed. On `main` at `2cc3505` the repository carries 77 accessibility warnings out of
99 (`useButtonType` 39, `noLabelWithoutControl` 31, and five smaller rules), zero
`:focus-visible` rules, one reduced-motion guard across seven animation-declaring
files, exactly one `aria-label` in the whole TSX tree, four `outline: none`
declarations, and a secondary-text token that fails AA contrast on the light
surface.

The track closes all of it, then promotes the seven demoted rules from `warn` to
`error` so the debt cannot regrow, and locks the fixes with Testing Library
regression assertions. It carries no product behaviour change, adds no dependency,
and treats the 22 remaining non-accessibility warnings as explicitly out of scope.

## Artifacts

- `verification/` - phase evidence, created during implementation
- `review.md` - created by `conductor-review`
- `pr.md` - created by `conductor-implement` before opening a PR
