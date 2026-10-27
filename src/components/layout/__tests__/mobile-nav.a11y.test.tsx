import type { ReactNode } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Header from "../../Header";

interface MockLinkProps {
  children: ReactNode;
  to: string;
  className?: string;
  "aria-current"?: "page" | undefined;
}

/**
 * The shared setup renders `Link` as `({ children, to }) => <a href={to}>`, discarding
 * `className` and every other prop, so the declared target size and focus-ring classes
 * would read as empty strings. This file forwards them instead, matching the pattern in
 * src/routes/__tests__/blog-index-prefetch.test.tsx.
 */
vi.mock("@tanstack/react-router", () => ({
  useLocation: vi.fn(() => ({ pathname: "/" })),
  Link: ({ children, to, ...rest }: MockLinkProps) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

/**
 * Accessibility contract for the public header's mobile navigation.
 *
 * The assertions are split by what jsdom can actually decide. Roles, accessible names,
 * ARIA state, and the relationship between the trigger and the panel are real
 * accessibility-tree facts, so they are asserted directly. Target size and focus-ring
 * appearance need a layout engine and a stylesheet, so the component's declared
 * contract is asserted here — and the emitted stylesheet, not this file, is the proof
 * that the ring and the 44px target reach the browser.
 */

const FOCUS_RING_COLOR = /focus-visible:outline-\[color:var\(--focus-ring-color\)\]/;
const FOCUS_RING_OFFSET = /focus-visible:outline-offset-\[length:var\(--focus-ring-offset\)\]/;

function openTrigger(): HTMLElement {
  return screen.getByRole("button", { name: "Open navigation menu" });
}

function panelOf(trigger: HTMLElement): HTMLElement {
  const id = trigger.getAttribute("aria-controls");
  expect(id, "the trigger must reference the panel it controls").toBeTruthy();

  const panel = id ? document.getElementById(id) : null;
  expect(panel, `aria-controls="${id}" must resolve to an element`).not.toBeNull();

  if (!panel) throw new Error("panel element not found");
  return panel;
}

describe("mobile navigation accessibility", () => {
  it("names the trigger for the action and reports its state", () => {
    render(<Header />);

    const trigger = openTrigger();
    expect(trigger).toHaveAccessibleName("Open navigation menu");
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger);

    expect(screen.getByRole("button", { name: "Close navigation menu" })).toBe(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("exposes the panel as a named navigation landmark", () => {
    render(<Header />);

    const trigger = openTrigger();
    fireEvent.click(trigger);

    // The panel is the landmark the trigger controls, and exactly one landmark carries
    // this name, so the mobile navigation is distinguishable from the desktop row.
    const landmarks = screen.getAllByRole("navigation", { name: "Mobile navigation" });
    expect(landmarks).toHaveLength(1);
    expect(landmarks[0]).toBe(panelOf(trigger));
  });

  it("keeps the toggle icon out of the accessibility tree", () => {
    render(<Header />);

    expect(openTrigger().querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("declares a 44x44 target and the shared token focus ring on every control it adds", () => {
    render(<Header />);

    const trigger = openTrigger();
    expect(trigger.className).toMatch(/\bh-11\b/);
    expect(trigger.className).toMatch(/\bw-11\b/);
    expect(trigger.className).toMatch(FOCUS_RING_COLOR);
    expect(trigger.className).toMatch(FOCUS_RING_OFFSET);

    fireEvent.click(trigger);

    const links = within(panelOf(trigger)).getAllByRole("link");
    expect(links).toHaveLength(7);

    for (const link of links) {
      expect(link.className).toMatch(/\bmin-h-11\b/);
      expect(link.className).toMatch(FOCUS_RING_COLOR);
    }
  });
});
