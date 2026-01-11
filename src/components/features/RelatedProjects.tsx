import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { ProjectCard } from '../ui/project-card';
import { Folder } from 'lucide-react';

interface Props {
  currentProjectId: Id<"projects">;
}

export function RelatedProjects({ currentProjectId }: Props) {
  const { data: projects } = useSuspenseQuery(
    convexQuery(api.projects.getRelated, { currentProjectId, limit: 3 })
  );

  if (projects.length === 0) return null;

  return (
    <section className="mt-16 pt-8 border-t border-(--color-border)">
      <h2 className="flex items-center gap-2 mb-6 text-xl font-bold font-mono">
        <Folder className="text-(--color-ubuntu-orange)" size={20} />
        RELATED_PROJECTS
      </h2>
      <div className="grid gap-6 md:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard 
            key={project._id} 
            title={project.title}
            slug={project.slug}
            shortDescription={project.shortDescription}
            thumbnailUrl={project.thumbnailUrl}
            techStack={project.techStack}
            liveDemoUrl={project.liveDemoUrl}
            githubUrl={project.githubUrl}
          />
        ))}
      </div>
    </section>
  );
}
