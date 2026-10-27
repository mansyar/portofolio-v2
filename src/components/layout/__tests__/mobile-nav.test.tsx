import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useLocation } from "@tanstack/react-router";
import Header from "../../Header";

/**
 * The public header's mobile navigation contract.
 *
 * Two properties of this codebase shape the assertions below:
 *
 * 1. The desktop row's links are always in the document — they are hidden by a
 *    responsive class, not removed — so "a link named Projects exists" would pass with
 *    no mobile panel at all. Every panel assertion therefore resolves the panel through
 *    the trigger's `aria-controls` and reads links *inside* that element.
 * 2. The shared test setup renders `Link` as a plain anchor and replaces `useLocation`
 *    with a stub. Route-change behaviour is expressed by re-rendering with a new
 *    pathname, which means the panel must close because the location changed — not
 *    because a click handler was passed to `Link`.
 *
 * The panel must leave the accessibility tree while it is closed. Not rendering it and
 * rendering it `hidden` both satisfy that: role queries ignore hidden elements either
 * way, so `exposedPanelLinks` returns nothing in both shapes.
 */

const DESTINATIONS: Array<{ name: string; href: string }> = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Skills", href: "/skills" },
  { name: "Projects", href: "/projects" },
  { name: "Blog", href: "/blog" },
  { name: "Uses", href: "/uses" },
  { name: "Contact", href: "/contact" },
];

const OPEN_LABEL = "Open navigation menu";
const CLOSE_LABEL = "Close navigation menu";

// as-cast justified: the shared setup swaps useLocation for a vi.fn() that returns only
// a pathname, while the real signature is a large generated type.
const mockedUseLocation = useLocation as unknown as {
  mockReturnValue: (value: { pathname: string }) => void;
};

afterEach(() => {
  mockedUseLocation.mockReturnValue({ pathname: "/" });
});

function openTrigger(): HTMLElement {
  return screen.getByRole("button", { name: OPEN_LABEL });
}

/** Opens the panel and returns the trigger that controls it. */
function openMenu(): HTMLElement {
  const trigger = openTrigger();
  fireEvent.click(trigger);
  return trigger;
}

function panelOf(trigger: HTMLElement): HTMLElement {
  const id = trigger.getAttribute("aria-controls");
  expect(id, "the trigger must name the panel it controls").toBeTruthy();

  const panel = id ? document.getElementById(id) : null;
  expect(panel, `aria-controls="${id}" must resolve to an element`).not.toBeNull();

  if (!panel) throw new Error("panel element not found");
  return panel;
}

/** Links the panel actually exposes — empty while it is closed or not rendered. */
function exposedPanelLinks(trigger: HTMLElement): HTMLElement[] {
  const id = trigger.getAttribute("aria-controls");
  const panel = id ? document.getElementById(id) : null;
  return panel ? within(panel).queryAllByRole("link") : [];
}

function isClosed(trigger: HTMLElement): boolean {
  return (
    trigger.getAttribute("aria-expanded") === "false" && exposedPanelLinks(trigger).length === 0
  );
}

describe("mobile navigation trigger", () => {
  it("offers a control for opening the navigation without disturbing the desktop row", () => {
    render(<Header />);

    expect(openTrigger()).toBeInTheDocument();

    const hrefs = screen.getAllByRole("link").map((link) => link.getAttribute("href"));
    expect(hrefs).toEqual(expect.arrayContaining(DESTINATIONS.map(({ href }) => href)));
  });

  it("reports its state and points at the panel it controls", () => {
    render(<Header />);

    const trigger = openTrigger();
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: CLOSE_LABEL })).toBe(trigger);
    expect(panelOf(trigger)).toBeInTheDocument();

    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});

describe("mobile panel contents", () => {
  it("exposes nothing through the panel until it is opened", () => {
    render(<Header />);

    expect(exposedPanelLinks(openTrigger())).toHaveLength(0);
  });

  it("lists exactly the seven destinations, in order, as in-app links", () => {
    render(<Header />);

    const links = exposedPanelLinks(openMenu());

    expect(links.map((link) => link.textContent?.trim())).toEqual(
      DESTINATIONS.map(({ name }) => name)
    );
    expect(links.map((link) => link.getAttribute("href"))).toEqual(
      DESTINATIONS.map(({ href }) => href)
    );
  });
});

describe("mobile panel dismissal", () => {
  it("closes on Escape and leaves focus on the trigger", () => {
    render(<Header />);

    const trigger = openMenu();
    trigger.focus();
    fireEvent.keyDown(document, { key: "Escape" });

    expect(isClosed(trigger)).toBe(true);
    expect(trigger).toHaveFocus();
  });

  it("closes on an interaction outside the panel", () => {
    render(<Header />);

    const trigger = openMenu();
    fireEvent.mouseDown(document.body);

    expect(isClosed(trigger)).toBe(true);
  });

  it("stays open on an interaction inside the panel", () => {
    render(<Header />);

    const trigger = openMenu();
    const panel = panelOf(trigger);
    fireEvent.mouseDown(panel);

    expect(exposedPanelLinks(trigger)).toHaveLength(DESTINATIONS.length);
  });

  it("closes when the route changes", () => {
    const { rerender } = render(<Header />);

    const trigger = openMenu();
    mockedUseLocation.mockReturnValue({ pathname: "/projects" });
    rerender(<Header />);

    expect(isClosed(trigger)).toBe(true);
  });
});
