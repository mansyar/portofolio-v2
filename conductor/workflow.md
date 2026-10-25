# Project Workflow

## Guiding Principles

1. **The plan is the source of truth.** Every phase, task, result, checkpoint, and
   evidence link lives in `plan.md`.
2. **The tech stack is deliberate.** A change to the stack is recorded in
   `tech-stack.md` before the implementation depends on it. This project has a
   committed modernization path (Biome, TypeScript 7) recorded there - follow
   it rather than introducing tools ad hoc. Node 24 and pnpm 12.4.1 are already
   pinned across local, CI, and Docker.
3. **Verification is agent-executed.** The phase subagent runs the configured checks and
   writes evidence. The user is not asked to manually verify routine work.
4. **Evidence over assertion.** A phase is complete only when the configured checks pass
   and the evidence file exists.
5. **No silent debt.** A finding is fixed, explicitly accepted with a reason, or tracked
   as an issue. It is never quietly ignored.
6. **Stay inside the phase contract.** `Touches` defines the expected blast radius. A
   required deviation is allowed, recorded, and reviewed.
7. **Non-interactive and CI-aware.** Prefer commands that terminate. Both `vitest run`
   and `vite build` already terminate; never invoke watch mode.

## Workflow Config

```yaml
project:
  type: "brownfield-web-app"
  languages: ["typescript"]
commands:
  setup: "pnpm install && npx convex dev --once"
  dev: "pnpm dev"
  test: "pnpm test"
  coverage: "pnpm test:coverage"
  lint: "pnpm lint"
  format: "pnpm format:check"
  typecheck: "pnpm type-check"
  build: "pnpm build"
  verify_phase: "pnpm type-check && pnpm lint && pnpm format:check && pnpm test"
coverage:
  gate: true
  thresholds:
    lines: 3                          # ratcheting floor, not a target - raise as tests land
    functions: 3
  scope: "project"
verification:
  layers: ["static", "unit", "build"]
  retry: 2
  manual_exceptions: ["production deploy outcome", "Coolify webhook delivery"]
git:
  base_branch: "main"
  fetch: true
  commit_style: "conventional"
  task_commits: true
  phase_squash: true
review:
  strict: true
  issues:
    enabled: true
    auto_create: true
    min_severity: "low"
    group_low: true
    labels: ["tech-debt", "conductor"]
pr:
  enabled: true
  tool: "gh"
  base: "main"
  media: "always"
  watch_ci: true
  watch_timeout_minutes: 15
  merge_method: "squash"
```

### Coverage gate is a ratchet

`pnpm test:coverage` runs Vitest 5 with `@vitest/coverage-v8`, scoped to `src/` and
`convex/` and excluding `convex/_generated/**` and `src/routeTree.gen.ts`.

The threshold is a **ratcheting floor**, not a target. It was set just below the
measured baseline — 3.93% lines, 3.49% functions — because this codebase has
31 tests over ~2,000 lines, and the original 40% goal would have required a large
test expansion that is out of scope for the tooling track.

**Raise the floor whenever a track adds tests.** Never lower it to make a phase pass.
A phase that drops coverage below the floor has introduced untested code and must
either add a test or justify the drop explicitly in its evidence.

### Format is enforced by Biome

`pnpm format:check` runs `biome check .` and fails on any unformatted file.
`pnpm format` applies the fixes. Biome is the single formatter and linter - ESLint and
Prettier are removed. Style is still adjudicated by review against
`conductor/code_styleguides/`; the formatter only settles whitespace and quoting.

## Development Commands

### Setup

```bash
pnpm install
cp .env.example .env.local     # then fill in the required values
npx convex dev --once          # generate convex/_generated/ types
```

### Daily Development

```bash
# Start the app (port 3000)
pnpm dev

# Run tests
pnpm test

# Lint
pnpm lint

# Typecheck
pnpm type-check

# Build
pnpm build
```

### Before Committing

```bash
pnpm type-check && pnpm lint && pnpm test
```

## Phase & Task Workflow

Implementation is executed one phase at a time by a phase subagent. The primary agent
owns `plan.md`, `metadata.json`, the registry, and review artifacts.

### Task Lifecycle

1. Read the phase contract in `plan.md`, the relevant requirements in `spec.md`, and the
   applicable guides in `conductor/code_styleguides/` (`project.md` first, then
   `typescript.md` and `general.md`).
2. Work through the phase's tasks in order.
3. Write or update the failing test before the implementation for behavior changes with a
   testable surface (components, hooks, `src/lib/` helpers, Convex handlers). For purely
   presentational changes, add or update tests alongside the change where a test already
   exists.
4. Implement the smallest change that satisfies the task.
5. Run the targeted checks for the task.
6. Commit the task with a conventional commit message.
7. Report the task's status and commit SHA to the primary agent.

