import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BulkActionBar } from "../BulkActionBar";

const FakeIcon = (props: { size?: number }) => <span aria-hidden="true" {...props} />;

const actions = [
  { label: "Publish selected", icon: FakeIcon, onClick: vi.fn() },
  {
    label: "Delete selected",
    icon: FakeIcon,
    onClick: vi.fn(),
    variant: "danger" as const,
  },
];

describe("BulkActionBar dynamic regions and names (Phase 2 a11y)", () => {
  it("announces the bulk-selection count as a status region (never assertive)", () => {
    render(<BulkActionBar selectedCount={3} onClear={vi.fn()} actions={actions} />);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("3 items selected");
    expect(status).not.toHaveAttribute("aria-live", "assertive");
  });

  it("resolves accessible names for the clear and action controls", () => {
    render(<BulkActionBar selectedCount={1} onClear={vi.fn()} actions={actions} />);

    expect(screen.getByRole("button", { name: "Clear selection" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish selected" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete selected" })).toBeInTheDocument();
  });

  it("renders nothing when nothing is selected", () => {
    const { container } = render(
      <BulkActionBar selectedCount={0} onClear={vi.fn()} actions={actions} />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
