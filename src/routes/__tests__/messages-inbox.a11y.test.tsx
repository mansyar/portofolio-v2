import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminMessagesInbox } from "../admin/messages";
import { useQuery, useMutation } from "convex/react";

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock("../../../convex/_generated/api", () => ({
  api: {
    contact: {
      listAll: "contact.listAll",
      markAsRead: "contact.markAsRead",
      remove: "contact.remove",
    },
  },
}));

// as-cast justified: vi.mock swaps each hook for an untyped vi.fn(), structurally
// incompatible with the hook's signature — the casts reach mockReturnValue.
const mockUseQuery = useQuery as unknown as { mockReturnValue: (v: unknown) => void };
const mockUseMutation = useMutation as unknown as { mockReturnValue: (v: unknown) => void };

describe("AdminMessagesInbox row actions (Phase 1 a11y)", () => {
  const markAsRead = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue([
      {
        _id: "m1",
        _creationTime: Date.UTC(2026, 0, 15, 9, 30),
        name: "Jane Doe",
        email: "jane@example.com",
        subject: "Collaboration",
        message: "Hello there",
        isRead: false,
      },
    ]);
    mockUseMutation.mockReturnValue(markAsRead);
  });

  it("keeps the row actions reachable by role and name", () => {
    render(<AdminMessagesInbox />);

    expect(screen.getByRole("button", { name: "Mark as read" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("activates the read toggle without expanding the row", async () => {
    render(<AdminMessagesInbox />);

    const toggle = screen.getByRole("button", { name: "Mark as read" });
    // Native <button>: Enter/Space produce a click event (see jsdom note in
    // admin-layout.a11y.test.tsx).
    fireEvent.keyDown(toggle, { key: "Enter" });
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(markAsRead).toHaveBeenCalledWith({ id: "m1", isRead: true });
    });
    // stopPropagation lives on the button now, so the row does not expand.
    expect(screen.queryByText("Hello there")).not.toBeInTheDocument();
  });

  it("still expands the message body when the row itself is activated", () => {
    render(<AdminMessagesInbox />);

    fireEvent.click(screen.getByText("Collaboration"));

    expect(screen.getByText("Hello there")).toBeInTheDocument();
  });
});
