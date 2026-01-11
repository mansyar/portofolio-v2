import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from '../../convex/_generated/api';
import { Seo } from '../components/seo';
import { ChevronLeft, ExternalLink, Github, Code2, Layers } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { TerminalWindow } from '../components/ui/terminal-window';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const Route = createFileRoute('/projects/$slug')({
  component: ProjectDetail,
  loader: async ({ context, params: { slug } }) => {
    const project = await context.queryClient.ensureQueryData(
      convexQuery(api.projects.bySlug, { slug })
    );
    if (!project) throw notFound();
  }
});

function ProjectDetail() {
  const { slug } = Route.useParams();
  const { data: project } = useSuspenseQuery(convexQuery(api.projects.bySlug, { slug }));
  
  if (!project) return null;

  return (
    <div className="container px-4 pt-10 pb-20 md:px-6">
      <Seo 
        title={`${project.title} | Projects`} 
        description={project.shortDescription || ''}
        image={project.thumbnailUrl || ''}
      />

      <Link 
        to="/projects" 
        className="mb-8 flex items-center gap-2 text-sm text-(--color-text-secondary) hover:text-(--color-ubuntu-orange) transition-colors font-mono"
      >
        <ChevronLeft size={16} />
        <span>BACK_TO_PROJECTS</span>
      </Link>

      <div className="grid gap-12 lg:grid-cols-2">
        <div className="space-y-8">
          <div>
            <h1 className="mb-4 text-4xl font-bold md:text-5xl">{project.title}</h1>
            <p className="text-xl text-(--color-text-secondary) leading-relaxed">
              {project.shortDescription}
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            {project.liveDemoUrl && (
              <a href={project.liveDemoUrl} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="gap-2 h-12 px-6">
                  <ExternalLink size={18} /> Live Demo
                </Button>
              </a>
            )}
            {project.githubUrl && (
              <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="lg" className="gap-2 h-12 px-6">
                  <Github size={18} /> View Source
                </Button>
              </a>
            )}
          </div>

          <div className="space-y-6">
            <h2 className="flex items-center gap-2 text-xl font-bold font-mono">
              <Layers className="text-(--color-ubuntu-orange)" size={20} />
              TECH_STACK
            </h2>
            <div className="flex flex-wrap gap-2">
              {project.techStack.map((tech) => (
                <Badge key={tech} variant="outline" className="px-3 py-1 font-mono text-sm">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>

          {project.fullDescription && (
            <div className="space-y-4">
              <h2 className="flex items-center gap-2 text-xl font-bold font-mono text-(--color-terminal-green)">
                <Code2 size={20} />
                PROJECT_OVERVIEW
              </h2>
              <div className="prose prose-invert prose-orange max-w-none text-(--color-text-secondary)">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{project.fullDescription}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <TerminalWindow title={`project-preview://${project.slug}`} className="sticky top-24">
            {project.thumbnailUrl ? (
              <div className="aspect-video w-full overflow-hidden rounded border border-(--color-border) bg-(--color-surface)">
                <img 
                  src={project.thumbnailUrl} 
                  alt={project.title} 
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" 
                />
              </div>
            ) : (
              <div className="flex aspect-video w-full items-center justify-center rounded border border-dashed border-(--color-border) bg-(--color-surface) font-mono text-(--color-text-secondary)">
                NO_PREVIEW_AVAILABLE
              </div>
            )}
            
            <div className="mt-6 grid grid-cols-2 gap-4">
              {project.images?.filter(img => img !== project.thumbnailUrl).map((img, idx) => (
                <div key={idx} className="aspect-video overflow-hidden rounded border border-(--color-border)">
                  <img src={img} alt={`${project.title} screenshot ${idx + 1}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </TerminalWindow>
        </div>
      </div>
    </div>
  );
}
