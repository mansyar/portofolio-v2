# Blog Content API for Agent Authoring — Implementation Plan

> **Branch:** `feat/20261027-agent-content-api`
> **Base:** `main` @ `259d2ea4b9952ce0a8c6f7bc114e0f97f6852530`
>
> Phase states are `pending`, `in_progress`, `verified`, `failed`, or `blocked`.
> Only the primary agent writes this file. Phase subagents report results and the
> primary records them.

## Phase 1: Token gate and transport contract

- **Goal:** The `/content/*` route group exists and fails closed — missing or wrong token returns 401, oversized bodies return 413, and no route advertises CORS.
- **Depends on:** none
- **Covers:** FR-1, FR-10, NFR-2, NFR-4, AC-2, AC-14, AC-16
- **Touches:** `convex/lib/contentAuth.ts`, `convex/http.ts`, `convex/__tests__/contentAuth.test.ts`
- **Verification:** `pnpm type-check && pnpm lint && pnpm format:check && pnpm test`
- **Status:** verified

- [x] **P1.T1: Constant-time token verification helper** — covers: FR-1
  - [x] **P1.T1.1:** SHA-256 hash of the presented token, compared against `CONTENT_API_TOKEN_SHA256`
  - [x] **P1.T1.2:** Constant-time comparison; a missing or malformed env value denies every request
- [x] **P1.T2: Authorization extraction and 401 contract** — covers: FR-1, FR-10, AC-2, AC-16
  - [x] **P1.T2.1:** Parse `Authorization: Bearer`, rejecting a malformed scheme exactly as a wrong token
  - [x] **P1.T2.2:** Unified `{ error }` body with lowercase, cause-first wording
- [x] **P1.T3: Payload cap enforced before parsing** — covers: NFR-2, AC-14
  - [x] **P1.T3.1:** 256 KB ceiling on a declared length and on the read body, answering 413
- [x] **P1.T4: Register the route group without CORS** — covers: NFR-4
  - [x] **P1.T4.1:** Routes wired into `convex/http.ts`; no `Access-Control-*` headers emitted
- [x] **P1.T5: Transport tests** — covers: AC-2, AC-14, AC-16
  - [x] **P1.T5.1:** Table-driven cases for missing, malformed, wrong, and valid tokens; 413; identical wrong-token shapes

**Result:** verified
**Checkpoint:** 5ee6877
**Evidence:** conductor/tracks/20261027-agent-content-api/verification/phase-1.md

## Phase 2: Markdown pipeline

- **Goal:** A pure converter turns markdown into the renderer's HTML subset, escaping raw HTML and rejecting unsafe URL schemes — verifiable without any route or database.
- **Depends on:** none *(disjoint from Phase 1; the two can be parallelized)*
- **Covers:** FR-3, AC-5
- **Touches:** `convex/lib/markdown.ts`, `convex/__tests__/markdown.test.ts`, `package.json`, `pnpm-lock.yaml`
- **Verification:** `pnpm type-check && pnpm lint && pnpm format:check && pnpm test`
- **Status:** verified

- [x] **P2.T1: Add the conversion dependency** — covers: FR-3
  - [x] **P2.T1.1:** Add `marked` at a pinned version; confirm it bundles without Node built-ins
- [x] **P2.T2: Restricted renderer** — covers: FR-3
  - [x] **P2.T2.1:** Escape raw HTML tokens instead of passing them through
  - [x] **P2.T2.2:** Emit only allowlisted tags; render strikethrough as `<s>` rather than `<del>`
  - [x] **P2.T2.3:** Allow only `http`, `https`, `mailto`, and relative URLs on links and images
- [x] **P2.T3: Converter entry point** — covers: FR-3
  - [x] **P2.T3.1:** One function returning `{ html, readingTime }` from markdown, rejecting an empty body
- [x] **P2.T4: Pipeline tests** — covers: AC-5
  - [x] **P2.T4.1:** Headings, bold, lists, links, and fenced code produce allowlisted tags with language classes
  - [x] **P2.T4.2:** Raw `<script>`, `javascript:` links, and event attributes do not survive conversion

**Result:** verified
**Checkpoint:** c188bd7
**Evidence:** conductor/tracks/20261027-agent-content-api/verification/phase-2.md

## Phase 3: Create, read back, taxonomy, audit, metering

- **Goal:** An authorised agent can create a draft or published post with taxonomy resolved, read it back including drafts, and every write is audited and rate limited.
- **Depends on:** Phase 1, Phase 2
- **Covers:** FR-2, FR-4, FR-7, FR-8, FR-9, NFR-3, NFR-1, AC-1, AC-3, AC-4, AC-8, AC-9, AC-10, AC-13, AC-15
- **Touches:** `convex/contentApi.ts`, `convex/http.ts`, `convex/__tests__/contentApi.create.test.ts`
- **Verification:** `pnpm type-check && pnpm lint && pnpm format:check && pnpm test`
- **Status:** verified

- [x] **P3.T1: Internal create mutation** — covers: FR-2, FR-4
  - [x] **P3.T1.1:** Insert with `draft` status unless `publish: true`; stamp `publishedAt` on first publish
  - [x] **P3.T1.2:** Persist `readingTime` computed from the stored HTML
