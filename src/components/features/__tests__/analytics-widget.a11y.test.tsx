import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AnalyticsWidget } from "../AnalyticsWidget";
import { useAction } from "convex/react";

vi.mock("convex/react", () => ({
  useAction: vi.fn(),
}));

const mockUseAction = useAction as unknown as { mockReturnValue: (v: unknown) => void };

const stats = {
  visitors: { value: 12, change: 1 },
  pageviews: { value: 30, change: 2 },
  visits: { value: 20, change: 0 },
  bounces: { value: 5, change: 0 },
  activeVisitors: 4,
};

describe("AnalyticsWidget dynamic regions (Phase 2 a11y)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAction.mockReturnValue(vi.fn().mockResolvedValue(stats));
  });

  it("resolves an accessible name for the icon-only refresh control", async () => {
    render(<AnalyticsWidget />);

    await screen.findByText("Active Now");
    expect(screen.getByRole("button", { name: "Refresh analytics" })).toBeInTheDocument();
  });

  it("exposes the live active-visitor count as a polite status region", async () => {
    render(<AnalyticsWidget />);

    await screen.findByText("Active Now");
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Active Now");
    expect(status).toHaveTextContent("4");
    expect(status).not.toHaveAttribute("aria-live", "assertive");
  });
});
