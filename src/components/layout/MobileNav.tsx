import { useEffect, useId, useRef, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";

export interface NavDestination {
  name: string;
  path: string;
}

interface MobileNavProps {
  destinations: NavDestination[];
}

/**
 * Token-driven focus ring, matching the `.btn` and `.input` rules in the
 * co-located primitives: same colour token, same offset token, no raw hex.
 * The `color:`/`length:` hints keep Tailwind from guessing which arbitrary
 * value belongs to `outline-color` and which to `outline-offset`.
 */
const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-[color:var(--focus-ring-color)] focus-visible:outline-offset-[length:var(--focus-ring-offset)]";

/**
 * The public header's navigation below the `md` breakpoint.
 *
 * The trigger is a disclosure, not a modal: focus stays where the user put it,
 * Escape closes and returns focus to the trigger, and the panel leaves the
 * accessibility tree while it is closed. The `md:hidden` root keeps the whole
 * control out of the desktop layout, where the header's own row is the
 * navigation.
 */
export function MobileNav({ destinations }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();

  // Navigating is the one dismissal the user does not have to ask for: the panel is
  // closed on mount, and every later route change closes it again. Keyed on the
  // pathname rather than on a click handler, so a link that navigates by any other
  // means — keyboard, middle click, a programmatic push — closes it too.
  //
  // Adjusting state during render, rather than in an effect, is React's own guidance
  // for reacting to a changed value: the panel is never committed once more in its
  // open state, and the effect would have had no dependency to legitimately declare.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setIsOpen(false);
  }

  useEffect(() => {
    if (!isOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsOpen(false);
      triggerRef.current?.focus();
    };

    const closeOnOutsidePointer = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (panelRef.current?.contains(target) ?? false) return;
      if (triggerRef.current?.contains(target) ?? false) return;
      setIsOpen(false);
    };

    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("mousedown", closeOnOutsidePointer);

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("mousedown", closeOnOutsidePointer);
    };
  }, [isOpen]);

  return (
    <div className="md:hidden">
      <button
        ref={triggerRef}
        type="button"
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((open) => !open)}
        className={`flex h-11 w-11 items-center justify-center rounded-md border border-(--color-border) bg-(--color-surface-dark)/40 text-(--color-text-primary) transition-colors hover:border-(--color-ubuntu-orange) hover:text-(--color-ubuntu-orange) ${FOCUS_RING}`}
      >
        {isOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
      </button>

      {/* Kept in the document but `hidden` while closed: aria-controls always
          resolves, and the panel is out of the accessibility tree until it opens.
          Absolutely positioned under the sticky header, so opening shifts nothing. */}
      <nav
        ref={panelRef}
        id={panelId}
        hidden={!isOpen}
        aria-label="Mobile navigation"
        className="absolute inset-x-0 top-full border-b border-(--color-border) bg-(--color-bg-primary) shadow-lg"
      >
        <ul className="container mx-auto flex flex-col px-4 py-2 md:px-6">
          {destinations.map((destination) => (
            <li key={destination.path}>
              <Link
                to={destination.path}
                className={`flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-(--color-text-secondary) transition-colors hover:bg-(--color-surface-dark)/50 hover:text-(--color-text-primary) ${FOCUS_RING}`}
              >
                {destination.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
