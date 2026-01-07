import { createFileRoute } from '@tanstack/react-router'
import { Card } from '../components/ui/card'

export const Route = createFileRoute('/blog')({
  component: BlogPage,
})

function BlogPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <h1 className="mb-8 font-mono text-4xl font-bold text-[var(--color-ubuntu-orange)]">
        # Blog
      </h1>

      <div className="space-y-6">
        <Card title="2026-01-01_hello-world.md">
          <div className="space-y-2">
            <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)] font-mono">
              <span>Jan 1, 2026</span>
              <span>•</span>
              <span>General</span>
            </div>
            <h2 className="text-2xl font-bold hover:text-[var(--color-ubuntu-orange)] cursor-pointer">
              Hello World: Moving to TanStack Start
            </h2>
            <p className="text-[var(--color-text-secondary)]">
              Why I decided to migrate my portfolio from Next.js to TanStack Start and the lessons learned along the way...
            </p>
            <div className="pt-2">
              <a href="#" className="font-mono text-[var(--color-terminal-cyan)] hover:underline">
                read_more()
              </a>
            </div>
          </div>
        </Card>

        {/* Pagination Placeholder */}
        <div className="flex justify-center gap-2 font-mono mt-8">
          <span className="text-[var(--color-text-secondary)]">&lt; prev</span>
          <span className="font-bold text-[var(--color-ubuntu-orange)]">[1]</span>
          <span>2</span>
          <span>3</span>
          <span>next &gt;</span>
        </div>
      </div>
    </div>
  )
}
