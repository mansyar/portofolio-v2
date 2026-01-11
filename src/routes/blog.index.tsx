import { createFileRoute } from '@tanstack/react-router'
import { Seo } from '../components/seo'
import { Terminal } from 'lucide-react'
import { z } from 'zod'
import { Suspense } from 'react'
import { BlogContent } from '../components/features/blog/BlogContent'
import { SectionSkeleton } from '../components/ui/section-skeleton'
import { TagCloud } from '../components/features/TagCloud'

const blogSearchSchema = z.object({
  page: z.number().default(1),
  category: z.string().optional(),
  tag: z.string().optional(),
})

export const Route = createFileRoute('/blog/')({
  component: Blog,
  validateSearch: blogSearchSchema,
  loaderDeps: ({ search: { page, category, tag } }) => ({ page, category, tag }),
  loader: async () => {
    // Prefetching logic...
  }
})

function Blog() {
  const { page, category, tag } = Route.useSearch()
  
  return (
    <div className="container flex flex-col gap-8 px-4 pt-10 pb-20 md:px-6">
      <Seo 
        title="Blog | Portfolio" 
        description="Thoughts, tutorials, and insights on web development and DevOps." 
      />

      <div className="flex flex-col gap-4">
        <h1 className="flex items-center gap-3 text-3xl font-bold md:text-4xl">
          <Terminal className="text-(--color-ubuntu-orange)" />
          Blog
        </h1>
        <p className="max-w-2xl text-(--color-text-secondary)">
          Writings on code, infrastructure, and the tech industry.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <Suspense fallback={<SectionSkeleton items={6} />}>
          <BlogContent page={page} category={category} tag={tag} />
        </Suspense>

        <aside className="space-y-8">
          <Suspense fallback={<div className="h-48 animate-pulse bg-(--color-surface) rounded" />}>
            <TagCloud />
          </Suspense>
        </aside>
      </div>
    </div>
  )
}
