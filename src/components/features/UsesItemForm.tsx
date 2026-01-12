import { useState } from 'react';
import { api } from '../../../convex/_generated/api';
import { useToastMutation } from '../../hooks/use-toast-mutation';
import { Id } from '../../../convex/_generated/dataModel';
import { useRouter } from '@tanstack/react-router';

export interface UsesItemFormData {
  category: string;
  name: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  displayOrder: number;
  isVisible: boolean;
}

interface UsesItemFormProps {
  initialData?: UsesItemFormData & { id?: Id<"usesItems"> };
  mode: 'create' | 'edit';
  onSubmit?: () => void;
}

export function UsesItemForm({ initialData, mode, onSubmit }: UsesItemFormProps) {
  const router = useRouter();
  const { mutate: createItem, isPending: isCreating } = useToastMutation(api.uses.create, {
    successMessage: 'item saved successfully',
    errorMessage: 'failed to save item'
  });
  const { mutate: updateItem, isPending: isUpdating } = useToastMutation(api.uses.update, {
    successMessage: 'item updated successfully',
    errorMessage: 'failed to update item'
  });

  const [formData, setFormData] = useState<UsesItemFormData>({
    category: initialData?.category || '',
    name: initialData?.name || '',
    description: initialData?.description || '',
    url: initialData?.url || '',
    imageUrl: initialData?.imageUrl || '',
    displayOrder: initialData?.displayOrder ?? 0,
    isVisible: initialData?.isVisible ?? true,
  });


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: name === 'displayOrder' ? parseInt(value as string) || 0 : val,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (mode === 'create') {
        await createItem(formData);
      } else if (mode === 'edit' && initialData?.id) {
        await updateItem({
          id: initialData.id,
          ...formData,
        });
      }
      
      if (onSubmit) {
        onSubmit();
      } else {
        router.navigate({ to: '/admin/uses' });
      }
    } catch {
      // Handled by toast
    }
  };

  return (
    <div className="card max-w-4xl">
      <div className="flex items-center justify-between border-b border-(--color-border) bg-(--color-surface) px-4 py-2">
        <div className="text-sm text-(--color-text-secondary)">
          {mode === 'create' ? 'new_uses_item.ts' : `edit_uses_item_${initialData?.name.toLowerCase().replace(/\s+/g, '_')}.ts`}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Basic Info */}
          <div className="space-y-6">
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
                  placeholder="e.g. VS Code, MacBook Pro"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="category" className="block text-xs font-mono text-(--color-text-secondary)">Category</label>
              <div className="terminal-input-wrapper">
                <span className="terminal-prompt">#</span>
                <input
                  id="category"
                  name="category"
                  type="text"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  className="terminal-input w-full"
                  placeholder="e.g. Software, Hardware, Desk Setup"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="displayOrder" className="block text-xs font-mono text-(--color-text-secondary)">Display Order</label>
              <div className="terminal-input-wrapper">
                <span className="terminal-prompt">#</span>
                <input
                  id="displayOrder"
                  name="displayOrder"
                  type="number"
                  required
                  min="0"
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
            </div>
          </div>

          {/* Right Column: URLs */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="url" className="block text-xs font-mono text-(--color-text-secondary)">Link URL (Optional)</label>
              <div className="terminal-input-wrapper">
                <span className="terminal-prompt">&gt;</span>
                <input
                  id="url"
                  name="url"
                  type="url"
                  value={formData.url}
                  onChange={handleChange}
                  className="terminal-input w-full"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="imageUrl" className="block text-xs font-mono text-(--color-text-secondary)">Image URL (Optional)</label>
              <div className="terminal-input-wrapper">
                <span className="terminal-prompt">&gt;</span>
                <input
                  id="imageUrl"
                  name="imageUrl"
                  type="url"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  className="terminal-input w-full"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Full Width Section */}
        <div className="space-y-2">
          <label htmlFor="description" className="block text-xs font-mono text-(--color-text-secondary)">Description (Optional)</label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            placeholder="Brief description of how you use this item..."
            className="w-full bg-(--color-terminal-bg) border border-(--color-border) rounded p-3 text-(--color-text-primary) focus:border-(--color-ubuntu-orange) focus:outline-hidden font-mono text-sm"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-4 border-t border-(--color-border)">
          <button
            type="button"
            onClick={() => {
              if (onSubmit) onSubmit();
              else router.navigate({ to: '/admin/uses' });
            }}
            className="px-4 py-2 text-sm font-mono text-(--color-text-secondary) hover:text-(--color-text-primary) transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isCreating || isUpdating}
            className="terminal-button"
          >
            {(isCreating || isUpdating) ? 'Saving...' : (mode === 'create' ? 'Create Item' : 'Update Item')}
          </button>
        </div>
      </form>
    </div>
  );
}
