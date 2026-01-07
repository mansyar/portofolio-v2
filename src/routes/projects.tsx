import { createFileRoute } from '@tanstack/react-router'
import { convexQuery } from '@convex-dev/react-query'
import { useSuspenseQuery } from '@tanstack/react-query'
import { api } from '../../convex/_generated/api'
import { ProjectCard } from '../components/ui/project-card'
import { Seo } from '../components/seo'
import { Terminal } from 'lucide-react'

// Future enhancement: Add tech stack filtering
// valid tech stacks can be fetched via api.projects.getUniqueTechStacks?
// For now, list all.

export const Route = createFileRoute('/projects')({
  component: Projects,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(convexQuery(api.projects.listVisible, {}))
  }
})

function Projects() {
  const { data: projects } = useSuspenseQuery(convexQuery(api.projects.listVisible, {}))

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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        {projects.length > 0 ? (
          projects.map((project) => (
            <ProjectCard
              key={project._id}
              title={project.title}
              slug={project.slug}
              shortDescription={project.shortDescription}
              techStack={project.techStack}
              thumbnailUrl={project.images?.[0]} // Use first image as thumbnail
              liveDemoUrl={project.liveDemoUrl}
              githubUrl={project.githubUrl}
            />
          ))
        ) : (
          <div className="col-span-full rounded border border-dashed border-(--color-border) py-12 text-center">
            <p className="font-mono text-(--color-text-secondary)">No projects found.</p>
          </div>
        )}
      </div>
    </div>
  )
}