- [x] **P3.T2: Slug handling** — covers: FR-2, AC-8
  - [x] **P3.T2.1:** Derive from the title, honour an explicit slug, return 409 on collision
  - [x] **P3.T2.2:** Return 400 when a title yields no usable slug and none was supplied
- [x] **P3.T3: Taxonomy resolution** — covers: FR-8, AC-9, AC-10
  - [x] **P3.T3.1:** Resolve tag slugs through `by_slug` and create missing tags
  - [x] **P3.T3.2:** Reject an unknown category slug with 400 before any write
- [x] **P3.T4: Rate limit and audit** — covers: FR-9, NFR-3, AC-13, AC-15
  - [x] **P3.T4.1:** Per-fingerprint write budget through the existing `rateLimits` table
  - [x] **P3.T4.2:** One `activityLogs` row per successful write attributed to `agent@content-api`
- [x] **P3.T5: Read-back endpoints** — covers: FR-7
  - [x] **P3.T5.1:** `GET /content/blog/:slug` returns drafts and published posts alike
  - [x] **P3.T5.2:** `GET /content/blog` supports `status` and a bounded `limit`
- [x] **P3.T6: Draft-leak regression** — covers: NFR-1, AC-3, AC-4
  - [x] **P3.T6.1:** Assert a draft is absent from `listPublished`, `bySlug`, `listRecent`, and `listForRss`, and that a published post is present
- [x] **P3.T7: Create-path tests** — covers: AC-1, AC-9, AC-10, AC-13, AC-15

**Result:** verified
**Checkpoint:** 965ee30
**Evidence:** conductor/tracks/20261027-agent-content-api/verification/phase-3.md

## Phase 4: Partial update, publish, unpublish

- **Goal:** Editing changes only what was sent, and publication transitions are explicit and idempotent.
- **Depends on:** Phase 3
- **Covers:** FR-5, FR-6, AC-6, AC-7, AC-11, AC-12
- **Touches:** `convex/contentApi.ts`, `convex/http.ts`, `convex/__tests__/contentApi.update.test.ts`
- **Verification:** `pnpm type-check && pnpm lint && pnpm format:check && pnpm test`
- **Status:** verified

- [x] **P4.T1: Partial update** — covers: FR-5, AC-6
  - [x] **P4.T1.1:** Patch only present fields; preserve omitted body, tags, category, and cover image
  - [x] **P4.T1.2:** Return 404 on an unknown slug and reject an empty body update
- [x] **P4.T2: Recompute derived fields** — covers: FR-5, AC-7
  - [x] **P4.T2.1:** Re-convert and re-meter `readingTime` only when the body changes
- [x] **P4.T3: Publication transitions** — covers: FR-6, AC-11, AC-12
  - [x] **P4.T3.1:** Idempotent publish and unpublish; `publishedAt` stamped once and retained on unpublish
  - [x] **P4.T3.2:** Audit each transition with the matching action
- [x] **P4.T4: Update-path tests** — covers: AC-6, AC-7, AC-11, AC-12

**Result:** verified
**Checkpoint:** 4cb5d42
**Evidence:** conductor/tracks/20261027-agent-content-api/verification/phase-4.md

## Phase 5: Documentation and coverage ratchet

- **Goal:** The documented stack matches the new surface and the coverage floor reflects the added tests.
- **Depends on:** Phase 4
- **Covers:** NFR-5, NFR-6
- **Touches:** `conductor/tech-stack.md`, `README.md`, `vite.config.ts`
- **Verification:** `pnpm type-check && pnpm lint && pnpm format:check && pnpm test:coverage && pnpm build`
- **Status:** verified

- [x] **P5.T1: Record the architecture exception** — covers: NFR-5
  - [x] **P5.T1.1:** Document the token-authenticated internal mutation beside the existing public-write exception
  - [x] **P5.T1.2:** Record `marked` and the two token variables in the stack document
- [x] **P5.T2: Document the API for humans** — covers: FR-10
  - [x] **P5.T2.1:** Add routes, auth, and token setup to `README.md`
- [x] **P5.T3: Raise the coverage floor** — covers: NFR-6
  - [x] **P5.T3.1:** Measure the new baseline and raise the `vite.config.ts` thresholds to it, never lowering them

**Result:** verified
**Checkpoint:** 3673973
**Evidence:** conductor/tracks/20261027-agent-content-api/verification/phase-5.md

## Phase R1: Review Fixes

- **Goal:** Resolve review findings F1, F2, F3.
- **Depends on:** Phase 5
- **Covers:** F1, F2, F3
- **Touches:** `convex/contentApi.ts`, `convex/http.ts`, `convex/__tests__/contentApi.create.test.ts`, `convex/__tests__/contentApi.update.test.ts`
- **Verification:** `pnpm type-check && pnpm lint && pnpm format:check && pnpm test`
- **Status:** in_progress

- [ ] **R1.T1: Resolve F1** — covers: F1
- [ ] **R1.T2: Resolve F2** — covers: F2
- [ ] **R1.T3: Resolve F3** — covers: F3
