import { createFileRoute, useRouter } from '@tanstack/react-router'
import { SkillForm, SkillFormData } from '@/components/features/SkillForm'
import { useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { useState } from 'react'

export const Route = createFileRoute('/admin/skills/new')({
  component: NewSkillPage,
})

function NewSkillPage() {
  const createSkill = useMutation(api.skills.create)
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: SkillFormData) => {
    setIsSubmitting(true)
    try {
      await createSkill(data)
      router.navigate({ to: '/admin/skills' })
    } catch (error) {
      console.error('Failed to create skill:', error)
      alert('Failed to create skill. Check console for details.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SkillForm 
      title="Add New Skill"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  )
}
