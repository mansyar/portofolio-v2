import { createFileRoute } from '@tanstack/react-router'
import { Card } from '../components/ui/card'

export const Route = createFileRoute('/skills')({
  component: SkillsPage,
})

function SkillsPage() {
  return (
    <div className="container mx-auto max-w-6xl py-12 px-4">
      <h1 className="mb-8 font-mono text-4xl font-bold text-[var(--color-ubuntu-orange)]">
        # Skills & Technologies
      </h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card title="devops">
          <ul className="list-disc list-inside space-y-2 font-mono">
            <li>Docker</li>
            <li>Kubernetes</li>
            <li>Terraform</li>
            <li>AWS</li>
          </ul>
        </Card>

        <Card title="backend">
          <ul className="list-disc list-inside space-y-2 font-mono">
            <li>Node.js</li>
            <li>Python</li>
            <li>Go</li>
            <li>PostgreSQL</li>
          </ul>
        </Card>

        <Card title="frontend">
          <ul className="list-disc list-inside space-y-2 font-mono">
            <li>React</li>
            <li>TypeScript</li>
            <li>TailwindCSS</li>
            <li>Next.js</li>
          </ul>
        </Card>

        <Card title="tools">
          <ul className="list-disc list-inside space-y-2 font-mono">
            <li>Git</li>
            <li>Linux</li>
            <li>VS Code</li>
            <li>Coolify</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
