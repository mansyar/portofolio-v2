import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NotFound } from "../NotFound";
import { DEFAULT_SITE_NAME } from "../../lib/site";

// NotFound renders Seo, which reads site settings; no Convex client is present.
vi.mock("convex/react", () => ({
  useQuery: () => undefined,
}));

describe("NotFound", () => {
  it("owns one noindex title", () => {
    render(<NotFound />);

    expect(document.title).toBe(`Page not found | ${DEFAULT_SITE_NAME}`);
    expect(document.querySelectorAll("title")).toHaveLength(1);
    expect(document.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe("noindex");
    expect(screen.getByRole("heading", { name: /404/i })).toBeInTheDocument();
  });
});
