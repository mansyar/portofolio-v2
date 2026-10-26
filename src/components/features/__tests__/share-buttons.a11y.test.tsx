import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ShareButtons } from "../ShareButtons";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("ShareButtons accessible names (Phase 2 a11y)", () => {
  it("names every icon-only share control", () => {
    render(<ShareButtons url="https://example.com/post" title="Hello" />);

    expect(screen.getByRole("link", { name: "Share on Twitter" })).toHaveAttribute(
      "target",
      "_blank"
    );
    expect(screen.getByRole("link", { name: "Share on LinkedIn" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy link" })).toBeInTheDocument();
  });
});
