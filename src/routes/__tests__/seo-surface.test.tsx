import type { ReactNode } from "react";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { Route as AdminRoute } from "../admin";

// The route-test convention in this repository: return the options object so a
// route option such as `head` is reachable without booting a router.
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => options,
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
  useRouter: () => ({ navigate: vi.fn() }),
  useRouterState: () => ({ location: { pathname: "/admin" } }),
}));

vi.mock("convex/react", () => ({
  useConvexAuth: () => ({ isLoading: false, isAuthenticated: true }),
  useQuery: () => undefined,
}));

const projectRoot = process.cwd();
const ownerName = "Muhammad Ansyar Rafi Putra";

function filesUnder(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = path.join(directory, entry);
    return statSync(fullPath).isDirectory() ? filesUnder(fullPath) : [fullPath];
  });
}

describe("head ownership", () => {
  it("declares no title in the root route head", () => {
    const source = readFileSync(path.join(projectRoot, "src/routes/__root.tsx"), "utf8");
    const start = source.indexOf("head: () =>");
    const end = source.indexOf("shellComponent");

    expect(start).toBeGreaterThan(-1);
    const headBlock = source.slice(start, end === -1 ? undefined : end);

    expect(headBlock).not.toMatch(/\btitle\s*:/);
  });

  it("never embeds the owner name in a route title", () => {
    const routeSources = filesUnder(path.join(projectRoot, "src/routes")).filter(
      (file) =>
        /\.(ts|tsx)$/.test(file) &&
        !file.includes(`${path.sep}__tests__${path.sep}`) &&
        !file.endsWith("routeTree.gen.ts")
    );

    for (const file of routeSources) {
      const source = readFileSync(file, "utf8");
      // A `title` prop (or template literal) that already names the owner is the
      // duplicate this track removes; Seo appends the site name itself.
      expect(source, file).not.toMatch(new RegExp(`title=(?:"|\\{\`)[^"\`]*${ownerName}`));
    }
  });

  it("gives the admin tree one route-level title", () => {
    const head = (
      AdminRoute as unknown as { head?: () => { meta?: Array<Record<string, unknown>> } }
    ).head;

    expect(head).toBeTypeOf("function");
    const meta = head?.().meta ?? [];
    const titles = meta.filter((entry) => typeof entry.title === "string");

    expect(titles).toHaveLength(1);
    expect(titles[0]?.title).toContain("Admin");
    expect(titles[0]?.title).toContain(ownerName);
  });
});
