import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Terminal, Plus, Trash2, ChevronLeft } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/admin/blog/categories')({
  component: CategoriesAdmin,
});

function CategoriesAdmin() {
  const categories = useQuery(api.blog.getCategories);
  const createCategory = useMutation(api.blog.createCategory);
  const deleteCategory = useMutation(api.blog.deleteCategory);

  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newSlug) return;

    try {
      await createCategory({ name: newName, slug: newSlug, description: '', displayOrder: categories?.length || 0 });
      setNewName('');
      setNewSlug('');
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Terminal className="text-(--color-ubuntu-orange)" />
          <h1 className="text-2xl font-bold">CATEGORY_MANAGEMENT</h1>
        </div>
        <Link 
          to="/admin/blog" 
          className="text-sm text-(--color-text-secondary) hover:text-(--color-ubuntu-orange) flex items-center gap-1 font-mono"
        >
          <ChevronLeft size={16} />
          BACK_TO_BLOG
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <form onSubmit={handleCreate} className="terminal-card p-6 space-y-4 sticky top-6">
            <h2 className="text-lg font-bold border-b border-(--color-border) pb-2 mb-4">NEW_CATEGORY</h2>
            
            <div className="space-y-2">
              <label className="text-xs text-(--color-text-secondary) font-mono uppercase">Name</label>
              <div className="input-wrapper">
                <span className="input-prompt">{">"}</span>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    if (!newSlug || newSlug === generateSlug(newName)) {
                      setNewSlug(generateSlug(e.target.value));
                    }
                  }}
                  className="terminal-input w-full"
                  placeholder="e.g. Engineering"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-(--color-text-secondary) font-mono uppercase">Slug</label>
              <div className="input-wrapper">
                <span className="input-prompt">{">"}</span>
                <input
                  type="text"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  className="terminal-input w-full"
                  placeholder="e.g. engineering"
                  required
                />
              </div>
            </div>

            <button type="submit" className="terminal-button btn-primary w-full flex items-center justify-center gap-2">
              <Plus size={18} />
              <span>ADD_CATEGORY</span>
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="terminal-card overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[rgba(255,255,255,0.02)] border-b border-(--color-border)">
                <tr>
                  <th className="p-4 font-mono text-xs uppercase text-(--color-text-secondary)">Name</th>
                  <th className="p-4 font-mono text-xs uppercase text-(--color-text-secondary)">Slug</th>
                  <th className="p-4 font-mono text-xs uppercase text-(--color-text-secondary) text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--color-border)">
                {categories?.map((cat) => (
                  <tr key={cat._id} className="hover:bg-[rgba(255,255,255,0.01)] transition-colors">
                    <td className="p-4 font-bold">{cat.name}</td>
                    <td className="p-4 text-xs font-mono text-(--color-text-secondary)">{cat.slug}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={async () => {
                          if (window.confirm('Delete category?')) {
                            await deleteCategory({ id: cat._id });
                          }
                        }}
                        className="p-1.5 rounded hover:bg-(--color-surface-dark) transition-colors text-(--color-text-secondary) hover:text-(--color-terminal-red)"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {categories?.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-(--color-text-secondary) font-mono italic">
                      NO_CATEGORIES_DEFINED
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
