import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { SkillForm } from '../../../components/features/SkillForm';

export const Route = createFileRoute('/admin/skills/new')({
  component: NewSkillPage,
});

function NewSkillPage() {
  // We can fetch existing skills to determine the next display order
  const skills = useQuery(api.skills.listAll);
  
  const nextDisplayOrder = skills ? skills.length : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-(--color-text-primary)">Add New Skill</h1>
        <p className="text-sm text-(--color-text-secondary) font-mono mt-1">
          Create a new entry in your technical skills matrix
        </p>
      </div>

      <SkillForm 
        mode="create" 
        initialData={{
          name: '',
          category: 'frontend',
          proficiency: 50,
          displayOrder: nextDisplayOrder,
          isVisible: true
        }} 
      />
    </div>
  );
}
