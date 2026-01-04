---
description: Create a new React component following the Ubuntu Terminal design system
---

# Create Component Workflow

This workflow creates a new component following project conventions and the Ubuntu Terminal design system.

---

## Step 1: Determine Component Type

Ask the user which type of component to create:

| Type      | Directory                  | Purpose                                            |
| --------- | -------------------------- | -------------------------------------------------- |
| `ui`      | `app/components/ui/`       | Base primitives (Button, Input, Card, Modal)       |
| `feature` | `app/components/features/` | Domain-specific (ProjectCard, SkillItem, BlogCard) |
| `layout`  | `app/components/layout/`   | Structural (Header, Footer, AdminSidebar)          |
| `editor`  | `app/components/editor/`   | Rich text related components                       |

---

## Step 2: Create Component File

Create `app/components/{type}/{component-name}.tsx`:

```tsx
import "./component-name.css";

interface ComponentNameProps {
  // Define props here
  children?: React.ReactNode;
}

export function ComponentName({ children }: ComponentNameProps) {
  return <div className="component-name">{children}</div>;
}
```

---

## Step 3: Create Component Styles

Create `app/components/{type}/{component-name}.css`:

```css
.component-name {
  /* Use CSS variables from variables.css */
  font-family: var(--font-mono);
  background-color: var(--color-surface);
  color: var(--color-text-primary);
}
```

---

## Step 4: Apply Ubuntu Terminal Design

For UI components, apply the terminal aesthetic:

### Buttons

```css
.button {
  font-family: var(--font-mono);
  background-color: var(--color-ubuntu-orange);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  transition: all 150ms ease-out;
}

.button::before {
  content: "$ ";
  opacity: 0.7;
}

.button:hover {
  filter: brightness(1.1);
}

.button:active::before {
  content: "> ";
  animation: blink 500ms infinite;
}
```

### Cards (Terminal Window Style)

```css
.card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
}

.card__titlebar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: var(--color-aubergine);
}

.card__dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.card__dot--close {
  background-color: var(--color-terminal-red);
}
.card__dot--minimize {
  background-color: var(--color-terminal-yellow);
}
.card__dot--maximize {
  background-color: var(--color-terminal-green);
}

.card__content {
  padding: 1rem;
}
```

### Inputs (Terminal Prompt Style)

```css
.input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--color-terminal-bg);
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
}

.input-wrapper::before {
  content: ">";
  color: var(--color-terminal-green);
  font-family: var(--font-mono);
}

.input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--color-text-primary);
  font-family: var(--font-mono);
  font-size: 1rem;
  outline: none;
}

.input::placeholder {
  color: var(--color-text-secondary);
}
```

---

## Step 5: Export from Index (if applicable)

If using barrel exports, update `app/components/{type}/index.ts`:

```typescript
export { ComponentName } from "./component-name";
```

---

## Step 6: Verify Component

Import and render the component to verify it works correctly with the design system.

---

## Design System Reference

Always reference these files:

- `agent/rules/project-rules.md` - Design system rules
- `docs/PRD.md` Section 4 - Full design specifications
- `app/styles/variables.css` - CSS custom properties
