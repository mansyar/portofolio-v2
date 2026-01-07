import { createFileRoute } from '@tanstack/react-router'
import { Card } from '../components/ui/card'

export const Route = createFileRoute('/uses')({
  component: UsesPage,
})

function UsesPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <h1 className="mb-8 font-mono text-4xl font-bold text-[var(--color-ubuntu-orange)]">
        # Uses
      </h1>
      
      <p className="mb-8 text-[var(--color-text-secondary)] font-mono">
        Software and hardware I use to get things done.
      </p>

      <div className="space-y-8">
        <section>
          <h2 className="mb-4 text-2xl font-bold font-mono text-[var(--color-ubuntu-purple)]">
            ## Hardware
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card title="laptop">
              <h3 className="font-bold">MacBook Pro 14" (M3 Pro)</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">The daily driver.</p>
            </Card>
            <Card title="keyboard">
              <h3 className="font-bold">Keychron Q1</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">Gateron Brown switches.</p>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold font-mono text-[var(--color-ubuntu-purple)]">
            ## Software
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card title="editor">
              <h3 className="font-bold">VS Code</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">With SynthWave '84 theme.</p>
            </Card>
            <Card title="terminal">
              <h3 className="font-bold">Warp</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">Fast, Rust-based terminal.</p>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}
