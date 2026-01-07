import { createFileRoute } from '@tanstack/react-router'
import { Card } from '../components/ui/card'

export const Route = createFileRoute('/about')({
  component: AboutPage,
})

function AboutPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <h1 className="mb-8 font-mono text-4xl font-bold text-[var(--color-ubuntu-orange)]">
        # About Me
      </h1>
      
      <div className="grid gap-8 md:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          <Card title="bio.txt">
            <p className="font-mono leading-relaxed text-[var(--color-text-primary)]">
              Hello! I'm Mezy Ansyar, a DevOps Engineer and Web Developer. I love building
              robust infrastructure and clean, efficient code. My journey in tech started...
            </p>
          </Card>

          <Card title="journey.log">
            <div className="space-y-4">
              <div className="border-l-2 border-[var(--color-border)] pl-4">
                <div className="font-mono text-sm text-[var(--color-text-secondary)]">2026 - Present</div>
                <h3 className="text-lg font-bold">Senior DevOps Engineer</h3>
                <p>Building next-gen infrastructure...</p>
              </div>
            </div>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card title="stats.json" variant="terminal">
            <pre className="text-sm">
{`{
  "location": "Jakarta, ID",
  "experience": "5+ years",
  "coffee": "∞",
  "status": "online"
}`}
            </pre>
          </Card>
        </div>
      </div>
    </div>
  )
}
