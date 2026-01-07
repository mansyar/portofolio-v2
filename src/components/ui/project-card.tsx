import { Link } from "@tanstack/react-router";
import { Card } from "./card";
import { Button } from "./button";
import { ExternalLink, Github } from "lucide-react";

interface ProjectCardProps {
  title: string;
  slug: string;
  shortDescription?: string;
  thumbnailUrl?: string;
  techStack: string[];
  liveDemoUrl?: string;
  githubUrl?: string;
}

export function ProjectCard({
  title,
  slug,
  shortDescription,
  thumbnailUrl,
  techStack,
  liveDemoUrl,
  githubUrl,
}: ProjectCardProps) {
  return (
    <Card title={slug} className="flex h-full flex-col transition-colors duration-200 hover:border-(--color-ubuntu-orange)">
      <Link to="/projects/$slug" params={{ slug }} className="group block">
        <div className="relative mb-4 aspect-video w-full overflow-hidden rounded border border-(--color-border) bg-(--color-terminal-bg-dark)/50">
          {thumbnailUrl ? (
            <img 
              src={thumbnailUrl} 
              alt={title} 
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-mono text-(--color-text-secondary)">
              <span className="group-hover:text-(--color-ubuntu-orange)">./preview_missing.jpg</span>
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col">
        <Link to="/projects/$slug" params={{ slug }}>
          <h3 className="mb-2 text-xl font-bold transition-colors hover:text-(--color-ubuntu-orange)">
            {title}
          </h3>
        </Link>
        
        {shortDescription && (
          <p className="mb-4 flex-1 text-sm leading-relaxed text-(--color-text-secondary)">
            {shortDescription}
          </p>
        )}

        <div className="mb-6 flex flex-wrap gap-2">
          {techStack.slice(0, 4).map((tech) => (
            <span 
              key={tech} 
              className="rounded border border-(--color-border) bg-(--color-surface) px-2 py-1 text-xs text-(--color-text-secondary)"
            >
              {tech}
            </span>
          ))}
          {techStack.length > 4 && (
            <span className="px-1 py-1 text-xs text-(--color-text-secondary)">+{techStack.length - 4}</span>
          )}
        </div>

        <div className="mt-auto flex gap-3">
          {liveDemoUrl && (
            <a href={liveDemoUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button size="sm" className="w-full justify-center gap-2">
                <ExternalLink size={14} /> Demo
              </Button>
            </a>
          )}
          {githubUrl && (
            <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button variant="secondary" size="sm" className="w-full justify-center gap-2">
                <Github size={14} /> Code
              </Button>
            </a>
          )}
          {!liveDemoUrl && !githubUrl && (
             <Link to="/projects/$slug" params={{ slug }} className="flex-1">
               <Button size="sm" className="w-full">Details</Button>
             </Link>
          )}
        </div>
      </div>
    </Card>
  );
}
