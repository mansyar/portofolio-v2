import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useQuery } from "convex/react";
import { Dashboard } from "../admin/index";

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
}));

vi.mock("../../../convex/_generated/api", () => ({
  api: {
    dashboard: {
      getStats: "dashboard.getStats",
      getRecentMessages: "dashboard.getRecentMessages",
    },
  },
}));

vi.mock("@/components/features/AnalyticsWidget", () => ({
  AnalyticsWidget: () => <div data-testid="analytics-widget" />,
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => options,
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

// as-cast justified: vi.mock swaps the hook for an untyped vi.fn(), structurally
// incompatible with the hook's signature — the cast reaches mockImplementation.
const mockUseQuery = useQuery as unknown as {
  mockImplementation: (implementation: (query: unknown) => unknown) => void;
};

describe("admin dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockImplementation((query) =>
      query === "dashboard.getStats"
        ? { projects: 4, skills: 12, blogPosts: 7, unreadMessages: 2 }
        : []
    );
  });

  it("links View All to the messages inbox", () => {
    render(<Dashboard />);

    expect(screen.getByRole("link", { name: /view all/i })).toHaveAttribute(
      "href",
      "/admin/messages"
    );
  });

  it("links Draft New Post to the blog editor", () => {
    render(<Dashboard />);

    expect(screen.getByRole("link", { name: /draft new post/i })).toHaveAttribute(
      "href",
      "/admin/blog/new"
    );
  });

  it("does not render invented system metrics", () => {
    render(<Dashboard />);

    for (const text of [/99\.9%/, /456\s?mb/i, /cpu:/i, /memory:/i, /disk:/i, /system status/i]) {
      expect(screen.queryByText(text)).not.toBeInTheDocument();
    }
  });
});
