# Blog Content API for Agent Authoring — Specification

> Requirements are stable. Once an `FR`, `NFR`, or `AC` ID is approved, do not
> renumber it. If a requirement is removed, mark it `Withdrawn` instead of
> deleting it.

## Overview

Add an authenticated HTTP surface to the self-hosted Convex backend so an AI agent can
create, edit, publish, and unpublish blog posts without an admin session, a browser, or a
repo checkout. Bodies are authored in markdown and stored as sanitized HTML, so the agent
writes prose rather than markup soup. Posts are drafts unless explicitly published.

## Problem / Motivation

Every CMS write today demands a Convex Auth session from an `ADMIN_EMAIL` allowlist, so
content work is reachable only through the `/admin` UI in a browser. An agent can
technically write through the CLI with an impersonated identity, but only from inside this
repo, with the all-or-nothing admin key, and with opaque error reporting. Content
staleness is already a recorded product risk, and the highest-leverage writing help —
drafting posts — is precisely the work the current auth model excludes. Without this, an
agent's content help degrades to "here is text, paste it yourself".

## Goals & Success Metrics

- **Goal:** an agent can take a topic to a live, correctly-formed blog post without a
  human touching the admin UI until publish review.
- **Metric:** a scripted test drives create → partial edit → publish through the real
  handlers, proves the result is publicly readable and present in RSS/sitemap, proves
  drafts stay invisible, and asserts one `activityLogs` row per write — passing in CI with
  no live deployment.

## Scope

### In Scope

- Bearer-token authentication for a new `/content/*` route group.
- Create, partial update, publish, unpublish, and read-back (including drafts) for blog
  posts.
- Markdown → sanitized HTML conversion on write.
- Slug derivation, tag-slug resolution with tag creation, category-slug validation.
- Per-token rate limiting, payload cap, activity logging, error contract.
- Documentation of the new write exception in `tech-stack.md`.

### Out of Scope

- No delete endpoint. Deletion stays a human action in the admin UI.
- No binary/media upload; `coverImageUrl` stays a URL string.
- No scheduled publishing (`scheduledAt`) through the API.
- No other content types (projects, skills, uses, resume, settings) in this track.
- No revision history, no per-post locking, no soft-delete.
- No admin UI changes, no MCP server, no webhooks.
- No browser-facing use: the routes grant no CORS.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | Every `/content/*` route requires `Authorization: Bearer <token>`; the server compares the SHA-256 hash of the presented token against `CONTENT_API_TOKEN_SHA256` in constant time. A missing env value fails closed with 401. | must |
| FR-2 | `POST /content/blog` creates a post from `title` + `bodyMarkdown` plus optional `slug`, `excerpt`, `coverImageUrl`, `categorySlug`, `tags`, `publish`. A missing `slug` is derived from the title; an existing slug returns 409. | must |
| FR-3 | `bodyMarkdown` is converted by a restricted renderer that escapes raw HTML, emits only allowlisted tags, and rejects non-`http`/`https`/`mailto`/relative URLs on links and images. Tests assert the stored HTML against the renderer's allowlist, and render-time DOMPurify remains the final boundary. | must |
| FR-4 | A post is stored as `draft` unless `publish: true`. Publishing stamps `publishedAt` when unset and always computes `readingTime` from the stored HTML. | must |
| FR-5 | `PATCH /content/blog/:slug` changes only the fields present in the request; every omitted field keeps its stored value. A changed body re-converts, re-sanitizes, and recomputes `readingTime`. | must |
| FR-6 | `POST /content/blog/:slug/publish` and `POST /content/blog/:slug/unpublish` are idempotent and preserve an existing `publishedAt` on unpublish. | must |
| FR-7 | `GET /content/blog/:slug` returns one post including drafts; `GET /content/blog` lists posts filtered by optional `status` and bounded by `limit`, so slug collisions are checkable before writing. | must |
| FR-8 | Tag slugs resolve through `by_slug` and missing tags are created; an unknown `categorySlug` is a 400 and no row is written. | must |
| FR-9 | Every successful write appends an `activityLogs` row with `actorEmail: "agent@content-api"`, the correct `action` and `entityType: "blogPost"`, and the post title. | must |
| FR-10 | Errors return JSON `{ error }` with 400 / 401 / 404 / 409 / 413 / 429 / 500, a lowercase message stating cause and next step, and never a stack trace, internal id, or token echo. | must |

