import { StrictMode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMutation } from "convex/react";
import { UnsubscribePage } from "../newsletter/unsubscribe";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => options,
}));

vi.mock("convex/react", () => ({
  useMutation: vi.fn(),
}));

vi.mock("../../components/seo", () => ({
  Seo: () => null,
}));

// as-cast justified: vi.mock swaps the hook for an untyped vi.fn(), structurally
// incompatible with the hook's signature — the cast reaches the mock controls.
const mockUseMutation = useMutation as unknown as { mockReturnValue: (v: unknown) => void };

describe("newsletter unsubscribe page", () => {
  const unsubscribe = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMutation.mockReturnValue(unsubscribe);
  });

  it("explains a link with no token instead of calling the mutation", () => {
    render(<UnsubscribePage />);

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/missing its token/i);
    expect(unsubscribe).not.toHaveBeenCalled();
  });

  it("unsubscribes once with the token and announces the result", async () => {
    unsubscribe.mockResolvedValue({ success: true, status: "unsubscribed" });

    render(
      <StrictMode>
        <UnsubscribePage token="token-abc" />
      </StrictMode>
    );

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/you're unsubscribed/i);
    });
    // StrictMode runs the effect twice; the guard must keep this to one call.
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(unsubscribe).toHaveBeenCalledWith({ token: "token-abc" });
  });

  it("acts on a second token opened in the same tab", async () => {
    unsubscribe.mockResolvedValue({ success: true, status: "unsubscribed" });

    const { rerender } = render(<UnsubscribePage token="token-first" />);
    await waitFor(() => expect(unsubscribe).toHaveBeenCalledWith({ token: "token-first" }));

    // Same route, different search: a one-shot boolean guard would stop here.
    rerender(<UnsubscribePage token="token-second" />);

    await waitFor(() => expect(unsubscribe).toHaveBeenCalledWith({ token: "token-second" }));
    expect(unsubscribe).toHaveBeenCalledTimes(2);
  });

  it("reports a failure without claiming success", async () => {
    unsubscribe.mockRejectedValue(new Error("network"));

    render(<UnsubscribePage token="token-abc" />);

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/couldn't update/i);
    });
  });
});
