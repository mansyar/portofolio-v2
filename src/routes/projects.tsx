import { createFileRoute } from '@tanstack/react-router'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'

export const Route = createFileRoute('/projects')({
  component: ProjectsPage,
})

function ProjectsPage() {
  return (
    <div className="container mx-auto max-w-6xl py-12 px-4">
      <h1 className="mb-8 font-mono text-4xl font-bold text-[var(--color-ubuntu-orange)]">
        # Projects
      </h1>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* Placeholder Project Card 1 */}
        <Card title="portfolio-v2" className="flex flex-col h-full">
          <div className="aspect-video w-full bg-[var(--color-terminal-bg-dark)]/50 mb-4 rounded border border-[var(--color-border)] flex items-center justify-center">
            <span className="font-mono text-[var(--color-text-secondary)]">preview.jpg</span>
          </div>
          <h3 className="text-xl font-bold mb-2">Portfolio V2</h3>
          <p className="text-[var(--color-text-secondary)] mb-4 flex-1">
            Rebuilt portfolio with TanStack Start, Convex, and Ubuntu Terminal aesthetic.
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-xs border border-[var(--color-border)] px-2 py-1 rounded">React</span>
            <span className="text-xs border border-[var(--color-border)] px-2 py-1 rounded">Convex</span>
            <span className="text-xs border border-[var(--color-border)] px-2 py-1 rounded">TypeScript</span>
          </div>
          <div className="flex gap-4 mt-auto">
            <Button size="sm">Demo</Button>
            <Button variant="secondary" size="sm">Code</Button>
          </div>
        </Card>

        {/* Placeholder Project Card 2 */}
        <Card title="lms-platform" className="flex flex-col h-full">
           <div className="aspect-video w-full bg-[var(--color-terminal-bg-dark)]/50 mb-4 rounded border border-[var(--color-border)] flex items-center justify-center">
            <span className="font-mono text-[var(--color-text-secondary)]">preview.jpg</span>
          </div>
          <h3 className="text-xl font-bold mb-2">LMS Platform</h3>
          <p className="text-[var(--color-text-secondary)] mb-4 flex-1">
            Learning Management System for medical residents with complex scheduling.
          </p>
           <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-xs border border-[var(--color-border)] px-2 py-1 rounded">Next.js</span>
            <span className="text-xs border border-[var(--color-border)] px-2 py-1 rounded">Supabase</span>
          </div>
          <div className="flex gap-4 mt-auto">
            <Button size="sm">Demo</Button>
            <Button variant="secondary" size="sm">Code</Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
