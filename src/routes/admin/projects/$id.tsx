import { createFileRoute, useRouter } from '@tanstack/react-router'
import { ProjectForm, ProjectFormData } from '@/components/features/ProjectForm'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { useState } from 'react'
import { Id } from '../../../../convex/_generated/dataModel'

export const Route = createFileRoute('/admin/projects/$id')({
  component: EditProjectPage,
})

function EditProjectPage() {
  const { id } = Route.useParams()
  const project = useQuery(api.projects.getById, { id: id as Id<"projects"> })
  const updateProject = useMutation(api.projects.update)
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true)
    try {
      await updateProject({
        id: id as Id<"projects">,
        ...data
      })
      router.navigate({ to: '/admin/projects' })
    } catch (error) {
      console.error('Failed to update project:', error)
      alert('Failed to update project.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!project) {
    return <div className="p-8 text-center animate-pulse">Loading project data...</div>
  }

  return (
    <ProjectForm 
      title={`Edit: ${project.title}`}
      initialData={project as unknown as ProjectFormData}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  )
}
