import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AdminHeader } from "../AdminHeader";
import { useAuth } from "../../../hooks/use-auth";

vi.mock("../../../hooks/use-auth", () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = useAuth as unknown as { mockReturnValue: (v: unknown) => void };

describe("AdminHeader icon-only control (Phase 2 a11y)", () => {
  it("resolves an accessible name for the icon-only sidebar toggle button", () => {
    mockUseAuth.mockReturnValue({ isLoading: false });
    render(<AdminHeader onToggleSidebar={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Toggle navigation sidebar" })).toBeInTheDocument();
  });
});
