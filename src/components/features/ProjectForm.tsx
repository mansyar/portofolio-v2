import { useState, useEffect } from 'react';
import { api } from '../../../convex/_generated/api';
import { useToastMutation } from '../../hooks/use-toast-mutation';
import { Id } from '../../../convex/_generated/dataModel';
import { useRouter } from '@tanstack/react-router';

export interface ProjectFormData {
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  thumbnailUrl: string;
  images: string[];
  techStack: string[];
  liveDemoUrl: string;
  githubUrl: string;
  isFeatured: boolean;
  displayOrder: number;
  isVisible: boolean;
}

interface ProjectFormProps {
  initialData?: ProjectFormData & { id?: Id<"projects"> };
  mode: 'create' | 'edit';
}

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')  // Remove all non-word chars
    .replace(/--+/g, '-');    // Replace multiple - with single -
}

export function ProjectForm({ initialData, mode }: ProjectFormProps) {
  const router = useRouter();
  const createProject = useToastMutation(api.projects.create, {
    successMessage: 'project saved successfully',
    errorMessage: 'failed to save project'
  });
  const updateProject = useToastMutation(api.projects.update, {
    successMessage: 'project updated successfully',
    errorMessage: 'failed to update project'
  });

  const [formData, setFormData] = useState<ProjectFormData>({
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
    displayOrder: 0,
    isVisible: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Raw text state for array fields to allow typing commas/newlines
  const [techStackText, setTechStackText] = useState('');
  const [imagesText, setImagesText] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        slug: initialData.slug,
        shortDescription: initialData.shortDescription || '',
        fullDescription: initialData.fullDescription || '',
        thumbnailUrl: initialData.thumbnailUrl || '',
        images: initialData.images || [],
        techStack: initialData.techStack || [],
        liveDemoUrl: initialData.liveDemoUrl || '',
        githubUrl: initialData.githubUrl || '',
        isFeatured: initialData.isFeatured,
        displayOrder: initialData.displayOrder,
        isVisible: initialData.isVisible,
      });
      // Initialize raw text from array data
      setTechStackText(initialData.techStack?.join(', ') || '');
      setImagesText(initialData.images?.join('\n') || '');
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: type === 'checkbox' 
          ? (e.target as HTMLInputElement).checked 
          : type === 'number' 
            ? Number(value) 
            : value
      };

      // Auto-generate slug from title if in create mode and slug hasn't been manually touched (simplified)
      if (name === 'title' && mode === 'create') {
        newData.slug = slugify(value as string);
      }

      return newData;
    });
  };

  // Parse array field on blur (when user leaves the input)
  const parseArrayField = (name: 'images' | 'techStack') => {
    const text = name === 'techStack' ? techStackText : imagesText;
    // Split by comma or newline and clean up
    const list = text.split(/[\n,]/).map(item => item.trim()).filter(Boolean);
    setFormData(prev => ({ ...prev, [name]: list }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        // Handle optional fields
        shortDescription: formData.shortDescription || undefined,
        fullDescription: formData.fullDescription || undefined,
        thumbnailUrl: formData.thumbnailUrl || undefined,
        liveDemoUrl: formData.liveDemoUrl || undefined,
        githubUrl: formData.githubUrl || undefined,
      };

      if (mode === 'create') {
        await createProject(payload);
      } else if (mode === 'edit' && initialData?.id) {
        await updateProject({
          id: initialData.id,
          ...payload
        });
      }

      router.navigate({ to: '/admin/projects' });
    } catch {
      // Handled by toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card max-w-4xl">
      <div className="flex items-center justify-between border-b border-(--color-border) bg-(--color-surface) px-4 py-2">
        <div className="text-sm text-(--color-text-secondary)">
          {mode === 'create' ? 'new_project.ts' : `edit_project_${initialData?.slug}.ts`}
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Basic Info */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="title" className="block text-xs font-mono text-(--color-text-secondary)">Title</label>
              <div className="terminal-input-wrapper">
                <span className="terminal-prompt">$</span>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="terminal-input w-full"
                  placeholder="My Awesome Project"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="slug" className="block text-xs font-mono text-(--color-text-secondary)">Slug</label>
              <div className="terminal-input-wrapper">
                <span className="terminal-prompt">/</span>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  required
                  value={formData.slug}
                  onChange={handleChange}
                  className="terminal-input w-full"
                  placeholder="my-awesome-project"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="techStack" className="block text-xs font-mono text-(--color-text-secondary)">Tech Stack (comma separated)</label>
              <textarea
                id="techStack"
                rows={3}
                value={techStackText}
                onChange={(e) => setTechStackText(e.target.value)}
                onBlur={() => parseArrayField('techStack')}
                className="w-full bg-(--color-terminal-bg) border border-(--color-border) rounded p-3 text-(--color-text-primary) focus:border-(--color-ubuntu-orange) focus:outline-hidden font-mono text-sm"
                placeholder="React, TypeScript, TailwindCSS"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="displayOrder" className="block text-xs font-mono text-(--color-text-secondary)">Display Order</label>
              <div className="terminal-input-wrapper">
                <span className="terminal-prompt">#</span>
                <input
                  id="displayOrder"
                  name="displayOrder"
                  type="number"
                  value={formData.displayOrder}
                  onChange={handleChange}
                  className="terminal-input w-full"
                />
              </div>
            </div>

             <div className="flex flex-col gap-2 pt-2">
                <div className="flex items-center space-x-3">
                  <input
                    id="isVisible"
                    name="isVisible"
                    type="checkbox"
                    checked={formData.isVisible}
                    onChange={handleChange}
                    className="h-4 w-4 bg-(--color-terminal-bg) border-(--color-border) rounded text-(--color-ubuntu-orange) focus:ring-0 focus:ring-offset-0 accent-(--color-ubuntu-orange)"
                  />
                  <label htmlFor="isVisible" className="text-sm font-mono text-(--color-text-primary)">
                    Visible on public site
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    id="isFeatured"
                    name="isFeatured"
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={handleChange}
                    className="h-4 w-4 bg-(--color-terminal-bg) border-(--color-border) rounded text-(--color-ubuntu-orange) focus:ring-0 focus:ring-offset-0 accent-(--color-ubuntu-orange)"
                  />
                  <label htmlFor="isFeatured" className="text-sm font-mono text-(--color-text-primary)">
                    Featured project
                  </label>
                </div>
            </div>
          </div>

          {/* Right Column: URLs and Media */}
          <div className="space-y-6">
             <div className="space-y-2">
              <label htmlFor="thumbnailUrl" className="block text-xs font-mono text-(--color-text-secondary)">Thumbnail URL</label>
              <div className="terminal-input-wrapper">
                <span className="terminal-prompt">&gt;</span>
                <input
                  id="thumbnailUrl"
                  name="thumbnailUrl"
                  type="text"
                  value={formData.thumbnailUrl}
                  onChange={handleChange}
                  className="terminal-input w-full"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="liveDemoUrl" className="block text-xs font-mono text-(--color-text-secondary)">Live Demo URL</label>
              <div className="terminal-input-wrapper">
                <span className="terminal-prompt">&gt;</span>
                <input
                  id="liveDemoUrl"
                  name="liveDemoUrl"
                  type="text"
                  value={formData.liveDemoUrl}
                  onChange={handleChange}
                  className="terminal-input w-full"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="githubUrl" className="block text-xs font-mono text-(--color-text-secondary)">GitHub URL</label>
              <div className="terminal-input-wrapper">
                <span className="terminal-prompt">&gt;</span>
                <input
                  id="githubUrl"
                  name="githubUrl"
                  type="text"
                  value={formData.githubUrl}
                  onChange={handleChange}
                  className="terminal-input w-full"
                  placeholder="https://github.com/..."
                />
              </div>
            </div>

             <div className="space-y-2">
              <label htmlFor="images" className="block text-xs font-mono text-(--color-text-secondary)">Additional Images (one per line)</label>
              <textarea
                id="images"
                rows={4}
                value={imagesText}
                onChange={(e) => setImagesText(e.target.value)}
                onBlur={() => parseArrayField('images')}
                className="w-full bg-(--color-terminal-bg) border border-(--color-border) rounded p-3 text-(--color-text-primary) focus:border-(--color-ubuntu-orange) focus:outline-hidden font-mono text-sm"
                placeholder="https://..."
              />
            </div>
          </div>
        </div>

        {/* Full Width Sections */}
        <div className="space-y-2">
          <label htmlFor="shortDescription" className="block text-xs font-mono text-(--color-text-secondary)">Short Description</label>
          <textarea
            id="shortDescription"
            name="shortDescription"
            rows={2}
            value={formData.shortDescription}
            onChange={handleChange}
            className="w-full bg-(--color-terminal-bg) border border-(--color-border) rounded p-3 text-(--color-text-primary) focus:border-(--color-ubuntu-orange) focus:outline-hidden font-mono text-sm"
            placeholder="Brief summary used in cards..."
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="fullDescription" className="block text-xs font-mono text-(--color-text-secondary)">Full Description (Markdown)</label>
          <textarea
            id="fullDescription"
            name="fullDescription"
            rows={8}
            value={formData.fullDescription}
            onChange={handleChange}
            className="w-full bg-(--color-terminal-bg) border border-(--color-border) rounded p-3 text-(--color-text-primary) focus:border-(--color-ubuntu-orange) focus:outline-hidden font-mono text-sm"
            placeholder="Detailed project explanation..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-4 border-t border-(--color-border)">
          <button
            type="button"
            onClick={() => router.history.back()}
            className="px-4 py-2 text-sm font-mono text-(--color-text-secondary) hover:text-(--color-text-primary) transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="terminal-button"
          >
            {isSubmitting ? 'Saving...' : (mode === 'create' ? 'Create Project' : 'Update Project')}
          </button>
        </div>
      </form>
    </div>
  );
}
