import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();

function filesUnder(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = path.join(directory, entry);
    return statSync(fullPath).isDirectory() ? filesUnder(fullPath) : [fullPath];
  });
}

describe("route surface", () => {
  it("does not ship the demo route directory", () => {
    expect(existsSync(path.join(projectRoot, "src/routes/demo"))).toBe(false);
  });

  it("does not ship the demo-only data module", () => {
    expect(existsSync(path.join(projectRoot, "src/data/demo.punk-songs.ts"))).toBe(false);
  });

  it("has no demo route in the generated tree", () => {
    const routeTree = readFileSync(path.join(projectRoot, "src/routeTree.gen.ts"), "utf8");

    expect(routeTree).not.toMatch(/\/demo\b/);
    expect(routeTree).not.toMatch(/\bDemo[A-Za-z]*Route\b/);
  });

  it("has no demo route declaration in route sources", () => {
    const routeSources = filesUnder(path.join(projectRoot, "src/routes")).filter(
      (file) =>
        /\.(ts|tsx)$/.test(file) &&
        !file.includes(`${path.sep}__tests__${path.sep}`) &&
        !file.endsWith("routeTree.gen.ts")
    );

    for (const file of routeSources) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(/["'`]\/demo(\/|["'`])/);
    }
  });
});
