import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { ProjectForm } from '../../../components/features/ProjectForm';

export const Route = createFileRoute('/admin/projects/$id')({
  component: EditProjectPage,
});

function EditProjectPage() {
  const { id } = Route.useParams();
  const project = useQuery(api.projects.getById, { id: id as Id<"projects"> });

  if (project === undefined) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-(--color-ubuntu-orange) border-t-transparent" />
      </div>
    );
  }

  if (project === null) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-(--color-text-secondary)">
        <p className="font-mono">Project not found</p>
        <button 
          onClick={() => history.back()}
          className="terminal-button"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-(--color-text-primary)">Edit Project</h1>
        <p className="text-sm text-(--color-text-secondary) font-mono mt-1">
          Update project details and assets
        </p>
      </div>

      <ProjectForm 
        mode="edit" 
        initialData={{
            id: project._id,
            title: project.title,
            slug: project.slug,
            shortDescription: project.shortDescription || '',
            fullDescription: project.fullDescription || '',
            thumbnailUrl: project.thumbnailUrl || '',
            images: project.images,
            techStack: project.techStack,
            liveDemoUrl: project.liveDemoUrl || '',
            githubUrl: project.githubUrl || '',
            isFeatured: project.isFeatured,
            displayOrder: project.displayOrder,
            isVisible: project.isVisible,
        }} 
      />
    </div>
  );
}
