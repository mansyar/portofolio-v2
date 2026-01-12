import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { Terminal, Plus, PenTool, Trash2, Globe, EyeOff, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useSelection } from '@/hooks/use-selection';
import { BulkActionBar } from '@/components/ui/BulkActionBar';
import { useToastMutation } from '@/hooks/use-toast-mutation';

export const Route = createFileRoute('/admin/blog/')({
  component: BlogAdmin,
});

function BlogAdmin() {
  const posts = useQuery(api.blog.listAll);
  const togglePublish = useMutation(api.blog.togglePublish);
  const deletePost = useMutation(api.blog.deletePost);

  const { mutate: removeMany } = useToastMutation(api.blog.removePostsBulk, {
    successMessage: 'posts deleted successfully',
    errorMessage: 'failed to delete posts'
  });
  
  const { mutate: toggleStatusMany } = useToastMutation(api.blog.toggleStatusBulk, {
    successMessage: 'status updated successfully',
    errorMessage: 'failed to update status'
  });

  const { 
    selectedCount, 
    selectedIdsArray, 
    toggleSelect, 
    toggleSelectAll, 
    isAllSelected, 
    clearSelection 
  } = useSelection(posts);

  const handleToggle = async (id: Id<"blogPosts">) => {
    try {
      await togglePublish({ id });
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const handleDelete = async (id: Id<"blogPosts">) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deletePost({ id });
      } catch (error) {
        console.error('Failed to delete post:', error);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Are you sure you want to delete ${selectedCount} posts? This action cannot be undone.`)) {
      await removeMany({ ids: selectedIdsArray as Id<"blogPosts">[] });
      clearSelection();
    }
  };

  const handleBulkStatus = async (status: 'published' | 'draft') => {
    await toggleStatusMany({ 
      ids: selectedIdsArray as Id<"blogPosts">[], 
      status 
    });
    clearSelection();
  };

  const bulkActions = [
    {
      label: 'Publish',
      icon: Globe,
      onClick: () => handleBulkStatus('published'),
      variant: 'success' as const,
    },
    {
      label: 'Draft',
      icon: EyeOff,
      onClick: () => handleBulkStatus('draft'),
      variant: 'default' as const,
    },
    {
      label: 'Delete',
      icon: Trash2,
      onClick: handleBulkDelete,
      variant: 'danger' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold">
            <Terminal className="text-(--color-ubuntu-orange)" />
            BLOG_MANAGEMENT
          </h1>
          <p className="text-sm text-(--color-text-secondary) font-mono mt-1">
            Status: {posts?.length || 0} posts found.
          </p>
        </div>
        <Link 
          to="/admin/blog/new" 
          className="terminal-button btn-primary flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          <span>NEW_ENTRY</span>
        </Link>
      </div>

      <div className="terminal-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="border-b border-(--color-border) bg-[rgba(255,255,255,0.02)]">
              <tr>
                <th className="p-4 w-10">
                  <input 
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 bg-(--color-terminal-bg) border-(--color-border) rounded text-(--color-ubuntu-orange) focus:ring-0 accent-(--color-ubuntu-orange)"
                  />
                </th>
                <th className="p-4 font-mono text-xs uppercase tracking-wider text-(--color-text-secondary)">Title</th>
                <th className="p-4 font-mono text-xs uppercase tracking-wider text-(--color-text-secondary)">Status</th>
                <th className="p-4 font-mono text-xs uppercase tracking-wider text-(--color-text-secondary)">Metrics</th>
                <th className="p-4 font-mono text-xs uppercase tracking-wider text-(--color-text-secondary)">Published</th>
                <th className="p-4 font-mono text-xs uppercase tracking-wider text-(--color-text-secondary) text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--color-border)">
              {posts?.map((post) => (
                <tr key={post._id} className={`hover:bg-[rgba(255,255,255,0.02)] transition-colors group ${selectedIdsArray.includes(post._id) ? 'bg-(--color-surface-dark)' : ''}`}>
                  <td className="p-4">
                    <input 
                      type="checkbox"
                      checked={selectedIdsArray.includes(post._id)}
                      onChange={() => toggleSelect(post._id)}
                      className="h-4 w-4 bg-(--color-terminal-bg) border-(--color-border) rounded text-(--color-ubuntu-orange) focus:ring-0 accent-(--color-ubuntu-orange)"
                    />
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-(--color-text-primary)">{post.title}</div>
                    <div className="text-xs text-(--color-text-secondary) font-mono mt-1">/{post.slug}</div>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggle(post._id)}
                      className={`admin-badge ${post.status === 'published' ? 'success' : 'neutral'} cursor-pointer flex items-center gap-1`}
                    >
                      {post.status === 'published' ? <Globe size={10} /> : <EyeOff size={10} />}
                      {post.status.toUpperCase()}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-xs text-(--color-text-secondary) font-mono">
                      <Clock size={12} />
                      <span>{post.readingTime}m</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-xs text-(--color-text-secondary) font-mono">
                      <Calendar size={12} />
                      <span>{post.publishedAt ? format(post.publishedAt, 'yyyy-MM-dd') : '---'}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        to="/admin/blog/$id"
                        params={{ id: post._id }}
                        className="p-1.5 rounded hover:bg-(--color-surface-dark) transition-colors text-(--color-text-secondary) hover:text-(--color-ubuntu-orange)"
                        title="Edit Post"
                      >
                        <PenTool size={16} />
                      </Link>
                      <button
                        onClick={() => handleDelete(post._id)}
                        className="p-1.5 rounded hover:bg-(--color-surface-dark) transition-colors text-(--color-text-secondary) hover:text-(--color-terminal-red)"
                        title="Delete Post"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {posts?.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-(--color-text-secondary) font-mono italic">
                    NO_POSTS_IN_DATABASE
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link 
          to="/admin/blog/categories" 
          className="terminal-card p-4 hover:border-(--color-ubuntu-orange) transition-colors group flex items-center justify-between"
        >
          <div>
            <h3 className="font-bold group-hover:text-(--color-ubuntu-orange)">Categories</h3>
            <p className="text-xs text-(--color-text-secondary) font-mono">Manage blog taxonomies</p>
          </div>
          <PenTool size={18} className="text-(--color-text-secondary) group-hover:text-(--color-ubuntu-orange)" />
        </Link>
        <Link 
          to="/admin/blog/tags" 
          className="terminal-card p-4 hover:border-(--color-ubuntu-orange) transition-colors group flex items-center justify-between"
        >
          <div>
            <h3 className="font-bold group-hover:text-(--color-ubuntu-orange)">Tags</h3>
            <p className="text-xs text-(--color-text-secondary) font-mono">Manage post discoverability</p>
          </div>
          <PenTool size={18} className="text-(--color-text-secondary) group-hover:text-(--color-ubuntu-orange)" />
        </Link>
      </div>

      <BulkActionBar 
        selectedCount={selectedCount}
        onClear={clearSelection}
        actions={bulkActions}
      />
    </div>
  );
}
