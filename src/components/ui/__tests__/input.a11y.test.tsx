import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Input } from "../input";

describe("Input primitive label association (Phase 2 a11y)", () => {
  it("associates the visible label with the input through htmlFor/id", () => {
    render(<Input label="Full Name" placeholder="Jane Doe" />);
    const input = screen.getByLabelText("Full Name");
    expect(input).toHaveAttribute("placeholder", "Jane Doe");
  });

  it("resolves the accessible name from the label, not the decorative '>' prompt glyph", () => {
    render(<Input label="Email" />);
    // An exact-name match fails if the '>' glyph leaked into the name.
    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input).toBeInTheDocument();
    // The prompt glyph is decorative and must not contribute to the name.
    expect(screen.getByText(">")).toHaveAttribute("aria-hidden", "true");
  });

  it("respects an explicit id passed by the caller", () => {
    render(<Input label="Website" id="contact-website" />);
    expect(screen.getByLabelText("Website")).toHaveAttribute("id", "contact-website");
  });
});
