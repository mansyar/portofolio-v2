import { createFileRoute } from '@tanstack/react-router'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '../../convex/_generated/api'
import { Seo } from '../components/seo'
import { Suspense } from 'react'
import { ProfileSection } from '../components/features/about/ProfileSection'
import { ExperienceSection } from '../components/features/about/ExperienceSection'
import { EducationSection } from '../components/features/about/EducationSection'
import { SectionSkeleton } from '../components/ui/section-skeleton'

export const Route = createFileRoute('/about')({
  component: About,
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(convexQuery(api.resume.getProfile, {})),
      context.queryClient.ensureQueryData(convexQuery(api.resume.getExperiences, {})),
      context.queryClient.ensureQueryData(convexQuery(api.resume.getEducation, {})),
    ])
  }
})

function About() {
  return (
    <div className="flex flex-col gap-12 pb-20">
      <Seo 
        title="About Me | Portfolio" 
        description="My professional journey from Full-Stack Development to DevOps. Explore my experience, technical skills, and educational background." 
      />

      <Suspense fallback={
        <div className="container px-4 pt-10 md:px-6">
          <div className="h-64 animate-pulse rounded-lg bg-(--color-surface-brighter)" />
        </div>
      }>
        <ProfileSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton title="Experience" variant="timeline" />}>
        <ExperienceSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton title="Education" variant="timeline" />}>
        <EducationSection />
      </Suspense>
    </div>
  )
}
