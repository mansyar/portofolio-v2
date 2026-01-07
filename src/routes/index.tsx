import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="space-y-8">
              <div className="font-mono text-[var(--color-ubuntu-orange)]">
                &lt;Welcome /&gt;
              </div>
              <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">
                Hi, I'm <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-ubuntu-orange)] to-[var(--color-ubuntu-purple)]">
                  Muhammad Ansyar Rafi Putra
                </span>
              </h1>
              <p className="text-xl text-[var(--color-text-secondary)] font-mono max-w-lg">
                DevOps Engineer & Full Stack Developer building robust infrastructure and clean web applications.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/projects">
                  <Button size="md">View Projects</Button>
                </Link>
                <Link to="/contact">
                  <Button variant="secondary" size="md">Contact Me</Button>
                </Link>
              </div>
            </div>

            {/* Terminal Window Illustration */}
            <div className="relative">
              <Card title="ansyar@ubuntu: ~" variant="terminal" className="shadow-2xl">
                <div className="space-y-4 font-mono text-sm sm:text-base">
                  <div>
                    <span className="text-[var(--color-terminal-green)]">ansyar@ubuntu</span>
                    <span className="text-[var(--color-text-secondary)]">:</span>
                    <span className="text-[var(--color-terminal-cyan)]">~</span>
                    <span className="text-[var(--color-text-secondary)]">$</span>
                    <span className="ml-2">neofetch</span>
                  </div>
                  
                  <div className="flex gap-4">
                     <pre className="text-[var(--color-ubuntu-orange)] hidden sm:block">
{`
       .-.
      (   )
   .--'   '--.
  /           \\
 (             )
  \\           /
   '--.   .--'
      (   )
       '-'
`}
                    </pre>
                    <div className="space-y-1">
                      <div><span className="text-[var(--color-ubuntu-orange)] font-bold">ansyar</span>@<span className="text-[var(--color-ubuntu-orange)] font-bold">ansyar-world</span></div>
                      <div>-----------------</div>
                      <div><span className="text-[var(--color-ubuntu-orange)] font-bold">OS</span>: Ubuntu 24.04 LTS</div>
                      <div><span className="text-[var(--color-ubuntu-orange)] font-bold">Role</span>: DevOps Engineer</div>
                      <div><span className="text-[var(--color-ubuntu-orange)] font-bold">Stack</span>: Docker, K8s, Terraform</div>
                      <div><span className="text-[var(--color-ubuntu-orange)] font-bold">Web</span>: React, Convex, TanStack</div>
                      <div><span className="text-[var(--color-ubuntu-orange)] font-bold">Uptime</span>: 5 years</div>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-[var(--color-terminal-green)]">ansyar@ubuntu</span>
                    <span className="text-[var(--color-text-secondary)]">:</span>
                    <span className="text-[var(--color-terminal-cyan)]">~</span>
                    <span className="text-[var(--color-text-secondary)]">$</span>
                    <span className="ml-2 animate-pulse">_</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Preview Section */}
      <section className="bg-[var(--color-surface-dark)] py-20 bg-opacity-50">
        <div className="container mx-auto px-4 text-center">
            <h2 className="mb-12 font-mono text-3xl font-bold">
              ## Tech Stack
            </h2>
            <div className="flex flex-wrap justify-center gap-8 opacity-80">
              {/* Simple text representation for now */}
              <span className="text-xl font-mono text-[var(--color-text-secondary)]">Docker</span>
              <span className="text-xl font-mono text-[var(--color-text-secondary)]">Kubernetes</span>
              <span className="text-xl font-mono text-[var(--color-text-secondary)]">React</span>
              <span className="text-xl font-mono text-[var(--color-text-secondary)]">TypeScript</span>
              <span className="text-xl font-mono text-[var(--color-text-secondary)]">Convex</span>
              <span className="text-xl font-mono text-[var(--color-text-secondary)]">TanStack</span>
            </div>
        </div>
      </section>
    </div>
  )
}
