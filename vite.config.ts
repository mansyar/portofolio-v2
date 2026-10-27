import { defineConfig, coverageConfigDefaults } from "vitest/config";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import viteTsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

const isTest = process.env.NODE_ENV === "test" || process.env.VITEST;

const config = defineConfig({
  plugins: [
    devtools(),
    // Skip SSR plugins during testing to prevent hanging processes
    ...(!isTest ? [nitro(), tanstackStart()] : []),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    viteReact(),
  ],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.tsx"],
    exclude: ["**/node_modules/**", "**/.output/**", "**/convex/_generated/**"],
    // This host runs four concurrent projects on 20 logical cores; never exceed 4.
    maxWorkers: 4,
    // Force exit after tests complete to prevent hanging
    pool: "forks",
    teardownTimeout: 1000,
    deps: {
      optimizer: {
        web: {
          include: ["react", "react-dom"],
        },
      },
    },
    coverage: {
      provider: "v8",
      include: ["src", "convex"],
      exclude: [...coverageConfigDefaults.exclude, "convex/_generated/**", "src/routeTree.gen.ts"],
      // Ratcheting floor, not a target. Measured baseline after the public mobile
      // navigation track: 32.66% lines, 24.34% functions over 193 tests (30.0% and
      // 21.87% over 167 tests before it). Raise these whenever a track adds tests;
      // never lower them to make a phase pass.
      thresholds: {
        lines: 32,
        functions: 24,
      },
    },
  },
});

export default config;
