import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminLogin } from "../admin/login";
import { useAuth } from "../../hooks/use-auth";
import { useRouter } from "@tanstack/react-router";

vi.mock("../../hooks/use-auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => options,
  useRouter: vi.fn(),
}));

vi.mock("../../styles/admin.css", () => ({}));

const mockUseAuth = useAuth as unknown as { mockReturnValue: (v: unknown) => void };
const mockUseRouter = useRouter as unknown as { mockReturnValue: (v: unknown) => void };

describe("AdminLogin (Phase 1 a11y)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      signIn: vi.fn().mockResolvedValue(undefined),
      isAuthenticated: false,
      isLoading: false,
    });
    mockUseRouter.mockReturnValue({ navigate: vi.fn() });
  });

  it("renders the email input reachable by role and visible label", () => {
    render(<AdminLogin />);

    const emailInput = screen.getByRole("textbox");
    expect(emailInput).toHaveAttribute("type", "email");
    expect(screen.getByPlaceholderText("admin@ansyar-world.top")).toBe(emailInput);
    // The visible "Email" label is present; full programmatic label association
    // lands in Phase 2 (noLabelWithoutControl).
    expect(screen.getByText("Email")).toBeInTheDocument();
  });

  it("does not autofocus the email input on mount (FR-6)", () => {
    render(<AdminLogin />);

    expect(screen.getByRole("textbox")).not.toHaveFocus();
  });
});
