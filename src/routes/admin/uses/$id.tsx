import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { UsesItemForm } from '../../../components/features/UsesItemForm';

export const Route = createFileRoute('/admin/uses/$id')({
  component: EditUsesItemPage,
});

function EditUsesItemPage() {
  const { id } = Route.useParams();
  const item = useQuery(api.uses.getById, { id: id as Id<"usesItems"> });

  if (item === undefined) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-(--color-ubuntu-orange) border-t-transparent" />
      </div>
    );
  }

  if (item === null) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-(--color-text-secondary)">
        <p className="font-mono">Item not found</p>
        <button 
          onClick={() => history.back()}
          className="terminal-button"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-(--color-text-primary)">Edit Item</h1>
        <p className="text-sm text-(--color-text-secondary) font-mono mt-1">
          Update details for "{item.name}"
        </p>
      </div>

      <UsesItemForm 
        mode="edit" 
        initialData={{
          id: item._id,
          name: item.name,
          category: item.category,
          description: item.description,
          url: item.url,
          imageUrl: item.imageUrl,
          displayOrder: item.displayOrder,
          isVisible: item.isVisible,
        }} 
      />
    </div>
  );
}
