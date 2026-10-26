import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { BlogContent } from "../BlogContent";

vi.mock("@convex-dev/react-query", () => ({
  convexQuery: vi.fn((query: unknown, args: unknown) => ({ query, args })),
}));

vi.mock("@tanstack/react-query", () => ({
  useSuspenseQuery: vi.fn(),
}));

vi.mock("../../../../../convex/_generated/api", () => ({
  api: { blog: { listPublished: "blog.listPublished" } },
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

// as-cast justified: vi.mock swaps each hook for an untyped vi.fn(), structurally
// incompatible with the hook's signature — the casts reach the mock controls.
const mockConvexQuery = convexQuery as unknown as { mock: { calls: unknown[][] } };
const mockUseSuspenseQuery = useSuspenseQuery as unknown as {
  mockReturnValue: (v: unknown) => void;
};

function post(slug: string, title: string) {
  return {
    _id: slug,
    slug,
    title,
    excerpt: `${title} excerpt`,
    publishedAt: Date.UTC(2026, 0, 15),
    readingTime: 3,
  };
}

function primeResult(result: { posts: unknown[]; total: number; totalPages: number }) {
  mockUseSuspenseQuery.mockReturnValue({ data: result });
}

describe("BlogContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("asks the backend for the requested page and filter", () => {
    primeResult({ posts: [post("shipping-fast", "Shipping fast")], total: 1, totalPages: 1 });

    render(<BlogContent page={2} category="devops" tag="react" />);

    const [query, args] = mockConvexQuery.mock.calls.at(-1) as [unknown, unknown];
    expect(query).toBe("blog.listPublished");
    expect(args).toEqual({
      page: 2,
      pageSize: 9,
      categorySlug: "devops",
      tagSlug: "react",
    });
  });

  it("renders the posts the server returned instead of re-filtering them", () => {
    // `reactive-ui` contains the tag text but is not tagged with it. If the component
    // ever goes back to filtering by slug, this post disappears and the test fails.
    primeResult({
      posts: [post("shipping-fast", "Shipping fast"), post("reactive-ui", "Reactive UI")],
      total: 2,
      totalPages: 1,
    });

    render(<BlogContent page={1} tag="react" />);

    expect(screen.getByText("Shipping fast")).toBeInTheDocument();
    expect(screen.getByText("Reactive UI")).toBeInTheDocument();
  });

  it("shows the empty state and no pagination when nothing matches", () => {
    primeResult({ posts: [], total: 0, totalPages: 0 });

    render(<BlogContent page={1} tag="unknown" />);

    expect(screen.getByText(/no posts found/i)).toBeInTheDocument();
    expect(screen.queryByText(/next >/i)).not.toBeInTheDocument();
  });

  it("renders pagination from the total the server reported", () => {
    primeResult({ posts: [post("post-1", "Post one")], total: 20, totalPages: 3 });

    render(<BlogContent page={1} />);

    // The current page renders as "[1]" in the shared control.
    expect(screen.getByText("[1]")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.queryByText("4")).not.toBeInTheDocument();
  });
});
