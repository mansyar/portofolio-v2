import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminSidebar } from "../AdminSidebar";
import { useAuth } from "../../../hooks/use-auth";
import { useQuery } from "convex/react";
import type { ReactNode } from "react";

vi.mock("../../../hooks/use-auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

// as-cast justified: vi.mock swaps each hook for an untyped vi.fn(), structurally
// incompatible with the hook's signature — the casts reach mockReturnValue.
const mockUseAuth = useAuth as unknown as { mockReturnValue: (v: unknown) => void };
const mockUseQuery = useQuery as unknown as { mockReturnValue: (v: unknown) => void };

describe("AdminSidebar navigation and sign-out control (Phase 6 a11y)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ signOut: vi.fn() });
    mockUseQuery.mockReturnValue(undefined);
  });

  it("resolves accessible names for the navigation links", () => {
    render(<AdminSidebar />);

    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Messages" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Settings" })).toBeInTheDocument();
  });

  it("keeps the sign-out control an explicit-typed button with a resolved name", () => {
    render(<AdminSidebar />);

    expect(screen.getByRole("button", { name: "Sign Out" })).toHaveAttribute("type", "button");
  });
});
