import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Button } from "../button";

describe("Button primitive explicit type and names (Phase 3 a11y)", () => {
  it("defaults to type='button' so it can never implicitly submit a form", () => {
    const handleSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <form onSubmit={handleSubmit}>
        <Button>Save</Button>
      </form>
    );

    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveAttribute("type", "button");
    fireEvent.click(button);
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("preserves an explicit type='submit' and submits the enclosing form on click", () => {
    const handleSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <form onSubmit={handleSubmit}>
        <Button type="submit">Save Profile</Button>
      </form>
    );

    const button = screen.getByRole("button", { name: "Save Profile" });
    expect(button).toHaveAttribute("type", "submit");
    fireEvent.click(button);
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  it("keeps variant and size props working alongside the type default", () => {
    render(
      <Button variant="secondary" size="lg">
        Download PDF
      </Button>
    );

    const button = screen.getByRole("button", { name: "Download PDF" });
    expect(button).toHaveClass("btn", "btn-secondary", "btn-lg");
    expect(button).toHaveAttribute("type", "button");
  });

  it("resolves its accessible name from its text content and fires the action handler", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Copy Link</Button>);

    const button = screen.getByRole("button", { name: "Copy Link" });
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

describe("Literal button submit classification (Phase 3 a11y)", () => {
  it("a submit-intent button inside a form submits it on click", () => {
    const handleSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <form onSubmit={handleSubmit}>
        <input />
        {/* Classification: no onClick, lives inside <form onSubmit> — implicit
            submit is the intent, so the sweep gave it type="submit". */}
        <button type="submit">Add Education</button>
      </form>
    );

    fireEvent.click(screen.getByRole("button", { name: "Add Education" }));
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  it("a plain action button does not submit its enclosing form", () => {
    const handleSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    const handleDelete = vi.fn();
    render(
      <form onSubmit={handleSubmit}>
        <input />
        {/* Classification: has its own onClick action — never a submit intent. */}
        <button type="button" onClick={handleDelete}>
          [del]
        </button>
      </form>
    );

    fireEvent.click(screen.getByRole("button", { name: "[del]" }));
    expect(handleDelete).toHaveBeenCalledTimes(1);
    expect(handleSubmit).not.toHaveBeenCalled();
  });
});