The subagent does **not** edit `plan.md`. The primary marks tasks complete after it
accepts the phase.

### Deviations

- If the phase goal requires a file outside `Touches`, make the smallest necessary change
  and record it in the report under `deviations`.
- If the work requires a product or design decision, stop and report `blocked`.
- Do not silently expand scope, add a dependency, or migrate unrelated code. In
  particular, **do not upgrade dependencies as a side effect of a feature task** — the
  modernization path is its own track.

### Phase Completion

1. Run the phase's `Verification` command exactly as written in `plan.md`.
2. Run `verify_phase` when it is configured and different from the phase command.
3. Write the evidence file using the configured evidence path.
4. Return the structured report to the primary agent.
5. Do not merge, rebase, reset, push, open a PR, or edit Conductor state files.

## Verification Strategy

### Layers

Three layers. Integration, contract, E2E, smoke, and visual layers are deliberately
absent — the project has no integration harness, no E2E runner, and no visual regression
tooling, and adding one just to fill this table would be debt disguised as rigor.

- **Static:** typecheck and lint. Runs every phase.
- **Unit:** Vitest over `src/**` — component tests via Testing Library, unit tests for
  `src/lib/`. Runs every phase.
- **Build:** `vite build`. Runs once per track, at the final phase. Also runs in CI on
  every push, so a broken build cannot reach `main`.

### Commands

| Layer | Command | Required |
| --- | --- | --- |
| static | `pnpm type-check` | yes |
| static | `pnpm lint` | yes |
| unit | `pnpm test` | yes |
| build | `pnpm build` | yes (final phase of each track) |

### Services and Fixtures

- **Services:** the dev server runs on port **3000** (`vite dev --port 3000`). A
  self-hosted Convex instance is required for the app to function locally, addressed by
  `VITE_CONVEX_URL`.
- **Containers:** none required for verification. `docker/docker-compose.yml` exists for
  production-shaped local runs, not for tests.
- **Database:** no test database. Vitest runs in `jsdom` and skips the SSR plugins
  (`nitro`, `tanstackStart`) when `NODE_ENV=test` or `VITEST` is set — deliberately, to
  avoid hanging processes. Tests must not require a live Convex deployment; mock at the
  module boundary instead.
- **Fixtures/seed data:** inline object literals in each test file. No shared fixture
  directory, no seed script.
- **Environment variables:** verification itself needs none. `pnpm build` reads
  `VITE_CONVEX_URL` at build time (CI supplies it as a Docker build arg); if it is absent
  locally the build still succeeds with the value inlined as undefined.
- **Start/stop commands:** `pnpm dev` starts, Ctrl-C stops. Nothing needs to be started
  for `verify_phase` to pass.

### Pass Criteria

- Every required command for the phase exits `0`.
- Every acceptance criterion has a test or a documented evidence artifact.
- No new Critical or High review findings remain.
- Coverage is part of the criteria once `coverage.gate` is `true`: `pnpm test:coverage`
  must exit `0`, which means coverage is at or above the configured ratchet floor.

### Evidence

Write a report to:

```text
conductor/tracks/<track-id>/verification/phase-<n>.md
```

Include: title; track, phase, date, branch, base and head commits; result (`verified`,
`failed`, `blocked`, or `partial`); a commands table (layer, command, exit, summary); an
acceptance-criteria table (ID, criterion, evidence, status); evidence paths; deviations;
and notes. Put binaries, screenshots, and large reports under `.conductor/evidence/`;
that directory is gitignored. The report itself is committed with the track.

### Fallback Ladder

1. Run the full configured layer.
2. If a check fails for an environmental reason (missing `node_modules`, stale generated
   types), run `pnpm install` or `npx convex dev --once` and retry.
3. If a check still cannot run, run the narrowest reliable subset and mark the phase
   `partial` with the reason.
4. Stop and ask the user only for credentials, hardware, or an external approval.

### Retry Policy

- A failed check may be fixed and re-run at most **2** times.
- If it still fails, report `failed` with the command and output.
- Never mark a phase `verified` when a required check did not run.

### Human-Only Exceptions

- **Production deploy outcome.** Whether the Docker image pulled, Convex deployed, and
  Coolify redeployed successfully on `main` can only be confirmed by watching CI and the
  live site. An agent can open the PR and watch checks; it cannot verify the deployment
  landed.
- **Coolify webhook delivery.** The final `curl` to the Coolify webhook has no local
  observable result.
- **Secret rotation.** Rotating `JWT_PRIVATE_KEY`, `JWKS`, `CONVEX_SELF_HOSTED_ADMIN_KEY`,
  or provider tokens is a human action.

## Quality Gates

Before a phase is accepted:

