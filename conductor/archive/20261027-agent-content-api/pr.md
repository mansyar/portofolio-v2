## Summary

Adds a token-authenticated HTTP surface so an agent can draft, edit, publish, and
unpublish blog posts without a browser session or a repo checkout. Bodies are authored in
markdown and stored as the HTML subset the site already renders; new posts are drafts
unless publishing is explicit. The path is metered per credential, audited as
`agent@content-api`, and never reachable from the Convex client API.

## Track

- **ID:** `20261027-agent-content-api`
- **Type:** `feature`
- **Spec:** [`conductor/archive/20261027-agent-content-api/spec.md`](conductor/archive/20261027-agent-content-api/spec.md)
- **Plan:** [`conductor/archive/20261027-agent-content-api/plan.md`](conductor/archive/20261027-agent-content-api/plan.md)
- **Review:** [`conductor/archive/20261027-agent-content-api/review.md`](conductor/archive/20261027-agent-content-api/review.md)

## What happened

| Phase | Goal | Result | Checkpoint | Notes |
| --- | --- | --- | --- | --- |
| 1: Token gate | Routes exist and fail closed (401/413, no CORS) | verified | `5ee6877` | Temporary 501 stub, replaced in Phase 3 |
| 2: Markdown pipeline | Markdown → renderer-safe HTML, no route or DB needed | verified | `c188bd7` | Added `marked` 16; DOMPurify impossible on this runtime |
| 3: Create and read | Create with taxonomy, read back drafts, audit, meter | verified | `965ee30` | `_generated/api.d.ts` regenerated (recorded deviation) |
| 4: Update and transitions | Partial edits; idempotent publish/unpublish | verified | `4cb5d42` | Fixed a real bug: absent `tags` cleared the set |
| 5: Docs and ratchet | Docs match the surface; coverage floor raised | verified | `3673973` | Floor 32/24 → 40/30; `workflow.md` baseline updated (recorded deviation) |
| R1: Review fixes | Resolve F1–F3 | verified | `1a40b3e` | Slug validation, blank-body message, five missing cases |

## Requirements

- [x] `FR-1` — Bearer token checked against `CONTENT_API_TOKEN_SHA256`, constant-time, fail closed (test: `convex/__tests__/contentAuth.test.ts`)
- [x] `FR-2` — Create with title, markdown body, optional slug/taxonomy/publish; 409 on collision (`contentApi.create.test.ts`)
- [x] `FR-3` — Restricted renderer: raw HTML escaped, allowlisted tags, safe URL schemes (`markdown.test.ts`)
- [x] `FR-4` — Draft unless `publish: true`; `publishedAt` and `readingTime` set (`contentApi.create.test.ts`)
- [x] `FR-5` — Partial update; only sent fields change; body re-metered (`contentApi.update.test.ts`)
- [x] `FR-6` — Idempotent publish/unpublish, `publishedAt` preserved (`contentApi.update.test.ts`)
- [x] `FR-7` — Read one post including drafts; list with `status` and bounded `limit`
- [x] `FR-8` — Tags created when missing; unknown category is a 400
- [x] `FR-9` — One `activityLogs` row per write as `agent@content-api`
- [x] `FR-10` — Uniform `{ error }` contract, no stack traces or token echo
- [x] `NFR-1` — Drafts invisible to listing, `bySlug`, RSS, and sitemap
- [x] `NFR-2` — 256 KB cap with 413
- [x] `NFR-3` — 60 writes/hour per credential fingerprint
- [x] `NFR-4` — Digest only on the deployment; no CORS; token never logged
- [x] `NFR-5` — Writes are `internalMutation`s; one test asserts none is public
- [x] `NFR-6` — Coverage floor raised to 40 / 30 from a 41.13 / 30.31 baseline
- [x] `AC-1` – `AC-16` — each mapped to a named test in the phase evidence

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| typecheck | `pnpm type-check` | pass | `conductor/archive/20261027-agent-content-api/verification/integrated.md` |
| lint | `pnpm lint` | pass | |
| format | `pnpm format:check` | pass | |
| unit | `pnpm test` | pass — 255/255 in 57 files | |
| coverage | `pnpm test:coverage` | pass — 41.13% lines / 30.31% functions | |
| build | `pnpm build` | pass | |

## Review

- **Verdict:** `PASS`
- **Rounds:** 2
- **Fixed:** 3 findings (1 High, 1 Medium, 1 Low)
- **Accepted/deferred:** 0 — strict mode, nothing deferred

## Deviations and risks

- **Regenerated `convex/_generated/api.d.ts`.** Produced by `npx convex codegen`; the
  project commits generated types and forbids hand-editing them. `convex function-spec`
  confirmed nothing was pushed to the live deployment during development.
- **`conductor/workflow.md` coverage paragraph** was updated alongside the gate so the
  documented floor matches the enforced one.
- **Markdown conversion replaces DOMPurify on this path.** Convex HTTP routes have no
  Node APIs, so `jsdom` cannot run there; safety is established by a restricted renderer
  and the render-time sanitizer still runs. This is why FR-3 was amended during planning.
- **Two configuration steps are required before the API works**: `CONTENT_API_TOKEN` in
  `.env.local` and its digest as `CONTENT_API_TOKEN_SHA256` on the Convex deployment.
  Until both exist, every content route answers 401 by design.
- **Deploy note:** merging this PR runs `convex deploy` and the Coolify webhook, so it
  ships to production. The routes stay closed until the digest is configured.

## Follow-ups

- none

## Rollback

```bash
# Squash commit
git revert --no-edit <squash-commit>
```

No schema or data migration is involved: the change adds functions and routes only, and
no table was altered. Reverting removes the endpoints; posts created through them remain
ordinary blog posts and can still be managed in `/admin`.
