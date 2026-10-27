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
- **Status:** in_progress

- [ ] **P1.T1: Constant-time token verification helper** — covers: FR-1
  - [ ] **P1.T1.1:** SHA-256 hash of the presented token, compared against `CONTENT_API_TOKEN_SHA256`
  - [ ] **P1.T1.2:** Constant-time comparison; a missing or malformed env value denies every request
- [ ] **P1.T2: Authorization extraction and 401 contract** — covers: FR-1, FR-10, AC-2, AC-16
  - [ ] **P1.T2.1:** Parse `Authorization: Bearer`, rejecting a malformed scheme exactly as a wrong token
  - [ ] **P1.T2.2:** Unified `{ error }` body with lowercase, cause-first wording
- [ ] **P1.T3: Payload cap enforced before parsing** — covers: NFR-2, AC-14
  - [ ] **P1.T3.1:** 256 KB ceiling on a declared length and on the read body, answering 413
- [ ] **P1.T4: Register the route group without CORS** — covers: NFR-4
  - [ ] **P1.T4.1:** Routes wired into `convex/http.ts`; no `Access-Control-*` headers emitted
- [ ] **P1.T5: Transport tests** — covers: AC-2, AC-14, AC-16
  - [ ] **P1.T5.1:** Table-driven cases for missing, malformed, wrong, and valid tokens; 413; identical wrong-token shapes

## Phase 2: Markdown pipeline

- **Goal:** A pure converter turns markdown into the renderer's HTML subset, escaping raw HTML and rejecting unsafe URL schemes — verifiable without any route or database.
- **Depends on:** none *(disjoint from Phase 1; the two can be parallelized)*
- **Covers:** FR-3, AC-5
- **Touches:** `convex/lib/markdown.ts`, `convex/__tests__/markdown.test.ts`, `package.json`, `pnpm-lock.yaml`
- **Verification:** `pnpm type-check && pnpm lint && pnpm format:check && pnpm test`
- **Status:** pending

- [ ] **P2.T1: Add the conversion dependency** — covers: FR-3
  - [ ] **P2.T1.1:** Add `marked` at a pinned version; confirm it bundles without Node built-ins
- [ ] **P2.T2: Restricted renderer** — covers: FR-3
  - [ ] **P2.T2.1:** Escape raw HTML tokens instead of passing them through
  - [ ] **P2.T2.2:** Emit only allowlisted tags; render strikethrough as `<s>` rather than `<del>`
  - [ ] **P2.T2.3:** Allow only `http`, `https`, `mailto`, and relative URLs on links and images
- [ ] **P2.T3: Converter entry point** — covers: FR-3
  - [ ] **P2.T3.1:** One function returning `{ html, readingTime }` from markdown, rejecting an empty body
- [ ] **P2.T4: Pipeline tests** — covers: AC-5
  - [ ] **P2.T4.1:** Headings, bold, lists, links, and fenced code produce allowlisted tags with language classes
  - [ ] **P2.T4.2:** Raw `<script>`, `javascript:` links, and event attributes do not survive conversion

## Phase 3: Create, read back, taxonomy, audit, metering

- **Goal:** An authorised agent can create a draft or published post with taxonomy resolved, read it back including drafts, and every write is audited and rate limited.
- **Depends on:** Phase 1, Phase 2
- **Covers:** FR-2, FR-4, FR-7, FR-8, FR-9, NFR-3, NFR-1, AC-1, AC-3, AC-4, AC-8, AC-9, AC-10, AC-13, AC-15
- **Touches:** `convex/contentApi.ts`, `convex/http.ts`, `convex/__tests__/contentApi.create.test.ts`
- **Verification:** `pnpm type-check && pnpm lint && pnpm format:check && pnpm test`
- **Status:** pending

- [ ] **P3.T1: Internal create mutation** — covers: FR-2, FR-4
  - [ ] **P3.T1.1:** Insert with `draft` status unless `publish: true`; stamp `publishedAt` on first publish
  - [ ] **P3.T1.2:** Persist `readingTime` computed from the stored HTML
