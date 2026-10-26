import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BlogPostForm } from "../BlogPostForm";
import { useQuery } from "convex/react";
import { useRouter } from "@tanstack/react-router";

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useRouter: vi.fn(),
}));

vi.mock("../../hooks/use-toast-mutation", () => ({
  useToastMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));

// The editor surface itself (contenteditable + aria-labelledby) is covered in
// src/components/editor/__tests__; stubbed here to keep this suite focused on
// the native form fields.
vi.mock("../editor/RichTextEditor", () => ({
  RichTextEditor: () => <div data-testid="rich-text-editor" />,
}));

const mockUseQuery = useQuery as unknown as { mockReturnValue: (v: unknown) => void };
const mockUseRouter = useRouter as unknown as { mockReturnValue: (v: unknown) => void };

describe("BlogPostForm label association (Phase 2 a11y)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue([]);
    mockUseRouter.mockReturnValue({ navigate: vi.fn() });
  });

  it("associates the main content fields with their visible labels", () => {
    render(<BlogPostForm mode="create" />);

    expect(screen.getByLabelText("Title")).toHaveAttribute("id", "blogpost-title");
    expect(screen.getByLabelText("Slug")).toHaveAttribute("id", "blogpost-slug");
    expect(screen.getByLabelText("Excerpt")).toHaveAttribute("id", "blogpost-excerpt");
  });

  it("associates the publishing sidebar fields with their visible labels", () => {
    render(<BlogPostForm mode="create" />);

    expect(screen.getByLabelText(/Schedule Publish/)).toHaveAttribute("id", "blogpost-scheduledAt");
    expect(screen.getByLabelText("Category")).toBe(screen.getByRole("combobox"));
    expect(screen.getByLabelText("Cover Image URL")).toBeInTheDocument();
  });
});
