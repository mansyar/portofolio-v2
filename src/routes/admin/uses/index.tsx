import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';

export const Route = createFileRoute('/admin/uses/')({
  component: AdminUsesList,
});

function AdminUsesList() {
  const items = useQuery(api.uses.listAll);
  const toggleVisibility = useMutation(api.uses.toggleVisibility);
  const removeItem = useMutation(api.uses.remove);
  
  const [deletingId, setDeletingId] = useState<Id<"usesItems"> | null>(null);

  const handleDelete = async (id: Id<"usesItems">) => {
    if (confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      setDeletingId(id);
      try {
        await removeItem({ id });
      } catch (error) {
        console.error('Failed to delete item:', error);
        alert('Failed to delete item');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleToggleVisibility = async (id: Id<"usesItems">) => {
    try {
      await toggleVisibility({ id });
    } catch (error) {
      console.error('Failed to toggle visibility:', error);
    }
  };

  if (items === undefined) {
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
          <h1 className="text-2xl font-bold text-(--color-text-primary)">Uses Items</h1>
          <p className="text-sm text-(--color-text-secondary) font-mono mt-1">
            Manage your hardware, software, and gear
          </p>
        </div>
        <Link 
          to="/admin/uses/new" 
          className="terminal-button"
        >
          + Add Item
        </Link>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="w-16">Ord</th>
              <th>Name</th>
              <th>Category</th>
              <th>Visibility</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-(--color-text-secondary)">
                  No items found. Add your first item to get started.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item._id}>
                  <td className="font-mono text-xs">{item.displayOrder}</td>
                  <td className="font-medium">
                    <div className="flex flex-col">
                      <span>{item.name}</span>
                      {item.url && (
                        <span className="text-[10px] text-(--color-text-secondary) truncate max-w-[200px]">
                          {item.url}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="admin-badge neutral uppercase tracking-wider text-[10px]">
                      {item.category}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggleVisibility(item._id)}
                      className={`admin-badge ${item.isVisible ? 'success' : 'neutral'} cursor-pointer hover:opacity-80 transition-opacity`}
                    >
                      {item.isVisible ? 'Visible' : 'Hidden'}
                    </button>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to="/admin/uses/$id"
                        params={{ id: item._id }}
                        className="text-xs text-(--color-text-secondary) hover:text-(--color-ubuntu-orange) transition-colors font-mono"
                      >
                        [edit]
                      </Link>
                      <button
                        onClick={() => handleDelete(item._id)}
                        disabled={deletingId === item._id}
                        className="text-xs text-(--color-text-secondary) hover:text-(--color-terminal-red) transition-colors font-mono disabled:opacity-50"
                      >
                        {deletingId === item._id ? '[...]' : '[del]'}
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
