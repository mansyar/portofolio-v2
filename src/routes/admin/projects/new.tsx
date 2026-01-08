import { createFileRoute, useRouter } from '@tanstack/react-router'
import { ProjectForm, ProjectFormData } from '@/components/features/ProjectForm'
import { useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { useState } from 'react'

export const Route = createFileRoute('/admin/projects/new')({
  component: NewProjectPage,
})

function NewProjectPage() {
  const createProject = useMutation(api.projects.create)
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true)
    try {
      await createProject(data)
      router.navigate({ to: '/admin/projects' })
    } catch (error) {
      console.error('Failed to create project:', error)
      alert('Failed to create project. Check console.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ProjectForm 
      title="Initialize New Project"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  )
}
