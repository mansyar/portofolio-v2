import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { Route as BlogRoute } from "../admin/blog";
import { useQuery, useMutation } from "convex/react";
import type { ComponentType } from "react";

// as-cast justified: TanStack's createFileRoute() return type does not expose
// .component — the cast reads it off the route module for rendering.
const BlogAdmin = (BlogRoute as unknown as { component: ComponentType }).component;

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => options,
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

// as-cast justified: vi.mock swaps each hook for an untyped vi.fn(), structurally
// incompatible with the hook's signature — the casts reach mockReturnValue.
const mockUseQuery = useQuery as unknown as { mockReturnValue: (v: unknown) => void };
const mockUseMutation = useMutation as unknown as { mockReturnValue: (v: unknown) => void };

const posts = [
  {
    _id: "p1",
    title: "First Post",
    slug: "first-post",
    status: "published",
    readingTime: 4,
    publishedAt: Date.UTC(2026, 0, 1),
  },
];

describe("Blog admin status region and action types (Phase 6 a11y)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue(posts);
    mockUseMutation.mockReturnValue(vi.fn());
  });

  it("exposes the post count as a status region", () => {
    render(<BlogAdmin />);

    expect(screen.getByRole("status")).toHaveTextContent("1 posts found.");
  });

  it("keeps the row action buttons explicit-typed and reachable by name", () => {
    render(<BlogAdmin />);

    expect(screen.getByRole("button", { name: "PUBLISHED" })).toHaveAttribute("type", "button");
    expect(screen.getByRole("button", { name: "Delete Post" })).toHaveAttribute("type", "button");
  });
});
