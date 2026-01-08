import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { ProjectForm } from '../../../components/features/ProjectForm';

export const Route = createFileRoute('/admin/projects/new')({
  component: NewProjectPage,
});

function NewProjectPage() {
  const projects = useQuery(api.projects.listAll);
  
  const nextDisplayOrder = projects ? projects.length : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-(--color-text-primary)">Create Project</h1>
        <p className="text-sm text-(--color-text-secondary) font-mono mt-1">
          Add a new project to your portfolio
        </p>
      </div>

      <ProjectForm 
        mode="create" 
        initialData={{
          title: '',
          slug: '',
          shortDescription: '',
          fullDescription: '',
          thumbnailUrl: '',
          images: [],
          techStack: [],
          liveDemoUrl: '',
          githubUrl: '',
          isFeatured: false,
          displayOrder: nextDisplayOrder,
          isVisible: true,
        }} 
      />
    </div>
  );
}
