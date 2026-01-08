import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';

export const Route = createFileRoute('/admin/projects/')({
  component: AdminProjectsList,
});

function AdminProjectsList() {
  const projects = useQuery(api.projects.listAll);
  const toggleVisibility = useMutation(api.projects.toggleVisibility);
  const removeProject = useMutation(api.projects.remove);
  
  const [deletingId, setDeletingId] = useState<Id<"projects"> | null>(null);

  const handleDelete = async (id: Id<"projects">) => {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      setDeletingId(id);
      try {
        await removeProject({ id });
      } catch (error) {
        console.error('Failed to delete project:', error);
        alert('Failed to delete project');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleToggleVisibility = async (id: Id<"projects">) => {
    try {
      await toggleVisibility({ id });
    } catch (error) {
      console.error('Failed to toggle visibility:', error);
    }
  };

  if (projects === undefined) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-(--color-ubuntu-orange) border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-(--color-text-primary)">Projects</h1>
          <p className="text-sm text-(--color-text-secondary) font-mono mt-1">
            Manage your project portfolio and case studies
          </p>
        </div>
        <Link 
          to="/admin/projects/new" 
          className="terminal-button"
        >
          + Add Project
        </Link>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="w-16">Ord</th>
              <th>Preview</th>
              <th>Project Details</th>
              <th>Stats</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-(--color-text-secondary)">
                  No projects found. Create your first project to showcase your work.
                </td>
              </tr>
            ) : (
              projects.map((project) => (
                <tr key={project._id}>
                  <td className="font-mono text-xs">{project.displayOrder}</td>
                  <td className="w-24">
                     {project.thumbnailUrl ? (
                       <img 
                        src={project.thumbnailUrl} 
                        alt={project.title} 
                        className="h-12 w-20 object-cover rounded border border-(--color-border)"
                       />
                     ) : (
                       <div className="h-12 w-20 bg-[rgba(255,255,255,0.05)] rounded border border-(--color-border) flex items-center justify-center text-xs text-(--color-text-secondary)">
                         No Image
                       </div>
                     )}
                  </td>
                  <td>
                    <div className="font-medium text-(--color-text-primary)">{project.title}</div>
                    <div className="text-xs font-mono text-(--color-text-secondary) mt-1 truncate max-w-[200px]">
                      /{project.slug}
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {project.techStack.slice(0, 3).map((tech, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.05)] text-(--color-text-secondary)">
                          {tech}
                        </span>
                      ))}
                      {project.techStack.length > 3 && (
                        <span className="text-[10px] px-1.5 py-0.5 text-(--color-text-secondary)">
                          +{project.techStack.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col gap-1 items-start">
                      <button
                        onClick={() => handleToggleVisibility(project._id)}
                        className={`admin-badge ${project.isVisible ? 'success' : 'neutral'} cursor-pointer hover:opacity-80 transition-opacity`}
                      >
                        {project.isVisible ? 'Visible' : 'Hidden'}
                      </button>
                      {project.isFeatured && (
                        <span className="admin-badge warning text-[10px]">Featured</span>
                      )}
                    </div>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                       <a 
                          href={`/projects/${project.slug}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-xs text-(--color-text-secondary) hover:text-(--color-text-primary) transition-colors font-mono"
                          title="View on site"
                        >
                          [view]
                        </a>
                      <Link
                        to="/admin/projects/$id"
                        params={{ id: project._id }}
                        className="text-xs text-(--color-text-secondary) hover:text-(--color-ubuntu-orange) transition-colors font-mono"
                      >
                        [edit]
                      </Link>
                      <button
                        onClick={() => handleDelete(project._id)}
                        disabled={deletingId === project._id}
                        className="text-xs text-(--color-text-secondary) hover:text-(--color-terminal-red) transition-colors font-mono disabled:opacity-50"
                      >
                        {deletingId === project._id ? '[...]' : '[del]'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
