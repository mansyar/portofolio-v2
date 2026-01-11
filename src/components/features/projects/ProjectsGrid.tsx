import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "../../../../convex/_generated/api";
import { ProjectCard } from "../../ui/project-card";

export function ProjectsGrid() {
  const { data: projects } = useSuspenseQuery(convexQuery(api.projects.listVisible, {}));

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
      {projects.length > 0 ? (
        projects.map((project) => (
          <ProjectCard
            key={project._id}
            title={project.title}
            slug={project.slug}
            shortDescription={project.shortDescription}
            techStack={project.techStack}
            thumbnailUrl={project.images?.[0]}
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
  );
}
