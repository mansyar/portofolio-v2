import { createFileRoute, useRouter } from '@tanstack/react-router'
import { SkillForm, SkillFormData } from '@/components/features/SkillForm'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { useState } from 'react'
import { Id } from '../../../../convex/_generated/dataModel'

export const Route = createFileRoute('/admin/skills/$id')({
  component: EditSkillPage,
})

function EditSkillPage() {
  const { id } = Route.useParams()
  const skill = useQuery(api.skills.getById, { id: id as Id<"skills"> })
  const updateSkill = useMutation(api.skills.update)
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: SkillFormData) => {
    setIsSubmitting(true)
    try {
      await updateSkill({
        id: id as Id<"skills">,
        ...data
      })
      router.navigate({ to: '/admin/skills' })
    } catch (error) {
      console.error('Failed to update skill:', error)
      alert('Failed to update skill.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!skill) {
    return <div className="p-8 text-center animate-pulse">Loading skill data...</div>
  }

  return (
    <SkillForm 
      title={`Edit ${skill.name}`}
      initialData={skill as unknown as SkillFormData} 
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  )
}
