import { createFileRoute } from '@tanstack/react-router'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '../../convex/_generated/api'
import { Seo } from '../components/seo'
import { Terminal } from 'lucide-react'
import { Suspense } from 'react'
import { UsesContent } from '../components/features/uses/UsesContent'
import { SectionSkeleton } from '../components/ui/section-skeleton'

export const Route = createFileRoute('/uses')({
  component: Uses,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(convexQuery(api.uses.listVisible, {}))
  }
})

function Uses() {
  return (
    <div className="container flex flex-col gap-8 px-4 pt-10 pb-20 md:px-6">
      <Seo 
        title="Uses | Portfolio" 
        description="A list of hardware, software, and tools I use on a daily basis." 
      />

      <div className="flex flex-col gap-4">
        <h1 className="flex items-center gap-3 text-3xl font-bold md:text-4xl">
          <Terminal className="text-(--color-ubuntu-orange)" />
          /uses
        </h1>
        <p className="max-w-2xl text-(--color-text-secondary)">
          A curated list of the tech I use, from editor themes to desk setup.
        </p>
      </div>

      <Suspense fallback={<SectionSkeleton variant="list" items={4} />}>
        <UsesContent />
      </Suspense>
    </div>
  )
}
