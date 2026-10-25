---
description: Run code quality checks - TypeScript, linting, and build verification
---

# Test & Lint Workflow

This workflow runs all code quality checks to ensure the codebase is in good shape.

---

## Step 1: TypeScript Type Checking

Run TypeScript compiler without emitting files:

```bash
# turbo
pnpm tsc --noEmit
```

This checks for:

- Type errors
- Missing imports
- Incorrect function signatures
- Null/undefined issues

**Fix any errors before proceeding.**

---

## Step 2: Biome (Lint)

Run Biome to check for code quality issues:

```bash
pnpm lint
```

To auto-fix fixable issues and reformat:

```bash
pnpm format
```

Common issues to watch for:

- Unused variables/imports
- `any` (an error, not a warning)
- Accessibility violations

---

## Step 3: Biome (Formatting)

Check formatting without writing:

```bash
pnpm format:check
```

Auto-format all files:

```bash
pnpm format
```

---

## Step 4: Build Verification

Verify the production build succeeds:

```bash
# turbo
pnpm build
```

This catches:

- Build-time errors
- Missing environment variables
- Import/export issues
- Bundle size problems

---

## Step 5: Run Tests (if applicable)

If tests are set up:

```bash
pnpm test
```

---

## Quick Check Command

For a full check in one go, add this script to `package.json`:

```json
{
  "scripts": {
    "check": "pnpm tsc --noEmit && pnpm lint && pnpm build"
  }
}
```

Then run:

```bash
# turbo
pnpm check
```

---

## Pre-Commit Hook Setup (Recommended)

Install husky and lint-staged:

```bash
pnpm add -D husky lint-staged
npx husky init
```

Add to `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["biome check --write --no-errors-on-unmatched"]
  }
}
```

`biome.json` scopes Biome to `js`/`jsx`/`ts`/`tsx`, so non-code files are not
formatted by it.

Create `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

pnpm lint-staged
```

---

## Common Issues & Fixes

### TypeScript Errors

| Error                        | Fix                                       |
| ---------------------------- | ----------------------------------------- |
| "Cannot find module"         | Check import path, run `pnpm install`     |
| "Type 'X' is not assignable" | Fix type mismatch or add proper typing    |
| "Property does not exist"    | Update interface or use optional chaining |

### Biome Errors

| Error | Fix |
| --------------------------------------------- | ------------------------------------------------------------------------------- |
| "Avoid `any`" (`noExplicitAny`) | Add a proper TypeScript type, or `unknown` plus a type guard |
| "'X' is defined but never used" | Remove it, or prefix an unused parameter with underscore |
| Formatter diff (`format`) | Run `pnpm format` |

### Build Errors

| Error                            | Fix                            |
| -------------------------------- | ------------------------------ |
| "Failed to resolve import"       | Check path aliases in tsconfig |
| "Environment variable not found" | Add to `.env.local`            |
| "Module not found"               | Run `pnpm install`             |

---

## Quality Gates Summary

Before merging/deploying, ensure:

- [ ] `pnpm tsc --noEmit` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm build` succeeds
- [ ] No console warnings in dev mode
- [ ] All pages render correctly

---

## IDE Integration

For VS Code, ensure these extensions are installed:

- Biome
- TypeScript and JavaScript Language Features

Add to `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "biomejs.biome",
  "editor.codeActionsOnSave": {
    "source.fixAll.biome": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```
