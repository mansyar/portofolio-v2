import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { UsesItemForm } from '../../../components/features/UsesItemForm';

export const Route = createFileRoute('/admin/uses/new')({
  component: NewUsesItemPage,
});

function NewUsesItemPage() {
  const items = useQuery(api.uses.listAll);
  const nextDisplayOrder = items ? items.length : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-(--color-text-primary)">Add New Item</h1>
        <p className="text-sm text-(--color-text-secondary) font-mono mt-1">
          Add a new tool, app, or piece of hardware to your /uses page
        </p>
      </div>

      <UsesItemForm 
        mode="create" 
        initialData={{
          name: '',
          category: '',
          displayOrder: nextDisplayOrder,
          isVisible: true
        }} 
      />
    </div>
  );
}