- [ ] `pnpm type-check` passes
- [ ] `pnpm lint` passes with no new warnings
- [ ] `pnpm test` passes
- [ ] `pnpm build` passes (final phase of the track)
- [ ] Code follows `conductor/code_styleguides/` — `project.md` rules in particular
- [ ] No secrets, credentials, or PII are introduced
- [ ] No new `focus-visible`, reduced-motion, or ARIA gaps introduced (see
      `product-guidelines.md`)
- [ ] Public behavior is documented when it changed
- [ ] Evidence is written and linked in `plan.md`

## Commit Guidelines

### Message Format

```text
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat`: new feature
- `fix`: bug fix
- `docs`: documentation only
- `style`: formatting
- `refactor`: behavior-preserving change
- `test`: tests only
- `chore`: maintenance

### Scopes

Match the area touched: `cms`, `blog`, `projects`, `skills`, `uses`, `resume`, `media`,
`messages`, `auth`, `seo`, `ui`, `convex`, `ci`, `deps`, `a11y`.

### Examples

```bash
git commit -m "feat(cms): add bulk unpublish for draft posts"
git commit -m "fix(seo): correct canonical URL on paginated blog index"
git commit -m "test(skills): cover category filter with empty result"
git commit -m "a11y(ui): add focus-visible ring to button primitive"
```

Task-level commits are made by the phase subagent. The primary squashes them into one
phase commit on acceptance, unless a foreign commit landed in the range. The plan update
is a separate state commit.

## Documentation Sync

After review passes, sync documentation **only when the track changed documented
behavior**:

| Change | Update |
| --- | --- |
| Feature behavior, setup, or scripts | `README.md` |
| Architecture, schema, or data model | `docs/PRD.md` |
| Phase completion or roadmap movement | `docs/PROGRESS.md` |

If the track changed nothing documented, record that in `review.md` instead of touching
files. Never rewrite `docs/PRD.md` or `docs/PROGRESS.md` to match the code — surface the
drift as a finding.

## Definition of Done

A track is complete when:

1. Every phase is `verified` with a checkpoint and evidence.
2. The integrated verification on the track branch passes.
3. Review is `PASS`, or every finding is fixed, accepted with a reason, or tracked as an
   issue. No Critical or High finding remains unresolved without an explicit user override
   recorded in `review.md`.
4. Post-review documentation sync is complete, or explicitly recorded as unnecessary.
5. The registry and `metadata.json` show the track as complete.
6. The branch is pushed and a PR is open against `main`, with media attached and CI
   watched for up to 15 minutes.

## Emergency Procedures

### Critical Bug in Production

1. Create a hotfix branch from `main`.
2. Write a failing regression test.
3. Implement the minimal fix.
4. Run the full verification strategy.
5. Open a PR immediately; do not batch unrelated work.
6. Merging deploys — confirm with the user before merging.

### Data Loss

1. Stop all write operations.
2. Restore the self-hosted Convex deployment from its latest backup.
3. Verify data integrity across the affected tables.
4. Document the incident and update the recovery procedure.

### Security Breach

1. Rotate `JWT_PRIVATE_KEY`, `JWKS`, `CONVEX_SELF_HOSTED_ADMIN_KEY`, and any exposed
   provider tokens.
2. Review `activityLogs` and Convex access logs.
3. Patch the vulnerability.
4. Notify affected contacts or subscribers when required.
5. Document the incident and update the security procedure.

## Deployment

Deployment is **automatic on merge to `main`**. `.github/workflows/deploy.yml` runs three
stages on every push to `main`:

1. **`test`** — `pnpm install --frozen-lockfile`, `pnpm type-check`, `pnpm lint`,
   `pnpm test`.
2. **`build-and-push`** — multi-stage Docker build, pushed to Docker Hub as `latest` and
   `${{ github.sha }}`.
3. **`deploy`** — `pnpm exec convex deploy` against the self-hosted instance, then a
   `POST` to the Coolify webhook to pull and restart.

**Merging a PR ships to production.** This is the single most important operational fact
in this document. The implement flow must never merge a PR without explicit human
approval, and must say what merging will deploy.

### Pre-Deployment Checklist

- [ ] CI `test` job green on the PR
- [ ] Review passed, no unresolved Critical or High findings
- [ ] Convex schema changes are backward compatible with the running frontend (the
      frontend and backend deploy in sequence, not atomically)
- [ ] Required environment variables present in the Coolify and Convex configurations
- [ ] Rollback path known: redeploy the previous Docker tag via Coolify

### Post-Deployment

1. Confirm the site loads and `/health` returns 200.
2. Confirm admin sign-in works (auth token signing is the most likely casualty of a
   config change).
3. Check Convex logs for function errors.
4. Record follow-ups as issues or a new track.

## Continuous Improvement

- Review this workflow after each track.
- Update commands and verification layers when the tooling changes.
- Record recurring review findings as process improvements.
- Keep the process as small as the project allows.