- [ ] **P3.T2: Slug handling** — covers: FR-2, AC-8
  - [ ] **P3.T2.1:** Derive from the title, honour an explicit slug, return 409 on collision
  - [ ] **P3.T2.2:** Return 400 when a title yields no usable slug and none was supplied
- [ ] **P3.T3: Taxonomy resolution** — covers: FR-8, AC-9, AC-10
  - [ ] **P3.T3.1:** Resolve tag slugs through `by_slug` and create missing tags
  - [ ] **P3.T3.2:** Reject an unknown category slug with 400 before any write
- [ ] **P3.T4: Rate limit and audit** — covers: FR-9, NFR-3, AC-13, AC-15
  - [ ] **P3.T4.1:** Per-fingerprint write budget through the existing `rateLimits` table
  - [ ] **P3.T4.2:** One `activityLogs` row per successful write attributed to `agent@content-api`
- [ ] **P3.T5: Read-back endpoints** — covers: FR-7
  - [ ] **P3.T5.1:** `GET /content/blog/:slug` returns drafts and published posts alike
  - [ ] **P3.T5.2:** `GET /content/blog` supports `status` and a bounded `limit`
- [ ] **P3.T6: Draft-leak regression** — covers: NFR-1, AC-3, AC-4
  - [ ] **P3.T6.1:** Assert a draft is absent from `listPublished`, `bySlug`, `listRecent`, and `listForRss`, and that a published post is present
- [ ] **P3.T7: Create-path tests** — covers: AC-1, AC-9, AC-10, AC-13, AC-15

## Phase 4: Partial update, publish, unpublish

- **Goal:** Editing changes only what was sent, and publication transitions are explicit and idempotent.
- **Depends on:** Phase 3
- **Covers:** FR-5, FR-6, AC-6, AC-7, AC-11, AC-12
- **Touches:** `convex/contentApi.ts`, `convex/http.ts`, `convex/__tests__/contentApi.update.test.ts`
- **Verification:** `pnpm type-check && pnpm lint && pnpm format:check && pnpm test`
- **Status:** pending

- [ ] **P4.T1: Partial update** — covers: FR-5, AC-6
  - [ ] **P4.T1.1:** Patch only present fields; preserve omitted body, tags, category, and cover image
  - [ ] **P4.T1.2:** Return 404 on an unknown slug and reject an empty body update
- [ ] **P4.T2: Recompute derived fields** — covers: FR-5, AC-7
  - [ ] **P4.T2.1:** Re-convert and re-meter `readingTime` only when the body changes
- [ ] **P4.T3: Publication transitions** — covers: FR-6, AC-11, AC-12
  - [ ] **P4.T3.1:** Idempotent publish and unpublish; `publishedAt` stamped once and retained on unpublish
  - [ ] **P4.T3.2:** Audit each transition with the matching action
- [ ] **P4.T4: Update-path tests** — covers: AC-6, AC-7, AC-11, AC-12

## Phase 5: Documentation and coverage ratchet

- **Goal:** The documented stack matches the new surface and the coverage floor reflects the added tests.
- **Depends on:** Phase 4
- **Covers:** NFR-5, NFR-6
- **Touches:** `conductor/tech-stack.md`, `README.md`, `vite.config.ts`
- **Verification:** `pnpm type-check && pnpm lint && pnpm format:check && pnpm test:coverage && pnpm build`
- **Status:** pending

- [ ] **P5.T1: Record the architecture exception** — covers: NFR-5
  - [ ] **P5.T1.1:** Document the token-authenticated internal mutation beside the existing public-write exception
  - [ ] **P5.T1.2:** Record `marked` and the two token variables in the stack document
- [ ] **P5.T2: Document the API for humans** — covers: FR-10
  - [ ] **P5.T2.1:** Add routes, auth, and token setup to `README.md`
- [ ] **P5.T3: Raise the coverage floor** — covers: NFR-6
  - [ ] **P5.T3.1:** Measure the new baseline and raise the `vite.config.ts` thresholds to it, never lowering them
