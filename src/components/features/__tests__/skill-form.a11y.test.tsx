import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SkillForm } from "../SkillForm";
import { useRouter } from "@tanstack/react-router";

vi.mock("../../../hooks/use-toast-mutation", () => ({
  useToastMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));

vi.mock("@tanstack/react-router", () => ({
  useRouter: vi.fn(),
}));

const mockUseRouter = useRouter as unknown as { mockReturnValue: (v: unknown) => void };

describe("SkillForm label association (Phase 6 a11y)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({ navigate: vi.fn() });
  });

  it("associates the form labels with their controls through htmlFor/id", () => {
    render(<SkillForm mode="create" />);

    expect(screen.getByLabelText("Name")).toHaveAttribute("id", "name");
    expect(screen.getByLabelText("Icon (React Icon Name)")).toHaveAttribute("id", "icon");
    expect(screen.getByRole("combobox", { name: "Category" })).toHaveAttribute("id", "category");
  });

  it("keeps the select chevron decorative so it cannot pollute the accessible name", () => {
    render(<SkillForm mode="create" />);

    const select = screen.getByRole("combobox", { name: "Category" });
    const chevron = select.parentElement?.querySelector("svg");
    expect(chevron).not.toBeNull();
    expect(chevron).toHaveAttribute("aria-hidden", "true");
  });
});
