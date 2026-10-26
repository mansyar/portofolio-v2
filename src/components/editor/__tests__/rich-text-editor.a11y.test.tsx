import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { RichTextEditor } from "../RichTextEditor";

describe("RichTextEditor accessible name (Phase 2 a11y)", () => {
  it("names the contenteditable region from the visible label text via aria-labelledby", () => {
    render(
      <RichTextEditor
        label="Content"
        content="<p>Hello</p>"
        onChange={vi.fn()}
        placeholder="Write your story"
      />
    );

    const editor = screen.getByRole("textbox", { name: "Content" });
    expect(editor).toHaveAttribute("aria-labelledby");
    // The visible label text is preserved (Tiptap cannot host a native
    // <label>; the association is made through aria-labelledby instead).
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("gives every icon-only toolbar button an accessible name via its title", () => {
    render(<RichTextEditor content="" onChange={vi.fn()} />);

    for (const name of ["Bold", "Italic", "Inline Code", "Undo", "Redo"]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
  });
});
