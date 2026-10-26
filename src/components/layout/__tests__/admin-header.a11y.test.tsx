import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AdminHeader } from "../AdminHeader";
import { useAuth } from "../../../hooks/use-auth";

vi.mock("../../../hooks/use-auth", () => ({
  useAuth: vi.fn(),
}));

// as-cast justified: vi.mock swaps the hook for an untyped vi.fn(), structurally
// incompatible with the hook's signature — the cast reaches mockReturnValue.
const mockUseAuth = useAuth as unknown as { mockReturnValue: (v: unknown) => void };

describe("AdminHeader icon-only control (Phase 2 a11y)", () => {
  it("resolves an accessible name for the icon-only sidebar toggle button", () => {
    mockUseAuth.mockReturnValue({ isLoading: false });
    render(<AdminHeader onToggleSidebar={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Toggle navigation sidebar" })).toBeInTheDocument();
  });
});
