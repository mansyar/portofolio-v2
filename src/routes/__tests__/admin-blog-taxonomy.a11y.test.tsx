import { render, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { CategoriesAdmin } from "../admin/blog/categories";
import { TagsAdmin } from "../admin/blog/tags";
import { useQuery, useMutation } from "convex/react";

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => options,
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

const mockUseQuery = useQuery as unknown as { mockReturnValue: (v: unknown) => void };
const mockUseMutation = useMutation as unknown as { mockReturnValue: (v: unknown) => void };

describe("Blog taxonomy create-form label association (Phase 2 a11y)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue([]);
    mockUseMutation.mockReturnValue(vi.fn());
  });

  it("associates the category form labels with their inputs", () => {
    const { container } = render(<CategoriesAdmin />);
    const form = container.querySelector("form");
    expect(form).not.toBeNull();

    const scoped = within(form as HTMLElement);
    expect(scoped.getByLabelText(/Name/)).toHaveAttribute("id", "category-name");
    expect(scoped.getByLabelText(/Slug/)).toHaveAttribute("id", "category-slug");
  });

  it("associates the tag form labels with their inputs", () => {
    const { container } = render(<TagsAdmin />);
    const form = container.querySelector("form");
    expect(form).not.toBeNull();

    const scoped = within(form as HTMLElement);
    expect(scoped.getByLabelText(/Name/)).toHaveAttribute("id", "tag-name");
    expect(scoped.getByLabelText(/Slug/)).toHaveAttribute("id", "tag-slug");
  });
});
