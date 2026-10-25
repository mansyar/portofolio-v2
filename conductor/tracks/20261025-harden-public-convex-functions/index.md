# Harden Public Convex Functions

- [Specification](./spec.md)
- [Implementation Plan](./plan.md)
- [Metadata](./metadata.json)

**Type:** bug
**Priority:** high
**Branch:** `fix/20261025-harden-public-convex-functions`
**Depends on:** none

## Summary

Convex exposes every `query`, `mutation`, and `action` at the deployment URL, so
authorization is each function's own responsibility. An audit of the 21 modules in
`convex/` found four gaps: `analytics.getStats` and `newsletter.listSubscribers` have no
guard at all, `newsletter.sendWelcomeEmail` is a public action that would send mail to any
address a caller supplied, and `newsletter.subscribe` is public by design but has no rate
limit while its sibling `contact.submit` has one.

The track closes all four and installs `convex-test` so each guard is proven by a test
that fails before the fix and passes after it. It also replaces the placeholder assertions
in `convex/__tests__/`, which currently count toward the test total while asserting
`expect(true).toBe(true)`.

## Artifacts

- `verification/` — phase evidence
- `review.md` — added by `conductor-review`
- `pr.md` — added before the pull request
