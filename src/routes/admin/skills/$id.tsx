import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { SkillForm, SkillCategory } from '../../../components/features/SkillForm';

export const Route = createFileRoute('/admin/skills/$id')({
  component: EditSkillPage,
});

function EditSkillPage() {
  const { id } = Route.useParams();
  const skill = useQuery(api.skills.getById, { id: id as Id<"skills"> });

  if (skill === undefined) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-(--color-ubuntu-orange) border-t-transparent" />
      </div>
    );
  }

  if (skill === null) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-(--color-text-secondary)">
        <p className="font-mono">Skill not found</p>
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
        <h1 className="text-2xl font-bold text-(--color-text-primary)">Edit Skill</h1>
        <p className="text-sm text-(--color-text-secondary) font-mono mt-1">
          Update skill details and proficiency
        </p>
      </div>

      <SkillForm 
        mode="edit" 
        initialData={{
            id: skill._id,
            name: skill.name,
            category: skill.category as SkillCategory, // Cast assuming DB matches type
            icon: skill.icon,
            proficiency: skill.proficiency,
            yearsOfExperience: skill.yearsOfExperience,
            description: skill.description,
            displayOrder: skill.displayOrder,
            isVisible: skill.isVisible,
        }} 
      />
    </div>
  );
}
