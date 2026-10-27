# Review: Blog Content API for Agent Authoring

- **Track:** `20261027-agent-content-api`
- **Type:** `feature`
- **Branch:** `feat/20261027-agent-content-api`
- **Range:** `259d2ea4b9952ce0a8c6f7bc114e0f97f6852530..f5435f5`
- **Date:** `2026-10-27`
- **Verdict:** `PASS`

## Summary

The transport, conversion, and mutation layers hold up: every configured check passes
(255 tests, coverage above the raised gate, build green), all 16 acceptance criteria map
to a test, and the security posture is sound — token digests only, constant-time compare,
no CORS, internal-only writes, drafts invisible to every public surface. Round 1 raised
one High finding (an unvalidated explicit slug could create an unroutable or case-twin
post), one Medium (five untested validation branches), and one Low (a blank PATCH body
reported as a missing field). All three were fixed in Phase R1 with tests that fail
without the fix; nothing was deferred.

**Reviewer:** the `conductor-reviewer` subagent is not available in this environment, so
the primary agent performed this review read-only before writing this file. Independence
is weaker than the process assumes and is recorded here rather than glossed over.

## Verification

| Layer | Command | Result | Evidence |
| --- | --- | --- | --- |
| test | `pnpm test` | pass — 255/255 in 57 files (after the R1 fixes) | `verification/phase-R1.md` |
| coverage | `pnpm test:coverage` | pass — 41.13% lines / 30.31% functions against 40 / 30 | `verification/phase-R1.md` |
| lint | `pnpm lint` | pass | recorded below |
| format | `pnpm format:check` | pass | recorded below |
| typecheck | `pnpm type-check` | pass | recorded below |
| build | `pnpm build` | pass | `verification/integrated.md` |

## Requirements

| ID | Implemented by | Verified by | Status |
| --- | --- | --- | --- |
| FR-1 | P1.T1–P1.T4 | `contentAuth.test.ts` (7 gate tests) | covered |
| FR-2 | P3.T1–P3.T3 | `contentApi.create.test.ts` | covered |
| FR-3 | P2.T1–P2.T4 | `markdown.test.ts` | covered |
| FR-4 | P3.T1 | `contentApi.create.test.ts` | covered |
| FR-5 | P4.T1–P4.T2 | `contentApi.update.test.ts` | covered |
| FR-6 | P4.T3 | `contentApi.update.test.ts` | covered |
| FR-7 | P3.T5 | `contentApi.create.test.ts` (list, 404, limit) | covered |
| FR-8 | P3.T3 | `contentApi.create.test.ts` (category, tags) | covered |
| FR-9 | P3.T4 | `contentApi.create.test.ts`, `contentApi.update.test.ts` | covered |
| FR-10 | P1.T2 | `contentAuth.test.ts`, create/update suites | covered |
| NFR-1 | P3.T6 | `contentApi.create.test.ts` (draft leak), `convex/sitemap.ts` reads published only | covered |
| NFR-2 | P1.T3 | `contentAuth.test.ts` (413) | covered |
| NFR-3 | P3.T4 | `contentApi.create.test.ts` (429, metering row) | covered |
| NFR-4 | P1.T2, P1.T4 | `contentAuth.test.ts` (no CORS, fail-closed) | covered |
| NFR-5 | P3.T1 | `contentApi.create.test.ts` (module reachability) | covered |
| NFR-6 | P5.T3 | `vite.config.ts` 40 / 30 | covered |
| AC-1, AC-3, AC-4, AC-8, AC-9, AC-10, AC-13, AC-15 | P3 | `contentApi.create.test.ts` | covered |
| AC-2, AC-14, AC-16 | P1 | `contentAuth.test.ts` | covered |
| AC-5 | P2 | `markdown.test.ts` | covered |
| AC-6, AC-7, AC-11, AC-12 | P4 | `contentApi.update.test.ts` | covered |

## Findings

### Critical

- none

### High

