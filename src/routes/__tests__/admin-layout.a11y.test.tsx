import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminLayout } from "../admin";
import { useConvexAuth } from "convex/react";
import { useRouter, useRouterState } from "@tanstack/react-router";

vi.mock("convex/react", () => ({
  useConvexAuth: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => options,
  useRouter: vi.fn(),
  useRouterState: vi.fn(),
  Outlet: () => <div data-testid="outlet" />,
}));

vi.mock("../../components/layout/AdminSidebar", () => ({
  AdminSidebar: () => <nav data-testid="admin-sidebar" />,
}));

vi.mock("../../components/layout/AdminHeader", () => ({
  AdminHeader: ({ onToggleSidebar }: { onToggleSidebar: () => void }) => (
    <button type="button" onClick={onToggleSidebar}>
      toggle-sidebar
    </button>
  ),
}));

vi.mock("../../styles/admin.css", () => ({}));

const mockUseConvexAuth = useConvexAuth as unknown as {
  mockReturnValue: (v: unknown) => void;
};
const mockUseRouter = useRouter as unknown as { mockReturnValue: (v: unknown) => void };
const mockUseRouterState = useRouterState as unknown as {
  mockReturnValue: (v: unknown) => void;
};

/**
 * jsdom does not synthesize click events from keyboard activation, and
 * @testing-library/user-event is not a dependency (NFR-2). Native <button>
 * semantics guarantee Enter/Space activation in real browsers; here we assert
 * the activation handler fires via the click event that activation produces.
 */
const activateWithKeyboard = (element: Element, key: string) => {
  fireEvent.keyDown(element, { key });
  fireEvent.click(element);
};

describe("AdminLayout mobile drawer close control (Phase 1 a11y)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseConvexAuth.mockReturnValue({ isLoading: false, isAuthenticated: true });
    mockUseRouter.mockReturnValue({ navigate: vi.fn() });
    mockUseRouterState.mockReturnValue({ location: { pathname: "/admin" } });
  });

  it("exposes a reachable button to close the mobile drawer, active via keyboard", () => {
    render(<AdminLayout />);

    expect(screen.getByTestId("admin-sidebar")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close navigation menu" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "toggle-sidebar" }));

    const close = screen.getByRole("button", { name: "Close navigation menu" });
    expect(close).toBeInTheDocument();

    activateWithKeyboard(close, "Enter");
    expect(screen.queryByRole("button", { name: "Close navigation menu" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "toggle-sidebar" }));
    activateWithKeyboard(screen.getByRole("button", { name: "Close navigation menu" }), " ");
    expect(screen.queryByRole("button", { name: "Close navigation menu" })).not.toBeInTheDocument();
  });
});