## Non-Functional Requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | Drafts never leak: `listPublished`, `listRecent`, `bySlug`, `listForRss`, and the sitemap keep returning published-only content after an API draft exists, proven by test. |
| NFR-2 | Requests over 256 KB are rejected with 413 before any read or write. |
| NFR-3 | Writes are rate limited through the existing `rateLimits` table, keyed on a token fingerprint, at 60 writes per hour, answering 429 with a retry message. |
| NFR-4 | Only the SHA-256 hash lives on the deployment. The raw token is never logged, echoed, returned, or prefixed `VITE_`, and the content routes emit no CORS headers. |
| NFR-5 | The write path is an `internalMutation`, unreachable through the Convex client API; the HTTP action is its only entry point. This is a deliberate, documented exception to the "every mutating function calls `requireAdmin` first" rule, argued from reachability rather than convenience. |
| NFR-6 | Handlers are covered by tests in `convex/__tests__/` following the existing `convex-test` patterns, and the coverage floor is raised to the new measured baseline. |

## Acceptance Criteria

| ID | Criterion | Verifies |
| --- | --- | --- |
| AC-1 | An authorised create returns 201 with `{ id, slug, status: "draft" }` | FR-1, FR-2, FR-4 |
| AC-2 | A missing, malformed, or wrong token returns 401 and writes no row | FR-1 |
| AC-3 | A created draft is absent from the public listing, `bySlug`, RSS, and sitemap | FR-4, NFR-1 |
| AC-4 | A post created with `publish: true` appears in the public listing and RSS with a `publishedAt` | FR-4, NFR-1 |
| AC-5 | Markdown headings, bold, lists, links, and fenced code are stored as allowlisted tags; raw `<script>` and `javascript:` links do not survive | FR-3 |
| AC-6 | Patching only the title leaves body, tags, category, and cover image unchanged | FR-5 |
| AC-7 | Patching the body recomputes `readingTime` from the new HTML | FR-5 |
| AC-8 | A duplicate slug returns 409 and leaves the original post untouched | FR-2 |
| AC-9 | An unknown `categorySlug` returns 400 and writes nothing | FR-8 |
| AC-10 | An unknown tag slug is created once and linked to the post | FR-8 |
| AC-11 | Publishing twice returns success twice and stamps `publishedAt` exactly once | FR-6 |
| AC-12 | Unpublishing returns the post to draft, hides it from public queries, and keeps its `publishedAt` | FR-6, NFR-1 |
| AC-13 | Each successful write produces exactly one `activityLogs` row attributed to `agent@content-api` | FR-9 |
| AC-14 | A 300 KB body returns 413 with no write | NFR-2 |
| AC-15 | The 61st write within an hour returns 429 | NFR-3 |
| AC-16 | Wrong-token and missing-token responses are indistinguishable in shape | FR-1, NFR-4 |

## Edge Cases

- Title with no alphanumeric characters yields no slug → 400 demanding an explicit `slug`.
- `bodyMarkdown` empty or whitespace-only → 400; an update cannot erase a body to nothing.
- `PATCH`/`GET` against an unknown slug → 404.
- Publish on an already published post, and unpublish on a draft → success, with the
  transition's own audit row and no duplicate `publishedAt` stamp.
- Markdown containing raw HTML outside the allowlist → escaped, not rejected, so a draft
  still saves.
- Two writes to the same slug race: last write wins, and both audit rows are recorded.
- Category exists but is deleted between resolve and write → 400, nothing partial.
- Rate limit applies to writes only; reads are unmetered.

## Dependencies

- **Tracks:** none.
- **External:** `marked` for markdown conversion; `CONTENT_API_TOKEN_SHA256` set on the
  self-hosted Convex deployment; `CONTENT_API_TOKEN` in gitignored `.env.local`. Both
  secret values are human-supplied, and setting the deployment variable requires a Convex
  redeploy.

## Open Questions & Assumptions

- **Question:** should the API expose `scheduledAt`? Deferred; publishing is immediate
  only.
- **Assumption:** reads are token-gated but unmetered, since they cannot mutate state.
- **Assumption:** agent writes are attributed to `agent@content-api` rather than a human
  admin email, so the activity log stays truthful about who acted.
- **Assumption:** the public render path is unchanged; `sanitizeHtml` still runs at render,
  so a hand-edited row cannot bypass the boundary.
- **Resolved during planning:** FR-3 originally named the renderer's sanitizer as the
  write-path mechanism. Convex HTTP routes cannot use Node APIs, so the `jsdom`-based
  sanitizer cannot run there; the requirement was amended to a restricted renderer with
  tests asserting the allowlist, rather than planning a phase that deviates from its own
  spec.

## References

- This conversation's design discussion.
- `convex/http.ts` — existing public HTTP route pattern.
- `convex/blog.ts` — the mutations and queries being exposed.
- `convex/lib/auth.ts` — `requireAdmin`, the rule this track documents an exception to.
- `src/lib/sanitize.ts` — the allowlist the conversion output is asserted against.