- **F1 — An explicit slug is stored without validation** — **Resolved in R1** (`1a40b3e`)
  - **File:** `convex/contentApi.ts:142`
  - **What:** `const slug = args.slug ?? slugify(title)` honours a caller-supplied slug
    verbatim. Nothing checks it against the shape URLs require. `slug: "My Post/Part 1"`
    stores spaces and a slash, producing a post whose `/blog/...` URL does not route;
    `slug: "Guide"` and `slug: "guide"` become two posts at case-distinct URLs, and the
    derived-slug path would have produced `guide` for both.
  - **Why:** the post is saved successfully and then unreachable or ambiguous, which is
    worse than a rejection: the agent sees a 201, the site serves a 404, and nothing in
    the response points at the cause. It also lets the API write rows the admin form's
    own slugification would never produce.
  - **Fix:** validate a supplied slug against a URL-safe pattern
    (`^[a-z0-9][a-z0-9._-]*$`, max 80 characters) and reject anything else with 400
    naming the allowed characters. Derived slugs already satisfy it by construction.
  - **Requirement:** FR-2
  - **Test gap:** none today; add rejection cases for spaces/slashes, uppercase, and a
    leading separator, plus a positive case for a valid explicit slug.

### Medium

- **F2 — Three input-validation branches have no test** — **Resolved in R1** (`1a40b3e`)
  - **File:** `convex/http.ts:266`, `convex/http.ts:356`, `convex/http.ts:464`
  - **What:** `readOptionalBoolean` rejects a non-boolean `publish`, `readStringList`
    rejects a non-array or non-string `tags`, and `contentApi.list` clamps `limit` to
    1–50 — none of these branches is exercised. The clamping floor and ceiling are both
    untested.
  - **Why:** a regression that turned `publish: "yes"` into a published post, or that
    dropped the clamp and let a caller request an unbounded read, would pass the suite.
  - **Fix:** add cases for `publish: "true"`, `tags: "convex"`, `tags: [1]`, `limit=0`,
    and a `limit` above the ceiling.
  - **Requirement:** FR-2, FR-7, FR-10
  - **Test gap:** the five cases above.

### Low

- **F3 — A blank body in PATCH reports the wrong problem** — **Resolved in R1** (`1a40b3e`)
  - **File:** `convex/http.ts:480`
  - **What:** `bodyMarkdown: "   "` trims to `undefined`, so the handler decides no field
    was sent and answers "no fields to update". The caller did send a body; it was empty.
  - **Why:** the message sends the caller looking for a missing field instead of an empty
    one, which is the actual mistake.
  - **Fix:** treat a present-but-blank `bodyMarkdown` as an empty body and answer "body
    must not be empty" (400).
  - **Requirement:** FR-5, FR-10
  - **Test gap:** assert the message for a blank body.

## Overrides

- none

## Plan compliance

Every phase is `verified` with a checkpoint and evidence; every task is `[x]` and
implemented; no task was dropped. The final diff stays within the union of the phases'
`Touches` except the two deviations recorded in phase evidence: the regenerated
`convex/_generated/api.d.ts` and the coverage paragraph in `conductor/workflow.md`.
No task was marked complete without a passing verification command.

Review volume: 1972 insertions across 13 files, excluding `conductor/` — a large review,
so each phase checkpoint diff was read separately and then the integration diff, with
duplicates merged.

## Out of scope

- Clearing an optional field (`excerpt`, `coverImageUrl`, `tags: []` excepted) is not
  expressible, because an absent key and a blank string both mean "unchanged". A future
  track could accept explicit `null`.
- The API cannot rename a slug; that needs redirect bookkeeping the CMS does not have.
- Other content types (projects, skills, uses, resume, settings) are deliberately not
  exposed yet.

## Debt

- none deferred; strict mode is on and all findings were fixed in Phase R1. No issues
  were filed because nothing remained unresolved.

## Doc sync

`pending` — completed after the review fixes.

## History

| Round | Verdict | Critical | High | Medium | Low | Fixed |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | BLOCK | 0 | 1 | 1 | 1 | 0 |
| 2 | PASS | 0 | 0 | 0 | 0 | 3 |
