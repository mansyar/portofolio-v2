import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Seo } from "../seo";

// Mock convex/react useQuery
vi.mock("convex/react", () => ({
  useQuery: () => ({
    siteTitle: "Test Site",
    metaDescription: "Test meta description",
    defaultOgImage: "/og.jpg",
    socialTwitter: "@test",
  }),
}));

// Seo uses useLocation from @tanstack/react-router which we mocked in vitest.setup.tsx

describe("Seo Component", () => {
  it("composes the title once, from a bare page title", () => {
    render(<Seo title="About Me" description="Test Description" />);

    // The page supplies a bare title; the component adds the site name exactly once.
    expect(document.title).toBe("About Me | Test Site");
    expect(document.querySelectorAll("title")).toHaveLength(1);
  });

  it("generates JSON-LD script tag", () => {
    const { container } = render(<Seo title="Test Title" description="Test Description" />);
    const scriptTag = container.querySelector('script[type="application/ld+json"]');

    expect(scriptTag).toBeInTheDocument();
    const content = JSON.parse(scriptTag?.textContent || "{}");
    expect(content.name).toContain("Test Title");
    expect(content.description).toBe("Test Description");
    expect(content.author.name).toBe("Muhammad Ansyar Rafi Putra");
  });

  it("renders keywords meta tag with default keywords", () => {
    render(<Seo title="Test Title" />);
    const keywordsMeta = document.querySelector('meta[name="keywords"]');

    expect(keywordsMeta).toBeInTheDocument();
    expect(keywordsMeta?.getAttribute("content")).toContain("Muhammad Ansyar Rafi Putra");
  });

  it("renders author meta tag", () => {
    render(<Seo title="Test Title" />);
    const authorMeta = document.querySelector('meta[name="author"]');

    expect(authorMeta).toBeInTheDocument();
    expect(authorMeta?.getAttribute("content")).toBe("Muhammad Ansyar Rafi Putra");
  });
});
