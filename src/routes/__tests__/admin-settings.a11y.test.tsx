import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminSettings } from "../admin/settings";
import { useQuery } from "convex/react";

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
}));

vi.mock("../../hooks/use-toast-mutation", () => ({
  useToastMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));

const mockUseQuery = useQuery as unknown as { mockReturnValue: (v: unknown) => void };

const emptySettings = {
  siteTitle: "",
  metaDescription: "",
  defaultOgImage: "",
  socialTwitter: "",
  socialLinkedIn: "",
  socialGitHub: "",
};

describe("AdminSettings label association (Phase 2 a11y)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue(emptySettings);
  });

  it("associates the site title field with its visible label", () => {
    render(<AdminSettings />);

    expect(screen.getByLabelText(/Site Title/)).toHaveAttribute("id", "settings-siteTitle");
  });

  it("associates every social-link field with its visible label", async () => {
    render(<AdminSettings />);

    fireEvent.click(screen.getByRole("button", { name: "SOCIAL_LINKS" }));

    expect(await screen.findByLabelText(/Twitter URL/)).toHaveAttribute(
      "id",
      "settings-socialTwitter"
    );
    expect(screen.getByLabelText(/LinkedIn URL/)).toHaveAttribute("id", "settings-socialLinkedIn");
    expect(screen.getByLabelText(/GitHub URL/)).toHaveAttribute("id", "settings-socialGitHub");
  });

  it("associates the seo-tab fields after switching tabs", async () => {
    render(<AdminSettings />);

    fireEvent.click(screen.getByRole("button", { name: "SEO_DEFAULTS" }));

    expect(await screen.findByLabelText(/Global Meta Description/)).toHaveAttribute(
      "id",
      "settings-metaDescription"
    );
    expect(screen.getByLabelText(/Default OG Image URL/)).toHaveAttribute(
      "id",
      "settings-defaultOgImage"
    );
  });
});
