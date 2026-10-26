import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Route as ResumeRoute } from "../admin/resume";
import { useQuery, useMutation } from "convex/react";
import type { ComponentType } from "react";

// as-cast justified: TanStack's createFileRoute() return type does not expose
// .component — the cast reads it off the route module for rendering.
const AdminResumePage = (ResumeRoute as unknown as { component: ComponentType }).component;

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => options,
}));

// as-cast justified: vi.mock swaps each hook for an untyped vi.fn(), structurally
// incompatible with the hook's signature — the casts reach mockReturnValue.
const mockUseQuery = useQuery as unknown as { mockReturnValue: (v: unknown) => void };
const mockUseMutation = useMutation as unknown as { mockReturnValue: (v: unknown) => void };

const profile = {
  fullName: "Ansyar",
  services: ["React"],
  interests: ["Open Source"],
};

describe("AdminResume label association and button types (Phase 6 a11y)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue(profile);
    mockUseMutation.mockReturnValue(vi.fn());
  });

  it("gives every tab button an explicit type and a resolved accessible name", () => {
    render(<AdminResumePage />);

    for (const tab of ["Profile", "Experience", "Education", "Certifications"]) {
      expect(screen.getByRole("button", { name: tab })).toHaveAttribute("type", "button");
    }
  });

  it("associates the profile form labels with their controls through htmlFor/id", () => {
    render(<AdminResumePage />);

    expect(screen.getByLabelText("Full Name")).toHaveAttribute("id", "resume-profile-fullName");
    expect(screen.getByLabelText("Title")).toHaveAttribute("id", "resume-profile-title");
    expect(screen.getByLabelText("Email")).toHaveAttribute("id", "resume-profile-email");
    expect(screen.getByLabelText("Summary")).toHaveAttribute("id", "resume-profile-summary");
  });

  it("names the dynamic service and interest inputs with aria-label", () => {
    render(<AdminResumePage />);

    expect(screen.getByLabelText("Service 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Interest 1")).toBeInTheDocument();
  });

  it("keeps the submit button type=submit and the resume download button type=button", async () => {
    render(<AdminResumePage />);

    expect(screen.getByRole("button", { name: "Save Profile" })).toHaveAttribute("type", "submit");
    // DownloadResumeButton renders after the client-mount effect.
    expect(await screen.findByRole("button", { name: "Download PDF" })).toHaveAttribute(
      "type",
      "button"
    );
  });
});
