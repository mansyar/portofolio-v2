import type { ReactNode } from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLocation } from "@tanstack/react-router";
import Header from "../../Header";

interface MockLinkProps {
  children: ReactNode;
  to: string;
  className?: string;
  "aria-current"?: "page" | undefined;
}

/**
 * The shared setup renders `Link` as `({ children, to }) => <a href={to}>`, which
 * discards every other prop — including the `aria-current` and the class names the
 * active-destination assertions read. This file therefore owns a forwarding mock, the
 * same way src/routes/__tests__/blog-index-prefetch.test.tsx does.
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
 * The public header's mobile navigation contract.
 *
 * Two properties of this codebase shape the assertions below:
 *
 * 1. The desktop row's links are always in the document — they are hidden by a
 *    responsive class, not removed — so "a link named Projects exists" would pass with
 *    no mobile panel at all. Every panel assertion therefore resolves the panel through
 *    the trigger's `aria-controls` and reads links *inside* that element.
 * 2. This file replaces the router mock so `Link` forwards the props the assertions
 *    read, and `useLocation` stays a stub. Route-change behaviour is therefore
 *    expressed by re-rendering with a new pathname, which means the panel must close
 *    because the location changed — not because a click handler was passed to `Link`.
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

type MediaChangeListener = (event: { matches: boolean }) => void;

const mediaChangeListeners: MediaChangeListener[] = [];

beforeEach(() => {
  mediaChangeListeners.length = 0;
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: (_type: string, listener: MediaChangeListener) => {
        mediaChangeListeners.push(listener);
      },
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  );
});

afterEach(() => {
  mockedUseLocation.mockReturnValue({ pathname: "/" });
  vi.unstubAllGlobals();
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

describe("active destination", () => {
  it("marks the destination for the current route and nothing else", () => {
    render(<Header />);

    const marked = exposedPanelLinks(openMenu()).filter(
      (link) => link.getAttribute("aria-current") === "page"
    );

    expect(marked).toHaveLength(1);
    expect(marked[0]?.textContent?.trim()).toBe("Home");
  });

  it("marks it without relying on colour alone", () => {
    render(<Header />);

    const home = exposedPanelLinks(openMenu()).find((link) => link.textContent?.trim() === "Home");

    expect(home?.classList.contains("border-l-2")).toBe(true);
  });

  it("gives a destination its whole subtree rather than only its own path", () => {
    mockedUseLocation.mockReturnValue({ pathname: "/projects/ansyar-world" });
    render(<Header />);

    const marked = exposedPanelLinks(openMenu()).filter(
      (link) => link.getAttribute("aria-current") === "page"
    );

    expect(marked).toHaveLength(1);
    expect(marked[0]?.textContent?.trim()).toBe("Projects");
  });
});

describe("navigation exposure", () => {
  it("leaves exactly one navigation landmark exposed while the panel is closed", () => {
    render(<Header />);

    expect(screen.getAllByRole("navigation")).toHaveLength(1);
  });

  it("keeps the desktop row and the mobile control mutually exclusive", () => {
    render(<Header />);

    const trigger = openTrigger();
    const panel = panelOf(trigger);
    const desktopNav = screen.getByRole("navigation");

    // The desktop row is exposed only from `md` up; the trigger and its panel live in
    // a wrapper removed at `md`.
    expect(desktopNav.className).toMatch(/\bhidden\b/);
    expect(desktopNav.className).toMatch(/\bmd:flex\b/);

    const mobileRoot = trigger.parentElement;
    expect(mobileRoot?.classList.contains("md:hidden")).toBe(true);
    expect(mobileRoot?.contains(panel)).toBe(true);
  });
});

describe("panel motion", () => {
  it("declares its opening animation on the panel, where the reduced-motion guards reach it", () => {
    render(<Header />);

    expect(panelOf(openTrigger()).classList.contains("mobile-nav-panel")).toBe(true);
  });
});

describe("viewport changes", () => {
  it("closes the panel when the viewport crosses into the desktop layout", () => {
    render(<Header />);

    const trigger = openMenu();
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    // The component must have subscribed, or the assertion below would pass vacuously.
    expect(mediaChangeListeners.length).toBeGreaterThan(0);

    act(() => {
      for (const listener of mediaChangeListeners) listener({ matches: true });
    });

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(exposedPanelLinks(trigger)).toHaveLength(0);
  });

  it("caps the panel so a short viewport scrolls it instead of cutting destinations off", () => {
    render(<Header />);

    const classes = panelOf(openTrigger()).className;
    expect(classes).toMatch(/max-h-\[calc\(100vh_-_4rem\)\]/);
    expect(classes).toMatch(/\boverflow-y-auto\b/);
  });
});
