import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { useSelection } from '@/hooks/use-selection';
import { BulkActionBar } from '@/components/ui/BulkActionBar';
import { Trash2, Eye, EyeOff } from 'lucide-react';
import { useToastMutation } from '@/hooks/use-toast-mutation';

export const Route = createFileRoute('/admin/skills/')({
  component: AdminSkillsList,
});

function AdminSkillsList() {
  const skills = useQuery(api.skills.listAll);
  const toggleVisibility = useMutation(api.skills.toggleVisibility);
  const removeSkill = useMutation(api.skills.remove);
  
  const { mutate: removeMany } = useToastMutation(api.skills.removeBulk, {
    successMessage: 'skills deleted successfully',
    errorMessage: 'failed to delete skills'
  });
  
  const { mutate: toggleVisibilityMany } = useToastMutation(api.skills.toggleVisibilityBulk, {
    successMessage: 'visibility updated successfully',
    errorMessage: 'failed to update visibility'
  });

  const { 
    selectedCount, 
    selectedIdsArray, 
    toggleSelect, 
    toggleSelectAll, 
    isAllSelected, 
    clearSelection 
  } = useSelection(skills);
  
  const [deletingId, setDeletingId] = useState<Id<"skills"> | null>(null);

  const handleDelete = async (id: Id<"skills">) => {
    if (confirm('Are you sure you want to delete this skill? This action cannot be undone.')) {
      setDeletingId(id);
      try {
        await removeSkill({ id });
      } catch (error) {
        console.error('Failed to delete skill:', error);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Are you sure you want to delete ${selectedCount} skills? This action cannot be undone.`)) {
      await removeMany({ ids: selectedIdsArray as Id<"skills">[] });
      clearSelection();
    }
  };

  const handleBulkVisibility = async (isVisible: boolean) => {
    await toggleVisibilityMany({ 
      ids: selectedIdsArray as Id<"skills">[], 
      isVisible 
    });
    clearSelection();
  };

  const bulkActions = [
    {
      label: 'Show',
      icon: Eye,
      onClick: () => handleBulkVisibility(true),
      variant: 'success' as const,
    },
    {
      label: 'Hide',
      icon: EyeOff,
      onClick: () => handleBulkVisibility(false),
      variant: 'default' as const,
    },
    {
      label: 'Delete',
      icon: Trash2,
      onClick: handleBulkDelete,
      variant: 'danger' as const,
    },
  ];

  const handleToggleVisibility = async (id: Id<"skills">) => {
    try {
      await toggleVisibility({ id });
    } catch (error) {
      console.error('Failed to toggle visibility:', error);
    }
  };

  if (skills === undefined) {
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
          <h1 className="text-2xl font-bold text-(--color-text-primary)">Skills</h1>
          <p className="text-sm text-(--color-text-secondary) font-mono mt-1">
            Manage your technical skills and proficiency
          </p>
        </div>
        <Link 
          to="/admin/skills/new" 
          className="terminal-button"
        >
          + Add Skill
        </Link>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="w-10">
                <input 
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 bg-(--color-terminal-bg) border-(--color-border) rounded text-(--color-ubuntu-orange) focus:ring-0 accent-(--color-ubuntu-orange)"
                />
              </th>
              <th className="w-16">Ord</th>
              <th>Name</th>
              <th>Category</th>
              <th>Proficiency</th>
              <th>Visibility</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {skills.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-(--color-text-secondary)">
                  No skills found. Add your first skill to get started.
                </td>
              </tr>
            ) : (
              skills.map((skill) => (
                <tr key={skill._id} className={selectedIdsArray.includes(skill._id) ? 'bg-(--color-surface-dark)' : ''}>
                  <td>
                    <input 
                      type="checkbox"
                      checked={selectedIdsArray.includes(skill._id)}
                      onChange={() => toggleSelect(skill._id)}
                      className="h-4 w-4 bg-(--color-terminal-bg) border-(--color-border) rounded text-(--color-ubuntu-orange) focus:ring-0 accent-(--color-ubuntu-orange)"
                    />
                  </td>
                  <td className="font-mono text-xs">{skill.displayOrder}</td>
                  <td className="font-medium">
                    <div className="flex items-center gap-2">
                       {skill.icon && <span className="font-mono text-xs opacity-50">{skill.icon}</span>}
                       {skill.name}
                    </div>
                  </td>
                  <td>
                    <span className="admin-badge neutral uppercase tracking-wider text-[10px]">
                      {skill.category}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 bg-(--color-terminal-bg) rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-(--color-ubuntu-orange)" 
                          style={{ width: `${skill.proficiency}%` }}
                        />
                      </div>
                      <span className="text-xs text-(--color-text-secondary)">{skill.proficiency}%</span>
                    </div>
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggleVisibility(skill._id)}
                      className={`admin-badge ${skill.isVisible ? 'success' : 'neutral'} cursor-pointer hover:opacity-80 transition-opacity`}
                    >
                      {skill.isVisible ? 'Visible' : 'Hidden'}
                    </button>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to="/admin/skills/$id"
                        params={{ id: skill._id }}
                        className="text-xs text-(--color-text-secondary) hover:text-(--color-ubuntu-orange) transition-colors font-mono"
                      >
                        [edit]
                      </Link>
                      <button
                        onClick={() => handleDelete(skill._id)}
                        disabled={deletingId === skill._id}
                        className="text-xs text-(--color-text-secondary) hover:text-(--color-terminal-red) transition-colors font-mono disabled:opacity-50"
                      >
                        {deletingId === skill._id ? '[...]' : '[del]'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <BulkActionBar 
        selectedCount={selectedCount}
        onClear={clearSelection}
        actions={bulkActions}
      />
    </div>
  );
}
