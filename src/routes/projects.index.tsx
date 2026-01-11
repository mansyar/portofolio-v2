import { createFileRoute } from '@tanstack/react-router'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '../../convex/_generated/api'
import { Seo } from '../components/seo'
import { Terminal } from 'lucide-react'
import { Suspense } from 'react'
import { ProjectsGrid } from '../components/features/projects/ProjectsGrid'
import { SectionSkeleton } from '../components/ui/section-skeleton'

export const Route = createFileRoute('/projects/')({
  component: Projects,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(convexQuery(api.projects.listVisible, {}))
  }
})

function Projects() {
  return (
    <div className="container flex flex-col gap-8 px-4 pt-10 pb-20 md:px-6">
      <Seo 
        title="Projects | Portfolio" 
        description="A showcase of my recent work, side projects, and open source contributions." 
      />

      <div className="flex flex-col gap-4">
        <h1 className="flex items-center gap-3 text-3xl font-bold md:text-4xl">
          <Terminal className="text-(--color-ubuntu-purple)" />
          Projects
        </h1>
        <p className="max-w-2xl text-(--color-text-secondary)">
          A selection of projects I've worked on, ranging from web applications to infrastructure automation.
        </p>
      </div>

      <Suspense fallback={<SectionSkeleton items={6} />}>
        <ProjectsGrid />
      </Suspense>
    </div>
  )
}
