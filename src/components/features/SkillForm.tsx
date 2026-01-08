import { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useRouter } from '@tanstack/react-router';

export type SkillCategory = "devops" | "backend" | "frontend" | "tools";

export interface SkillFormData {
  name: string;
  category: SkillCategory;
  icon?: string;
  proficiency: number;
  yearsOfExperience?: number;
  description?: string;
  displayOrder: number;
  isVisible: boolean;
}

interface SkillFormProps {
  initialData?: SkillFormData & { id?: Id<"skills"> };
  mode: 'create' | 'edit';
  onSubmit?: () => void;
}

export function SkillForm({ initialData, mode, onSubmit }: SkillFormProps) {
  const router = useRouter();
  const createSkill = useMutation(api.skills.create);
  const updateSkill = useMutation(api.skills.update);

  const [formData, setFormData] = useState<SkillFormData>({
    name: '',
    category: 'frontend',
    icon: '',
    proficiency: 50,
    yearsOfExperience: 0,
    description: '',
    displayOrder: 0,
    isVisible: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        category: initialData.category,
        icon: initialData.icon || '',
        proficiency: initialData.proficiency,
        yearsOfExperience: initialData.yearsOfExperience || 0,
        description: initialData.description || '',
        displayOrder: initialData.displayOrder,
        isVisible: initialData.isVisible,
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : (type === 'number' || type === 'range')
          ? Number(value) 
          : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (mode === 'create') {
        await createSkill({
          ...formData,
          // Handle optional fields
          icon: formData.icon || undefined,
          yearsOfExperience: formData.yearsOfExperience || undefined, 
          description: formData.description || undefined,
        });
      } else if (mode === 'edit' && initialData?.id) {
        await updateSkill({
          id: initialData.id,
          ...formData,
          // Handle optional fields
          icon: formData.icon || undefined,
          yearsOfExperience: formData.yearsOfExperience || undefined,
          description: formData.description || undefined,
        });
      }

      if (onSubmit) {
        onSubmit();
      } else {
        router.navigate({ to: '/admin/skills' });
      }
    } catch (err: unknown) {
      console.error('Error saving skill:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save skill';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories: { value: SkillCategory; label: string }[] = [
    { value: 'frontend', label: 'Frontend' },
    { value: 'backend', label: 'Backend' },
    { value: 'devops', label: 'DevOps' },
    { value: 'tools', label: 'Tools' },
  ];

  return (
    <div className="card max-w-2xl">
      <div className="flex items-center justify-between border-b border-(--color-border) bg-(--color-surface) px-4 py-2">
        <div className="text-sm text-(--color-text-secondary)">
          {mode === 'create' ? 'new_skill.ts' : `edit_skill_${initialData?.id || 'unknown'}.ts`}
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="bg-[rgba(233,84,32,0.1)] border-l-2 border-(--color-terminal-red) p-3 text-xs text-(--color-terminal-red)">
            Error: {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div className="space-y-2">
            <label htmlFor="name" className="block text-xs font-mono text-(--color-text-secondary)">Name</label>
            <div className="terminal-input-wrapper">
              <span className="terminal-prompt">$</span>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="terminal-input w-full"
                placeholder="React"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label htmlFor="category" className="block text-xs font-mono text-(--color-text-secondary)">Category</label>
            <div className="relative">
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-(--color-terminal-bg) border border-(--color-border) rounded p-2 pl-3 text-(--color-text-primary) focus:border-(--color-ubuntu-orange) focus:outline-hidden appearance-none font-mono text-sm"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-(--color-text-secondary)">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>

          {/* Icon (Optional) */}
          <div className="space-y-2">
            <label htmlFor="icon" className="block text-xs font-mono text-(--color-text-secondary)">Icon (React Icon Name)</label>
            <div className="terminal-input-wrapper">
              <span className="terminal-prompt">&gt;</span>
              <input
                id="icon"
                name="icon"
                type="text"
                value={formData.icon}
                onChange={handleChange}
                className="terminal-input w-full"
                placeholder="FaReact"
              />
            </div>
          </div>

          {/* Proficiency */}
          <div className="space-y-2">
            <label htmlFor="proficiency" className="block text-xs font-mono text-(--color-text-secondary)">
              Proficiency: {formData.proficiency}%
            </label>
            <input
              id="proficiency"
              name="proficiency"
              type="range"
              min="0"
              max="100"
              value={formData.proficiency}
              onChange={handleChange}
              className="w-full h-2 bg-(--color-surface) rounded-lg appearance-none cursor-pointer accent-(--color-ubuntu-orange)"
            />
          </div>

          {/* Years of Experience */}
          <div className="space-y-2">
            <label htmlFor="yearsOfExperience" className="block text-xs font-mono text-(--color-text-secondary)">Years of Experience</label>
            <div className="terminal-input-wrapper">
              <span className="terminal-prompt">#</span>
              <input
                id="yearsOfExperience"
                name="yearsOfExperience"
                type="number"
                min="0"
                step="0.5"
                value={formData.yearsOfExperience}
                onChange={handleChange}
                className="terminal-input w-full"
              />
            </div>
          </div>

          {/* Display Order */}
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
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label htmlFor="description" className="block text-xs font-mono text-(--color-text-secondary)">Description (Optional)</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full bg-(--color-terminal-bg) border border-(--color-border) rounded p-3 text-(--color-text-primary) focus:border-(--color-ubuntu-orange) focus:outline-hidden font-mono text-sm min-h-[100px]"
            placeholder="Brief description of your experience with this skill..."
          />
        </div>

        {/* Visibility */}
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
            {isSubmitting ? 'Saving...' : (mode === 'create' ? 'Create Skill' : 'Update Skill')}
          </button>
        </div>
      </form>
    </div>
  );
}
