import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Terminal, Plus, Trash2, ChevronLeft, Tag as TagIcon } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/admin/blog/tags')({
  component: TagsAdmin,
});

function TagsAdmin() {
  const tags = useQuery(api.blog.getTags);
  const createTag = useMutation(api.blog.createTag);
  const deleteTag = useMutation(api.blog.deleteTag);

  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newSlug) return;

    try {
      await createTag({ name: newName, slug: newSlug });
      setNewName('');
      setNewSlug('');
    } catch (error) {
      console.error('Failed to create tag:', error);
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
          <h1 className="text-2xl font-bold">TAG_MANAGEMENT</h1>
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
            <h2 className="text-lg font-bold border-b border-(--color-border) pb-2 mb-4">NEW_TAG</h2>
            
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
                  placeholder="e.g. React"
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
                  placeholder="e.g. react"
                  required
                />
              </div>
            </div>

            <button type="submit" className="terminal-button btn-primary w-full flex items-center justify-center gap-2">
              <Plus size={18} />
              <span>ADD_TAG</span>
            </button>
          </form>
        </div>

        <div className="lg:col-span-2">
          <div className="terminal-card p-6">
            <div className="flex flex-wrap gap-3">
              {tags?.map((tag) => (
                <div 
                  key={tag._id} 
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(255,255,255,0.05)] border border-(--color-border) group hover:border-(--color-ubuntu-orange) transition-colors"
                >
                  <TagIcon size={12} className="text-(--color-text-secondary)" />
                  <span className="text-sm font-mono">{tag.name}</span>
                  <button
                    onClick={async () => {
                      if (window.confirm('Delete tag?')) {
                        await deleteTag({ id: tag._id });
                      }
                    }}
                    className="ml-1 text-(--color-text-secondary) hover:text-(--color-terminal-red) transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {tags?.length === 0 && (
                <div className="w-full py-8 text-center text-(--color-text-secondary) font-mono italic">
                  NO_TAGS_FOUND
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
