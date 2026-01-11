import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { api } from "../../../../convex/_generated/api";
import { ProjectCard } from "../../ui/project-card";

export function ProjectsSection() {
  const { data: featuredProjects } = useSuspenseQuery(convexQuery(api.projects.listFeatured, {}));

  return (
    <section className="container px-4 md:px-6">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="mb-2 text-2xl font-bold md:text-3xl">Featured Projects</h2>
          <p className="text-(--color-text-secondary)">Recent work and case studies</p>
        </div>
        <Link to="/projects" className="hidden items-center font-mono text-(--color-ubuntu-orange) hover:underline md:inline-flex">
          view_all_projects() &gt;
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {featuredProjects.length > 0 ? (
          featuredProjects.map((project) => (
            <ProjectCard
              key={project._id}
              title={project.title}
              slug={project.slug}
              shortDescription={project.shortDescription}
              techStack={project.techStack}
              thumbnailUrl={project.thumbnailUrl}
              liveDemoUrl={project.liveDemoUrl}
              githubUrl={project.githubUrl}
            />
          ))
        ) : (
          <div className="col-span-full rounded border border-dashed border-(--color-border) py-12 text-center">
            <p className="font-mono text-(--color-text-secondary)">No featured projects found.</p>
          </div>
        )}
      </div>
    </section>
  );
}
