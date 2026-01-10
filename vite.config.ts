/// <reference types="vitest" />
import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST

const config = defineConfig({
  plugins: [
    devtools(),
    // Skip SSR plugins during testing to prevent hanging processes
    ...(!isTest ? [nitro(), tanstackStart()] : []),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    viteReact(),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.tsx'],
    exclude: ['**/node_modules/**', '**/.output/**', '**/convex/_generated/**'],
    // Force exit after tests complete to prevent hanging
    pool: 'forks',
    teardownTimeout: 1000,
    deps: {
      optimizer: {
        web: {
          include: ['react', 'react-dom'],
        },
      },
    },
  },
})

export default config
