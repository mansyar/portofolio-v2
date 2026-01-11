import React, { Suspense } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '../../convex/_generated/api'
import { Button } from '../components/ui/button'
import { TypingEffect } from '../components/ui/typing-effect'
import { ArrowRight } from 'lucide-react'
import { TerminalWindow, CodeBlock } from '../components/ui/terminal-window'
import { useMediaQuery } from '../hooks/use-media-query'
import { Seo } from '../components/seo'
import { SkillsSection } from '../components/features/home/SkillsSection'
import { ProjectsSection } from '../components/features/home/ProjectsSection'
import { BlogSection } from '../components/features/home/BlogSection'
import { SectionSkeleton } from '../components/ui/section-skeleton'

export const Route = createFileRoute('/')({
  component: App,
  loader: async ({ context }) => {
    // Keep prefetching in loader to warm up cache on server
    await Promise.all([
      context.queryClient.prefetchQuery(convexQuery(api.skills.listVisible, {})),
      context.queryClient.prefetchQuery(convexQuery(api.projects.listFeatured, {})),
      context.queryClient.prefetchQuery(convexQuery(api.blog.listRecent, { limit: 3 })),
    ])
  },
})

function App() {
  const isMounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  const isDesktop = useMediaQuery("(min-width: 1024px)")

  return (
    <div className="animate-fade-in flex flex-col gap-16 pb-20 md:gap-24">
      <Seo 
        title="Home" 
        description="Welcome to Ansyar's portfolio and custom CMS. I am a Full-Stack Developer and DevOps Engineer specialized in building scalable applications."
      />
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 pb-10 md:pt-20 lg:pt-32">
        <div className="relative z-10 container px-4 md:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
            <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center rounded border border-(--color-border) bg-(--color-surface) px-3 py-1 font-mono text-sm text-(--color-terminal-green)">
              <span className="mr-2 h-2 w-2 animate-pulse rounded-full bg-(--color-terminal-green)"></span>
              System Online
            </div>
            
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              Full-Stack Developer <br />
              <span className="text-(--color-ubuntu-orange)">
                & <TypingEffect text="DevOps Engineer" speed={100} startDelay={200} />
              </span>
            </h1>
            
            <p className="mb-8 max-w-2xl text-lg leading-relaxed text-(--color-text-secondary) md:text-xl">
              Building scalable applications and robust infrastructure with modern technologies. 
              Focused on performance, user experience, and clean code.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Link to="/projects">
                <Button size="lg" className="h-12 px-8 text-base">
                  View Projects <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="secondary" size="lg" className="h-12 px-8 text-base">
                  Contact Me
                </Button>
              </Link>
            </div>
            </div>
            
            {/* Terminal Illustration - Desktop Only */}
            {isMounted && isDesktop && (
              <div className="hidden perspective-1000 lg:block">
                <div className="relative transform transition-transform duration-500 hover:rotate-1">
                  <TerminalWindow title="ansyar@portfolio:~/about" className="shadow-2xl">
                    <div className="mb-4 flex items-center gap-2 text-(--color-terminal-green)">
                      <span>$</span>
                      <TypingEffect text="cat me.ts" speed={50} />
                    </div>
                    <CodeBlock 
                      code={`interface Developer {
  name: "Ansyar";
  role: "Full Stack Developer";
  stack: ["React", "Convex", "DevOps"];
  passion: "Building great software";
  status: "Online";
}`} 
                    />
                    <div className="mt-4 flex items-center gap-2 text-(--color-terminal-green)">
                       <span>$</span>
                       <span className="h-5 w-2 animate-pulse bg-(--color-terminal-green)"></span>
                    </div>
                  </TerminalWindow>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </section>

      {/* Skills Preview */}
      <Suspense fallback={<SectionSkeleton title="Technical Skills" items={4} />}>
        <SkillsSection />
      </Suspense>
      
      {/* Featured Projects */}
      <Suspense fallback={<SectionSkeleton title="Featured Projects" />}>
        <ProjectsSection />
      </Suspense>

      {/* Latest Blog */}
      <Suspense fallback={<SectionSkeleton title="Latest from Blog" />}>
        <BlogSection />
      </Suspense>

      {/* CTA */}
      <section className="container px-4 md:px-6">
        <div className="relative overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface) p-8 text-center md:p-12">
           <div className="relative z-10">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">Let's Work Together</h2>
              <p className="mx-auto mb-8 max-w-2xl text-lg text-(--color-text-secondary)">
                I'm currently available for freelance projects and remote roles. 
                If you have a project that needs some creative engineering, I'd love to hear about it.
              </p>
              <Link to="/contact">
                <Button size="lg" className="shadow-[0_0_20px_-5px_var(--color-ubuntu-orange)] h-12 px-8 text-base">
                  Get in Touch
                </Button>
              </Link>
           </div>
           
           <div className="pointer-events-none absolute -top-24 -left-24 opacity-5">
              <div className="h-64 w-64 rounded-full bg-(--color-ubuntu-orange) blur-3xl"></div>
           </div>
        </div>
      </section>
    </div>
  )
}
